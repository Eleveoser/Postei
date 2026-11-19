import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ponto único para travar o acesso aos posts de quem não está com a assinatura em dia.
 * Por enquanto tudo é liberado (o Postei está no teste gratuito e ainda não há cobrança).
 * Quando a cobrança existir, é aqui que se checa o pagamento do período.
 */
export async function assinaturaAtiva(supabase: SupabaseClient, clienteId: string): Promise<boolean> {
  void supabase;
  void clienteId;
  return true;
}
