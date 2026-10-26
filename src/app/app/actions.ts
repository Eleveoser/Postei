"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TIPOS, hojeSaoPaulo, listarServicos } from "@/lib/calendario";
import { comporPosts } from "@/lib/compositor";
import { carregarBiblioteca, diferenciaisDe, gerarCalendarioSeFaltar, nichoDe, principaisDe } from "@/lib/gerar-calendario";
import { cabeNoFormato, type Intensidade, type TipoPost } from "@/lib/planejador/planejador";
import { registrarEvento } from "@/lib/eventos";

/** A cliente troca o tipo ou o serviço de um dia: o post é recomposto com um assunto novo da biblioteca. */
export async function mudarPost(formData: FormData) {
  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "").trim() as TipoPost;
  const tema = String(formData.get("tema") || "").trim().slice(0, 120);
  if (!id || !TIPOS.some((t) => t.valor === tipo)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // O RLS garante que só o dono do post consegue ler e alterar.
  const { data: post } = await supabase
    .from("posts")
    .select("tipo, conteudo, status, data_publicacao, calendario_id")
    .eq("id", id)
    .single();
  if (!post || post.status === "publicado") return;

  const { data: marca } = await supabase
    .from("marcas")
    .select("tipo_negocio, nome_exibicao, servicos, tom_voz, wa_bio, diferenciais")
    .eq("cliente_id", user.id)
    .maybeSingle();
  if (!marca) return;

  const nomes = listarServicos(marca.servicos);
  const servico = tema || nomes[0] || "";
  const { assuntos, convites } = await carregarBiblioteca(supabase, nichoDe(marca.tipo_negocio), [servico]);

  // não repete assunto já usado neste calendário
  const { data: doCalendario } = await supabase.from("posts").select("conteudo").eq("calendario_id", post.calendario_id);
  const usados = new Set((doCalendario ?? []).map((p) => p.conteudo?.assunto_id).filter(Boolean));
  const assunto =
    tipo === "oferta" || tipo === "foto"
      ? undefined
      : assuntos.filter((a) => a.servico === servico && cabeNoFormato(tipo, a.formatos) && !usados.has(a.id)).sort((a, b) => a.id.localeCompare(b.id))[0];

  const anterior = (post.conteudo?.intensidade ?? 1) as Intensidade;
  const [conteudo] = comporPosts(
    [
      {
        data: post.data_publicacao,
        diaSemana: 0,
        tipoPost: tipo,
        origem: tipo === "oferta" || tipo === "foto" ? "personalizado" : assunto ? "biblioteca" : "gerar",
        servico: servico || null,
        assuntoId: assunto?.id ?? null,
        reciclado: false,
        intensidadeConvite: tipo === "oferta" ? 2 : anterior,
      },
    ],
    new Map(assuntos.map((a) => [a.id, a])),
    convites,
    {
      nome: marca.nome_exibicao ?? "nosso espaço",
      tom: marca.tom_voz ?? "acolhedor",
      waBio: !!marca.wa_bio,
      principais: principaisDe(marca.servicos),
      servicos: nomes,
      diferenciais: diferenciaisDe(marca.diferenciais),
    },
  );

  await supabase.from("posts").update({ tipo, conteudo: { ...conteudo, escolhaCliente: true } }).eq("id", id);
  await registrarEvento(supabase, user.id, "post_trocado", { de: post.tipo, para: tipo, servico });
  revalidatePath("/app");
}

/** Marca o post como publicado (ou desfaz). Alimenta a lista de retenção. */
export async function marcarPublicado(id: string, publicado: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !id) return;
  await supabase.from("posts").update({ status: publicado ? "publicado" : "pendente" }).eq("id", id);
  await registrarEvento(supabase, user.id, publicado ? "post_publicado" : "post_desmarcado", { post: id });
  revalidatePath("/app");
  revalidatePath(`/app/post/${id}`);
}

/** Guarda a legenda que a cliente ajustou (a memória do produto aprende com isso). */
export async function salvarLegenda(id: string, legenda: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !id) return;
  const { data: post } = await supabase.from("posts").select("conteudo").eq("id", id).single();
  if (!post) return;
  const texto = legenda.slice(0, 2200);
  await supabase
    .from("posts")
    .update({ conteudo: { ...(post.conteudo ?? {}), legenda: texto, legendaEditada: true } })
    .eq("id", id);
  await registrarEvento(supabase, user.id, "legenda_editada", { post: id, assunto: post.conteudo?.assunto_id ?? null });
}

/** Registra que a cliente copiou a legenda ou baixou a arte (sinal de uso para a retenção). */
export async function registrarUso(id: string, acao: "copiou_legenda" | "baixou_arte") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await registrarEvento(supabase, user.id, acao, { post: id });
}

/** Apaga os posts futuros ainda não publicados (e que a cliente não mudou) e monta de novo. */
export async function refazerProgramacao(): Promise<{ ok: true } | { ok: false; erro: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão acabou. Entre de novo." };
  const hoje = hojeSaoPaulo();

  const { data: futuros } = await supabase
    .from("posts")
    .select("id, conteudo, status")
    .eq("cliente_id", user.id)
    .gte("data_publicacao", hoje);
  const apagar = (futuros ?? []).filter((p) => p.status !== "publicado");
  if (apagar.length) {
    const { error, count } = await supabase.from("posts").delete({ count: "exact" }).in("id", apagar.map((p) => p.id));
    console.info(`[postei] refazer: pedidos=${apagar.length} apagados=${count ?? 0}${error ? ` ERRO=${error.message}` : ""}`);
    if (error || !count) return { ok: false, erro: "Não consegui apagar os posts antigos. Confira se o SQL 0006 foi rodado no Supabase." };
    const assuntos = apagar.map((p) => p.conteudo?.assunto_id).filter(Boolean) as string[];
    if (assuntos.length) {
      await supabase.from("uso_assuntos").delete().eq("cliente_id", user.id).gte("data", hoje).in("assunto_id", assuntos);
    }
  }
  const r = await gerarCalendarioSeFaltar(supabase, user.id);
  await registrarEvento(supabase, user.id, "programacao_refeita", { apagados: apagar.length });
  revalidatePath("/app");
  return r.ok ? { ok: true } : { ok: false, erro: r.erro };
}
