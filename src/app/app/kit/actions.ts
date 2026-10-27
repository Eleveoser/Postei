"use server";

import { createClient } from "@/lib/supabase/server";
import { registrarEvento } from "@/lib/eventos";

export type Apresentacao = { horarios: [string, string][]; historia: string };

/** Guarda os horários e a história do negócio, para a cliente não precisar digitar de novo. */
export async function salvarApresentacao(a: Apresentacao): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const horarios = (a.horarios ?? [])
    .map(([d, h]) => [String(d ?? "").trim().slice(0, 24), String(h ?? "").trim().slice(0, 28)] as [string, string])
    .filter(([d, h]) => d && h)
    .slice(0, 7);
  const historia = String(a.historia ?? "").trim().slice(0, 420);
  const { error } = await supabase
    .from("marcas")
    .update({ apresentacao: { horarios, historia }, atualizado_em: new Date().toISOString() })
    .eq("cliente_id", user.id);
  if (!error) await registrarEvento(supabase, user.id, "apresentacao_salva", { horarios: horarios.length, historia: historia.length > 0 });
  return { ok: !error };
}
