import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { marcaParaArte, type MarcaBanco } from "@/lib/marca-arte";
import { TIPOS_NEGOCIO } from "@/lib/marca-data";
import { principaisDe } from "@/lib/gerar-calendario";
import { registrarEvento } from "@/lib/eventos";
import KitPerfil from "./kit-perfil";
import PostsBase from "./posts-base";
import type { Profissional } from "./actions";
import { listarServicos } from "@/lib/calendario";

export const metadata = { title: "Kit do perfil" };

export default async function KitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: marca } = await supabase
    .from("marcas")
    .select("nome_exibicao, tipo_negocio, paleta, fonte, conjunto_visual, fundo, texto_cores, logo_url, fundo_url, bairro, cidade, instagram, wa_bio, servicos, concluida_em, apresentacao")
    .eq("cliente_id", user!.id)
    .maybeSingle<MarcaBanco & { bairro: string | null; cidade: string | null; instagram: string | null; wa_bio: boolean | null; servicos: unknown; concluida_em: string | null; apresentacao: { horarios?: [string, string][]; historia?: string; missao?: string; equipe?: unknown[] } | null }>();
  if (!marca?.concluida_em) redirect("/app/marca");
  await registrarEvento(supabase, user!.id, "kit_perfil_aberto");

  const tipo = TIPOS_NEGOCIO.find((t) => t.id === marca.tipo_negocio);
  return (
    <>
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
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">O kit do seu perfil</h1>
          <p className="text-base font-medium leading-snug text-[#4A4F6B]">
            Três posts que, fixados no topo, formam a vitrine do seu Instagram. É a primeira coisa que uma cliente nova vê.
          </p>
        </div>
        <KitPerfil
          marca={marcaParaArte(marca)}
          logoUrl={marca.logo_url}
          tipoNegocio={marca.tipo_negocio ?? "outro"}
          rotulo={tipo?.nome ?? "Beleza e bem-estar"}
          nome={marca.nome_exibicao ?? ""}
          local={[marca.bairro, marca.cidade].filter(Boolean).join(" · ")}
          instagram={marca.instagram ? `@${marca.instagram}` : ""}
          waBio={!!marca.wa_bio}
          principais={principaisDe(marca.servicos)}
        />
        <PostsBase
          userId={user!.id}
          marca={marcaParaArte(marca)}
          logoUrl={marca.logo_url}
          nome={marca.nome_exibicao ?? ""}
          canal={marca.wa_bio ? "no WhatsApp (link na bio)" : "no direct"}
          servicos={listarServicos(marca.servicos).map((n) => ({ nome: n, principal: principaisDe(marca.servicos).includes(n) }))}
          inicial={{
            horarios: Array.isArray(marca.apresentacao?.horarios) ? marca.apresentacao!.horarios! : [],
            historia: marca.apresentacao?.historia ?? "",
            missao: marca.apresentacao?.missao ?? "",
            equipe: Array.isArray(marca.apresentacao?.equipe) ? (marca.apresentacao!.equipe as Profissional[]) : [],
          }}
        />
      </div>
    </>
  );
}
