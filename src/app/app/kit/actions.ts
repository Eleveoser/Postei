"use server";

import { createClient } from "@/lib/supabase/server";
import { registrarEvento } from "@/lib/eventos";

export type CampoEquipe = "nome" | "funcao" | "servicos" | "anos" | "clientes" | "formacao" | "detalhe";
export const CAMPOS_EQUIPE: CampoEquipe[] = ["nome", "funcao", "servicos", "anos", "clientes", "formacao", "detalhe"];

export type Profissional = {
  id: string;
  campos: CampoEquipe[]; // o que a cliente escolheu mostrar neste post
  nome: string;
  funcao: string;
  servicos: string[];
  anos: string;
  clientes: string;
  formacao: string;
  detalhe: string;
  foto_url: string | null;
};

export type Apresentacao = { horarios: [string, string][]; historia: string; missao: string; equipe: Profissional[] };

const t = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const num = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 5);

/** Guarda horários, história e equipe. A foto de cada profissional fica no Storage (reduzida no celular). */
export async function salvarApresentacao(a: Apresentacao): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const prefixo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${user.id}/`;

  const horarios = (a.horarios ?? [])
    .map(([d, h]) => [t(d, 24), t(h, 28)] as [string, string])
    .filter(([d, h]) => d && h)
    .slice(0, 7);
  const historia = t(a.historia, 1000);
  const missao = t(a.missao, 500);
  const equipe = (a.equipe ?? []).slice(0, 8).map((p, i) => ({
    id: t(p.id, 24) || `p${i + 1}`,
    campos: (p.campos ?? []).filter((c): c is CampoEquipe => CAMPOS_EQUIPE.includes(c)),
    nome: t(p.nome, 40),
    funcao: t(p.funcao, 40),
    servicos: (p.servicos ?? []).map((s) => t(s, 40)).filter(Boolean).slice(0, 6),
    anos: num(p.anos),
    clientes: num(p.clientes),
    formacao: t(p.formacao, 90),
    detalhe: t(p.detalhe, 110),
    foto_url: p.foto_url && p.foto_url.startsWith(prefixo) ? p.foto_url : null,
  }));

  const { error } = await supabase
    .from("marcas")
    .update({ apresentacao: { horarios, historia, missao, equipe }, atualizado_em: new Date().toISOString() })
    .eq("cliente_id", user.id);
  if (!error) {
    await registrarEvento(supabase, user.id, "apresentacao_salva", {
      horarios: horarios.length,
      historia: historia.length > 0,
      missao: missao.length > 0,
      equipe: equipe.length,
    });
  }
  return { ok: !error };
}
