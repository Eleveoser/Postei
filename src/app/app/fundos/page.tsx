import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FundosEditor from "./fundos-editor";
import type { Fundo } from "./actions";

export const metadata = { title: "Imagens de fundo" };

export default async function FundosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: marca } = await supabase.from("marcas").select("fundos, concluida_em").eq("cliente_id", user!.id).maybeSingle();
  if (!marca?.concluida_em) redirect("/app/marca");
  const fundos = (Array.isArray(marca.fundos) ? marca.fundos : []) as Fundo[];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-10 pt-5 text-[#0E1330]">
      <Link href="/app" className="flex min-h-11 items-center gap-2 text-[15px] font-extrabold underline">
        ← Voltar para a programação
      </Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Imagens de fundo</h1>
        <p className="text-base font-medium leading-snug text-[#4A4F6B]">
          Suba as suas fotos ou artes uma vez. O app usa as imagens como fundo dos posts de dica e de mito ou verdade, alternando entre elas para o perfil não repetir.
        </p>
      </div>
      <FundosEditor userId={user!.id} inicial={fundos} />
    </div>
  );
}
