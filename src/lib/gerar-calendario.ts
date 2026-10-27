// Geração do calendário de uma cliente (servidor). Sem IA nesta versão: planejador + compositor
// sobre a biblioteca. Custo de API: zero. Roda com a sessão da própria cliente (RLS); a região é
// consultada por funções do banco que não expõem quem são as outras clientes.

import type { SupabaseClient } from "@supabase/supabase-js";
import { addDias, hojeSaoPaulo, listarServicos } from "./calendario";
import { comporPosts, type AssuntoCompleto, type Convite, type ConteudoPost } from "./compositor";
import { planejar, type Assunto, type PostPlanejado } from "./planejador/planejador";
import { registrarEvento } from "./eventos";

const DIAS_DO_CALENDARIO = 28;
const JANELA_REGIAO = 14;

const semAcento = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
export const regiaoDe = (cidade?: string | null, bairro?: string | null) => `${semAcento(cidade ?? "")}|${semAcento(bairro ?? "")}`;
export const nichoDe = (tipo?: string | null) => (tipo === "salao" || !tipo ? "salao" : tipo);

type MarcaRow = {
  tipo_negocio: string | null;
  nome_exibicao: string | null;
  servicos: unknown;
  dias_semana: number[] | null;
  tom_voz: string | null;
  voz: string | null;
  fundos: unknown;
  wa_bio: boolean | null;
  cidade: string | null;
  bairro: string | null;
  diferenciais: unknown;
  concluida_em: string | null;
};

export function principaisDe(servicos: unknown): string[] {
  return Array.isArray(servicos)
    ? (servicos as unknown[]).flatMap((x) =>
        x && typeof x === "object" && "nome" in x && (x as { principal?: unknown }).principal ? [String((x as { nome: unknown }).nome)] : [],
      )
    : [];
}

export function fundosDe(v: unknown): { url: string; categoria: string }[] {
  return Array.isArray(v)
    ? (v as { url?: unknown; categoria?: unknown }[]).filter((f) => f && typeof f.url === "string").map((f) => ({ url: String(f.url), categoria: String(f.categoria ?? "Geral") }))
    : [];
}

export function diferenciaisDe(v: unknown): { servico: string; texto: string }[] {
  return Array.isArray(v)
    ? (v as { servico?: unknown; texto?: unknown }[]).filter((d) => d && d.servico && d.texto).map((d) => ({ servico: String(d.servico), texto: String(d.texto) }))
    : [];
}

const MIN_ESPECIFICOS = 12; // abaixo disso, o serviço também recebe os assuntos genéricos

