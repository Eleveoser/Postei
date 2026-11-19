import type { SupabaseClient } from "@supabase/supabase-js";
import { fimSemana, hojeSaoPaulo, inicioSemana } from "./calendario";

/** Posts avulsos ("faça o post do seu jeito") que cada período dá de crédito. */
export const CREDITOS_AVULSOS = 4;

export type PeriodoAtual = { inicio: string; fim: string };

/**
 * Período em andamento da cliente (semanas cheias, seg a dom), ou null se não houver programação.
 * Custo: 2 consultas pequenas (só datas), sem chamada externa.
 */
export async function periodoAtual(supabase: SupabaseClient, clienteId: string): Promise<PeriodoAtual | null> {
  const hoje = hojeSaoPaulo();
  const { data: futuros } = await supabase
    .from("posts")
    .select("data_publicacao, calendario_id")
    .eq("cliente_id", clienteId)
    .gte("data_publicacao", inicioSemana(hoje))
    .order("data_publicacao");
  const linhas = (futuros ?? []) as { data_publicacao: string; calendario_id: string }[];
  if (!linhas.length) return null;

  const porCal = new Map<string, string[]>();
  for (const l of linhas) porCal.set(l.calendario_id, [...(porCal.get(l.calendario_id) ?? []), l.data_publicacao]);
  const candidatos = [...porCal.entries()]
    .map(([id, datas]) => ({ id, fim: fimSemana(datas[datas.length - 1]), primeiro: inicioSemana(datas[0]) }))
    .filter((c) => c.primeiro <= hoje && hoje <= c.fim)
    .sort((a, b) => b.fim.localeCompare(a.fim));
  const ativo = candidatos[0];
  if (!ativo) return null;

  const { data: primeiro } = await supabase
    .from("posts")
    .select("data_publicacao")
    .eq("cliente_id", clienteId)
    .eq("calendario_id", ativo.id)
    .order("data_publicacao")
    .limit(1)
    .maybeSingle();
  return { inicio: inicioSemana(primeiro?.data_publicacao ?? hoje), fim: ativo.fim };
}

/** Quantos créditos de post avulso a cliente já usou neste período (cada criação conta uma vez). */
export async function creditosUsados(supabase: SupabaseClient, clienteId: string, desde: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("eventos_uso")
    .select("meta")
    .eq("cliente_id", clienteId)
    .eq("tipo", "credito_avulso")
    .gte("criado_em", `${desde}T00:00:00-03:00`);
  return new Set(((data ?? []) as { meta: { criacao?: string } }[]).map((r) => r.meta?.criacao ?? "").filter(Boolean));
}
