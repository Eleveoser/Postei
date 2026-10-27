import { createClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, listarServicos } from "@/lib/calendario";
import { registrarEvento } from "@/lib/eventos";
import MarcaWizard from "./wizard";
import type { DadosMarca, NichoPrivado } from "./tipos";
import { ehHex } from "@/lib/marca-cores";

export const metadata = { title: "Monte a sua marca" };

export default async function MarcaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cliente }, { data: marca }, { data: privados }] = await Promise.all([
    supabase.from("clientes").select("nome_negocio, telefone").eq("id", user!.id).single(),
    supabase.from("marcas").select("*").eq("cliente_id", user!.id).maybeSingle(),
    // o banco só devolve linhas para a administradora; para as demais clientes a lista vem vazia
    supabase.from("nichos_privados").select("id, nome, frase, voz, sugestao, catalogo").order("nome"),
  ]);

  const concluida = !!marca?.concluida_em;
  const travada = concluida && !!marca?.trava_30_dias_fim && marca.trava_30_dias_fim >= hojeSaoPaulo();

  await registrarEvento(supabase, user!.id, concluida ? "marca_aberta_edicao" : "marca_aberta");

  const nomeInicial =
    marca?.nome_exibicao || (cliente?.nome_negocio && cliente.nome_negocio !== "Meu negócio" ? cliente.nome_negocio : "");

  const inicial: DadosMarca = {
    tipo: marca?.tipo_negocio ?? "",
    nome: nomeInicial,
    instagram: marca?.instagram ?? "",
    bairro: marca?.bairro ?? "",
    cidade: marca?.cidade ?? "",
    telefone: cliente?.telefone ?? "",
    servicos: listarServicos(marca?.servicos),
    principais: Array.isArray(marca?.servicos)
      ? (marca!.servicos as unknown[]).flatMap((x) =>
          x && typeof x === "object" && "nome" in x && (x as { principal?: unknown }).principal
            ? [String((x as { nome: unknown }).nome)]
            : [],
        )
      : [],
    palId: marca?.paleta?.id && marca.paleta.id !== "custom" ? marca.paleta.id : "",
    inv: !!marca?.paleta?.inv,
    custom:
      marca?.paleta?.custom && ehHex(marca.paleta.custom.c1) && ehHex(marca.paleta.custom.c2) && ehHex(marca.paleta.custom.c3)
        ? { c1: marca.paleta.custom.c1, c2: marca.paleta.custom.c2, c3: marca.paleta.custom.c3 }
        : null,
    deLogo: !!marca?.paleta?.deLogo,
    fonte: marca?.fonte ?? "",
    conjunto: marca?.conjunto_visual ?? "",
    logoUrl: marca?.logo_url ?? null,
    fundo: marca?.fundo === "nenhum" || marca?.fundo === "foto" ? marca.fundo : "icone",
    fundoUrl: marca?.fundo_url ?? null,
    txtL: marca?.texto_cores?.l === "main" ? "main" : "ink",
    txtD: marca?.texto_cores?.d === "accent" ? "accent" : marca?.texto_cores?.d === "off" ? "off" : "white",
    tom: marca?.tom_voz ?? "",
    waBio: !!marca?.wa_bio,
    whatsapp: marca?.whatsapp ?? "",
    dias: Array.isArray(marca?.dias_semana) ? marca!.dias_semana : [],
  };

  return (
    <>
      {/* Letras usadas na prévia da arte (desenhada no celular, sem custo de servidor) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700&family=Cormorant+Garamond:wght@700&family=Gloock&family=Montserrat:wght@700&family=Playfair+Display:ital,wght@1,700&display=swap"
      />
      <MarcaWizard
        userId={user!.id}
        inicial={inicial}
        concluida={concluida}
        identidadeTravada={travada}
        nichosPrivados={(privados ?? []) as NichoPrivado[]}
        travaAte={travada ? marca!.trava_30_dias_fim : null}
      />
    </>
  );
}