const slug = (t: string) => semAcento(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Assuntos genéricos (servico "*") viram assuntos do serviço, com {s} e {S} trocados pelo nome. */
function expandirGenerico<T extends { id: string; servico: string; titulo: string; gancho: string; pontos: string[]; olhar_profissional: string; exemplo: string }>(g: T, servico: string): T {
  const troca = (t: string) => t.replaceAll("{S}", servico).replaceAll("{s}", servico.toLowerCase());
  return {
    ...g,
    id: `${g.id}~${slug(servico)}`,
    servico,
    titulo: troca(g.titulo),
    gancho: troca(g.gancho),
    pontos: g.pontos.map(troca),
    olhar_profissional: troca(g.olhar_profissional),
    exemplo: troca(g.exemplo),
  };
}

export async function carregarBiblioteca(supabase: SupabaseClient, nicho: string, servicos: string[], voz: string = "negocio") {
  // os genéricos falam de atendimento de beleza em voz de negócio: não servem para pilates nem para perfis pessoais
  const usaGenericos = nicho !== "pilates" && voz !== "pessoa"; // os genéricos falam de atendimento de beleza
  const [{ data: aRows, error: eA }, { data: gRows }, { data: cRows, error: eC }] = await Promise.all([
    supabase.from("biblioteca_assuntos").select("*").eq("nicho", nicho).in("servico", servicos.length ? servicos : ["-"]),
    usaGenericos ? supabase.from("biblioteca_assuntos").select("*").eq("nicho", "geral").eq("servico", "*") : Promise.resolve({ data: [] }),
    supabase.from("biblioteca_convites").select("*").eq("voz", voz === "pessoa" ? "pessoa" : "negocio"),
  ]);
  console.info(
    `[postei] biblioteca: nicho=${nicho} servicos=${servicos.length} especificos=${aRows?.length ?? 0} genericos=${gRows?.length ?? 0} convites=${cRows?.length ?? 0}${eA || eC ? ` ERRO=${(eA ?? eC)?.message}` : ""}`,
  );
  if (eA || eC) throw new Error("biblioteca indisponível");
  const especificos = aRows ?? [];
  const genericos = (gRows ?? []) as typeof especificos;
  const comGenericos = [
    ...especificos,
    ...servicos.flatMap((sv) =>
      especificos.filter((r) => r.servico === sv).length < MIN_ESPECIFICOS
        ? genericos.map((g) => expandirGenerico({ ...g, pontos: Array.isArray(g.pontos) ? g.pontos : [] }, sv))
        : [],
    ),
  ];
  const assuntos: (Assunto & AssuntoCompleto)[] = comGenericos.map((r) => ({
    id: r.id,
    servico: r.servico,
    tipo: r.tipo,
    formatos: r.formatos ?? [],
    sazonal: r.sazonal ?? [],
    status: r.status,
    intensidade_convite: r.intensidade_convite,
    titulo: r.titulo,
    gancho: r.gancho,
    pontos: Array.isArray(r.pontos) ? r.pontos : [],
    olhar_profissional: r.olhar_profissional,
    exemplo: r.exemplo,
    veredito: r.veredito,
  }));
  const convites: Convite[] = (cRows ?? []) as Convite[];
  return { assuntos, convites };
}

export type ResultadoGeracao = { ok: true; criados: number } | { ok: false; erro: string };

/** Gera o calendário das próximas 4 semanas, se a cliente ainda não tiver um para este mês. */
export async function gerarCalendarioSeFaltar(supabase: SupabaseClient, clienteId: string): Promise<ResultadoGeracao> {
  const { data: marca } = await supabase
    .from("marcas")
    .select("tipo_negocio, nome_exibicao, servicos, dias_semana, tom_voz, voz, wa_bio, cidade, bairro, diferenciais, fundos, concluida_em")
    .eq("cliente_id", clienteId)
    .maybeSingle<MarcaRow>();
  if (!marca?.concluida_em) return { ok: false, erro: "Monte a sua marca antes." };

  // Só gera quando a programação atual está acabando (menos de 7 dias pela frente),
  // e começa no dia seguinte ao último post, para não sobrepor datas.
  const hoje = hojeSaoPaulo();
  const { data: ultimo } = await supabase
    .from("posts")
    .select("data_publicacao")
    .eq("cliente_id", clienteId)
    .gte("data_publicacao", hoje)
    .order("data_publicacao", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ultimo && ultimo.data_publicacao >= addDias(hoje, 7)) return { ok: true, criados: 0 };
  const inicioGeracao = ultimo ? addDias(ultimo.data_publicacao, 1) : hoje;
  const mesReferencia = `${inicioGeracao.slice(0, 7)}-01`;
  const { data: existente } = await supabase
    .from("calendarios")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("mes_referencia", mesReferencia)
    .maybeSingle();

  try {
    const nicho = nichoDe(marca.tipo_negocio);
    const regiao = regiaoDe(marca.cidade, marca.bairro);
    const nomes = listarServicos(marca.servicos);
    const principais = principaisDe(marca.servicos);
    const inicio = inicioGeracao;
    const fim = addDias(inicio, DIAS_DO_CALENDARIO - 1);

    const { assuntos, convites } = await carregarBiblioteca(supabase, nicho, nomes, marca.voz ?? "negocio");
    const [{ data: meusUsos }, { data: usosRegiao }, { data: posicao }] = await Promise.all([
      supabase.from("uso_assuntos").select("assunto_id, data").eq("cliente_id", clienteId),
      supabase.rpc("assuntos_usados_na_regiao", { p_nicho: nicho, p_regiao: regiao, p_desde: addDias(inicio, -JANELA_REGIAO) }),
      supabase.rpc("posicao_na_regiao", { p_nicho: nicho, p_regiao: regiao }),
    ]);

    const plano: PostPlanejado[] = planejar({
      inicio,
      fim,
      dias: marca.dias_semana ?? [],
      nicho: marca.tipo_negocio ?? "salao",
      servicos: nomes.map((nome) => ({ nome, principal: principais.includes(nome) })),
      assuntos,
      usadosPelaCliente: (meusUsos ?? []).map((u) => ({ assuntoId: u.assunto_id, data: u.data })),
      usadosNaRegiao: ((usosRegiao as { assunto_id: string; data: string }[] | null) ?? []).map((u) => ({ assuntoId: u.assunto_id, data: u.data })),
      posicaoNaRegiao: typeof posicao === "number" ? posicao : 0,
      janelaRegiaoDias: JANELA_REGIAO,
      permitirRascunho: true, // MVP: a biblioteca ainda está em revisão
      personalizadosDisponiveis: ["oferta", "foto"], // depoimento ainda não tem tela para a cliente enviar
    });
    if (!plano.length) return { ok: false, erro: "Escolha os dias em que quer postar." };

    const mapa = new Map(assuntos.map((a) => [a.id, a]));
    const conteudos: ConteudoPost[] = comporPosts(plano, mapa, convites, {
      nome: marca.nome_exibicao ?? "nosso espaço",
      tom: marca.tom_voz ?? "acolhedor",
      voz: marca.voz === "pessoa" ? "pessoa" : "negocio",
      fundos: fundosDe(marca.fundos),
      waBio: !!marca.wa_bio,
      principais,
      servicos: nomes,
      diferenciais: diferenciaisDe(marca.diferenciais),
    });

    // um calendário por mês de referência: se já existe (programação que virou o mês), os posts entram nele
    const cal =
      existente ??
      (
        await supabase
          .from("calendarios")
          .insert({ cliente_id: clienteId, mes_referencia: mesReferencia, status: "pronto" })
          .select("id")
          .single()
      ).data;
    if (!cal) throw new Error("calendario");

    const { error: ePosts } = await supabase.from("posts").insert(
      plano.map((p, i) => ({
        calendario_id: cal.id,
        cliente_id: clienteId,
        data_publicacao: p.data,
        tipo: p.tipoPost,
        conteudo: conteudos[i],
        status: "pendente",
      })),
    );
    if (ePosts) throw ePosts;

    const usos = plano.filter((p) => p.assuntoId).map((p) => ({ cliente_id: clienteId, assunto_id: p.assuntoId!, nicho, regiao, data: p.data }));
    if (usos.length) await supabase.from("uso_assuntos").insert(usos);

    await registrarEvento(supabase, clienteId, "calendario_gerado", {
      posts: plano.length,
      da_biblioteca: conteudos.filter((c) => c.origem === "biblioteca").length,
      provisorios: conteudos.filter((c) => c.provisorio).length,
      custo_api: 0,
    });
    return { ok: true, criados: plano.length };
  } catch (e) {
    console.error("[postei] falha ao gerar calendário:", e);
    return { ok: false, erro: "Não consegui montar a sua programação agora. Tente de novo em instantes." };
  }
}
