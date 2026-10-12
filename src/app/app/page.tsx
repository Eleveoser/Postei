import { createClient } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="px-4 py-8">
      <h1 className="text-xl font-semibold">
        Olá, {cliente?.nome_negocio ?? "tudo certo"} 👋
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Plano: {cliente?.plano} · Status: {cliente?.status_assinatura}
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
        O post do dia e o calendário do mês aparecem aqui — próxima etapa de
        construção.
      </div>
    </div>
  );
}
