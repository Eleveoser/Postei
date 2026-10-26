"use server";

import { createClient } from "@/lib/supabase/server";
import { registrarEvento } from "@/lib/eventos";
import { listarServicos } from "@/lib/calendario";

export type Diferencial = { servico: string; texto: string };
export type ResultadoDiferenciais = { ok: true } | { ok: false; erro: string };

export async function salvarDiferenciais(lista: Diferencial[]): Promise<ResultadoDiferenciais> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão acabou. Entre de novo para continuar." };

  const { data: marca } = await supabase.from("marcas").select("servicos").eq("cliente_id", user.id).maybeSingle();
  if (!marca) return { ok: false, erro: "Monte a sua marca antes." };

  const validos = new Set(listarServicos(marca.servicos));
  const limpos = (lista ?? [])
    .map((d) => ({ servico: String(d.servico ?? "").trim().slice(0, 60), texto: String(d.texto ?? "").trim().slice(0, 240) }))
    .filter((d) => d.texto && validos.has(d.servico))
    .slice(0, 10);

  const { error } = await supabase
    .from("marcas")
    .update({ diferenciais: limpos, atualizado_em: new Date().toISOString() })
    .eq("cliente_id", user.id);
  if (error) return { ok: false, erro: "Não consegui salvar agora. Tente de novo em instantes." };

  await registrarEvento(supabase, user.id, "diferenciais_salvos", { quantidade: limpos.length });
  return { ok: true };
}

export async function pularDiferenciais() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await registrarEvento(supabase, user.id, "diferenciais_pulados");
}
