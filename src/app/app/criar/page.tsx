import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarServicos } from "@/lib/calendario";
import { marcaParaArte, type MarcaBanco } from "@/lib/marca-arte";
import CriarView from "./criar-view";

export const metadata = { title: "Faça o post do seu jeito" };

// Self-service: a cliente escolhe o assunto, a foto e escreve a legenda; a arte sai pronta no celular.
// Custo: nenhuma chamada de IA e nenhum arquivo guardado (a arte é desenhada no aparelho).
export default async function CriarPost() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: marca } = await supabase
    .from("marcas")
    .select("nome_exibicao, tipo_negocio, paleta, fonte, conjunto_visual, fundo, texto_cores, logo_url, fundo_url, servicos")
    .eq("cliente_id", user!.id)
    .maybeSingle<MarcaBanco & { servicos: unknown }>();
  if (!marca) redirect("/app/marca");

  return (
    <>
      {/* Letras usadas na arte (desenhada no celular, sem custo de servidor) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700&family=Cormorant+Garamond:wght@500;700&family=Gloock&family=Montserrat:wght@700&family=Playfair+Display:ital,wght@1,700&family=Philosopher:wght@700&display=swap"
      />
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-12 pt-5 text-[#0E1330]">
        <Link href="/app" className="flex min-h-11 items-center gap-2 text-[15px] font-extrabold underline">
          ← Voltar para a programação
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]">Faça o post do seu jeito</h1>
          <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
            Escolha o assunto, a foto e escreva a legenda. A arte sai pronta, com a sua marca.
          </p>
        </div>
        <CriarView
          marca={marcaParaArte(marca)}
          logoUrl={marca.logo_url}
          fundoUrl={marca.fundo_url}
          servicos={listarServicos(marca.servicos)}
        />
      </div>
    </>
  );
}
