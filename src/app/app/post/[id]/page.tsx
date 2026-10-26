import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rotuloDia, rotuloTipo } from "@/lib/calendario";
import { marcaParaArte, type MarcaBanco } from "@/lib/marca-arte";
import PostView from "./post-view";

export const metadata = { title: "Seu post" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: post }, { data: marca }] = await Promise.all([
    supabase.from("posts").select("id, data_publicacao, tipo, status, conteudo").eq("id", id).maybeSingle(),
    supabase
      .from("marcas")
      .select("nome_exibicao, tipo_negocio, paleta, fonte, conjunto_visual, fundo, texto_cores, logo_url, fundo_url")
      .eq("cliente_id", user!.id)
      .maybeSingle<MarcaBanco>(),
  ]);
  if (!post || !marca) notFound();

  const c = post.conteudo ?? {};
  return (
    <>
      {/* Letras usadas na arte (desenhada no celular, sem custo de servidor) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700&family=Cormorant+Garamond:wght@700&family=Gloock&family=Montserrat:wght@700&family=Playfair+Display:ital,wght@1,700&display=swap"
      />
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-10 pt-5 text-[#0E1330]">
        <Link href="/app" className="flex min-h-11 items-center gap-2 text-[15px] font-extrabold underline">
          ← Voltar para a programação
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4A4F6B]">{rotuloDia(post.data_publicacao)}</p>
          <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            {rotuloTipo(post.tipo)}
            {c.servico ? ` · ${c.servico}` : ""}
          </h1>
        </div>
        <PostView
          id={post.id}
          tipo={post.tipo}
          servico={c.servico ?? ""}
          marca={marcaParaArte(marca)}
          logoUrl={marca.logo_url}
          fundoUrl={marca.fundo_url}
          arte={c.arte ?? null}
          legendaInicial={c.legenda ?? ""}
          roteiro={Array.isArray(c.roteiro) ? c.roteiro : []}
          publicado={post.status === "publicado"}
        />
      </div>
    </>
  );
}
