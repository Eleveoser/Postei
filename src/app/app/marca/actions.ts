"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarEvento } from "@/lib/eventos";
import { addDias, hojeSaoPaulo } from "@/lib/calendario";
import { coresFinais, ehHex } from "@/lib/marca-cores";
import { normalizaWhatsapp } from "@/lib/whatsapp";
import {
  CONJUNTOS,
  FONTS,
  MAX_SERVICOS,
  PALETTES,
  TERMO_MARCA,
  TIPOS_NEGOCIO,
  TONS,
  planoDoRitmo,
} from "@/lib/marca-data";
import type { DadosMarca } from "./tipos";

export type MarcaPayload = DadosMarca & {
  passo: number;
  finalizar: boolean;
  aceite: boolean;
};

export type ResultadoMarca = { ok: true } | { ok: false; erro: string };

const limpa = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function salvarMarca(p: MarcaPayload): Promise<ResultadoMarca> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão acabou. Entre de novo para continuar." };

  // nicho público, ou nicho privado que o banco só entrega à administradora
  let voz: "negocio" | "pessoa" = "negocio";
  let tipo: string | null = TIPOS_NEGOCIO.some((t) => t.id === p.tipo) ? p.tipo : null;
  if (!tipo && typeof p.tipo === "string" && p.tipo.startsWith("priv-")) {
    const { data: priv } = await supabase.from("nichos_privados").select("id, voz").eq("id", p.tipo).maybeSingle();
    if (priv) {
      tipo = priv.id;
      voz = priv.voz === "pessoa" ? "pessoa" : "negocio";
    }
  }
  const pal = PALETTES.find((x) => x.id === p.palId);
  const fonte = FONTS.find((f) => f.id === p.fonte);
  const conjunto = CONJUNTOS.find((c) => c.id === p.conjunto);
  const dias = [...new Set((p.dias ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
    (a, b) => a - b,
  );
  const servicos = [...new Set((p.servicos ?? []).map((s) => limpa(s, 60)).filter(Boolean))].slice(0, MAX_SERVICOS);
  const principais = new Set((p.principais ?? []).map((s) => limpa(s, 60)));
  const servicosMarcados = servicos.map((nome) => ({ nome, principal: principais.has(nome) }));
  const custom =
    p.custom && ehHex(p.custom.c1) && ehHex(p.custom.c2) && ehHex(p.custom.c3)
      ? { c1: p.custom.c1, c2: p.custom.c2, c3: p.custom.c3, ...(ehHex(p.custom.bg) ? { bg: p.custom.bg } : {}) }
      : null;
  const tom = TONS.find((t) => t.id === p.tom)?.id ?? null;
  const fundo = p.fundo === "nenhum" || p.fundo === "foto" ? p.fundo : "icone";
  const textoCores = {
    l: p.txtL === "main" ? "main" : "ink",
    d: p.txtD === "accent" ? "accent" : p.txtD === "off" ? "off" : "white",
  };
  const whatsapp = normalizaWhatsapp(p.whatsapp);
  const telefone = normalizaWhatsapp(p.telefone);
  const instagram = limpa(p.instagram, 40).replace(/^@+/, "").replace(/\s+/g, "");
  const nome = limpa(p.nome, 80);

  if (p.finalizar) {
    if (!tipo) return { ok: false, erro: "Escolha o tipo do seu negócio." };
    if (!nome) return { ok: false, erro: "Escreva o nome do seu negócio." };
    if (!telefone) return { ok: false, erro: "Confira o seu telefone pessoal: use DDD e o número." };
    if (servicos.length === 0) return { ok: false, erro: "Escolha pelo menos um serviço." };
    if ((!pal && !custom) || !fonte || !conjunto) return { ok: false, erro: "Escolha as cores, a letra e o estilo do feed." };
    if (!tom) return { ok: false, erro: "Escolha o tom de voz." };
    if (p.waBio && !whatsapp) return { ok: false, erro: "Confira o número de WhatsApp: use DDD e o telefone." };
    if (dias.length === 0) return { ok: false, erro: "Escolha os dias em que quer postar." };
    if (!p.aceite) return { ok: false, erro: "Marque que você leu e confirma para salvar." };
  }

  const { data: existente } = await supabase
    .from("marcas")
    .select("id, concluida_em, trava_30_dias_fim, paleta, fonte, conjunto_visual, logo_url, fundo, fundo_url, texto_cores")
    .eq("cliente_id", user.id)
    .maybeSingle();

  // A identidade visual fica travada por 30 dias depois de confirmada.
  const travada = !!existente?.concluida_em && !!existente.trava_30_dias_fim && existente.trava_30_dias_fim >= hojeSaoPaulo();

  const prefixoLogo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${user.id}/`;
  const identidade: Record<string, unknown> = travada
    ? {
        paleta: existente!.paleta,
        fonte: existente!.fonte,
        conjunto_visual: existente!.conjunto_visual,
        logo_url: existente!.logo_url,
        fundo: existente!.fundo,
        fundo_url: existente!.fundo_url,
        texto_cores: existente!.texto_cores,
      }
    : {
        ...(pal || custom
          ? {
              paleta: {
                id: pal?.id ?? "custom",
                inv: !!p.inv,
                deLogo: !!p.deLogo && !!custom,
                custom,
                final: coresFinais(pal, custom, !!p.inv),
              },
            }
          : {}),
        ...(fonte ? { fonte: fonte.id } : {}),
        ...(conjunto ? { conjunto_visual: conjunto.id } : {}),
        logo_url: p.logoUrl && p.logoUrl.startsWith(prefixoLogo) ? p.logoUrl : null,
        fundo,
        fundo_url: fundo === "foto" && p.fundoUrl && p.fundoUrl.startsWith(prefixoLogo) ? p.fundoUrl : null,
        texto_cores: textoCores,
      };

  const registro = {
    cliente_id: user.id,
    ...(tipo ? { tipo_negocio: tipo } : {}),
    nome_exibicao: nome || null,
    instagram: instagram || null,
    bairro: limpa(p.bairro, 60) || null,
    cidade: limpa(p.cidade, 60) || null,
    servicos: servicosMarcados,
    dias_semana: dias,
    posts_por_semana: dias.length || null,
    ritmo_postagem: dias.length ? planoDoRitmo(dias.length).id : null,
    tom_voz: tom,
    voz,
    wa_bio: !!p.waBio,
    whatsapp,
    ...identidade,
    ...(p.finalizar && !existente?.concluida_em
      ? { concluida_em: new Date().toISOString(), trava_30_dias_fim: addDias(hojeSaoPaulo(), 30) }
      : {}),
    atualizado_em: new Date().toISOString(),
  };

  const { error } = await supabase.from("marcas").upsert(registro, { onConflict: "cliente_id" });
  if (error) return { ok: false, erro: "Não consegui salvar agora. Tente de novo em instantes." };

  await supabase
    .from("clientes")
    .update({ ...(nome ? { nome_negocio: nome } : {}), ...(telefone ? { telefone } : {}), atualizado_em: new Date().toISOString() })
    .eq("id", user.id);

  if (p.finalizar) {
    if (!existente?.concluida_em) {
      await supabase.from("aceites").insert({ cliente_id: user.id, tipo: "marca_termo", conteudo_aceito: TERMO_MARCA });
    }
    await registrarEvento(supabase, user.id, "marca_concluida", { tipo, posts_por_semana: dias.length });
    revalidatePath("/app");
  } else {
    await registrarEvento(supabase, user.id, "cadastro_passo", { passo: p.passo });
  }
  return { ok: true };
}
