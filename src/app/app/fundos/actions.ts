"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarEvento } from "@/lib/eventos";

export type Fundo = { id: string; url: string; categoria: string };

const CATEGORIAS = ["Geral", "Palestra", "Mentoria 1:1", "Reunião", "Equipe e celebração"];

/** Guarda a lista de imagens de fundo da cliente (as imagens ficam no Storage, reduzidas no celular). */
export async function salvarFundos(lista: Fundo[]): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const prefixo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${user.id}/`;
  const limpa = (lista ?? [])
    .filter((f) => f && typeof f.url === "string" && f.url.startsWith(prefixo))
    .slice(0, 40)
    .map((f, i) => ({
      id: String(f.id ?? `f${i + 1}`).slice(0, 24),
      url: f.url,
      categoria: CATEGORIAS.includes(f.categoria) ? f.categoria : "Geral",
    }));
  const { error } = await supabase.from("marcas").update({ fundos: limpa, atualizado_em: new Date().toISOString() }).eq("cliente_id", user.id);
  if (!error) {
    await registrarEvento(supabase, user.id, "fundos_salvos", { quantidade: limpa.length });
    revalidatePath("/app");
  }
  return { ok: !error };
}
