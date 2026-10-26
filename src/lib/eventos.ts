import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Registra um evento de uso do cliente. Base da lista de retenção e do controle
 * semanal; falha em silêncio para nunca atrapalhar a tela da cliente.
 * Custo: uma linha pequena por evento (texto curto), sem chamada externa.
 */
export async function registrarEvento(
  supabase: SupabaseClient,
  clienteId: string,
  tipo: string,
  meta: Record<string, unknown> = {},
) {
  try {
    await supabase.from("eventos_uso").insert({ cliente_id: clienteId, tipo, meta });
  } catch {
    // evento de uso é secundário
  }
}
