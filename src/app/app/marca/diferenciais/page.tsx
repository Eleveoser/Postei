import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarServicos } from "@/lib/calendario";
import DiferenciaisForm from "./form";
import type { Diferencial } from "./actions";

export const metadata = { title: "Seus diferenciais" };

export default async function DiferenciaisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: marca } = await supabase
    .from("marcas")
    .select("servicos, diferenciais, concluida_em")
    .eq("cliente_id", user!.id)
    .maybeSingle();

  if (!marca?.concluida_em) redirect("/app/marca");

  const principais = new Set(
    Array.isArray(marca.servicos)
      ? (marca.servicos as unknown[]).flatMap((x) =>
          x && typeof x === "object" && "nome" in x && (x as { principal?: unknown }).principal
            ? [String((x as { nome: unknown }).nome)]
            : [],
        )
      : [],
  );
  const servicos = listarServicos(marca.servicos).sort((a, b) => Number(principais.has(b)) - Number(principais.has(a)));
  const inicial: Diferencial[] = Array.isArray(marca.diferenciais)
    ? (marca.diferenciais as Diferencial[]).filter((d) => d && d.servico && d.texto)
    : [];

  return <DiferenciaisForm servicos={servicos} principais={[...principais]} inicial={inicial} />;
}
