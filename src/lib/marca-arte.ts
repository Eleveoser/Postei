// Monta a marca para o motor de arte a partir do que está salvo no banco (tabela marcas).
// Sem imagens: o logo e a foto de fundo são carregados no navegador e entram depois.

import type { Brand } from "./art-engine";
import { coresFinais, ehHex, txtDe } from "./marca-cores";
import { CONJUNTOS, PALETTES } from "./marca-data";

export type MarcaBanco = {
  nome_exibicao: string | null;
  tipo_negocio: string | null;
  paleta: { id?: string; inv?: boolean; custom?: { c1: string; c2: string; c3: string } | null; final?: { c1: string; c2: string; c3: string; bg: string }; c1?: string; c2?: string; c3?: string; bg?: string } | null;
  fonte: string | null;
  conjunto_visual: string | null;
  fundo: string | null;
  texto_cores: { l?: string; d?: string } | null;
  logo_url: string | null;
  fundo_url: string | null;
};

export function marcaParaArte(m: MarcaBanco): Omit<Brand, "logo" | "fundo"> {
  const p = m.paleta ?? {};
  const pal = PALETTES.find((x) => x.id === p.id);
  const custom = p.custom && ehHex(p.custom.c1) && ehHex(p.custom.c2) && ehHex(p.custom.c3) ? p.custom : null;
  const cores =
    p.final && ehHex(p.final.c1) && ehHex(p.final.c2) && ehHex(p.final.bg)
      ? p.final
      : ehHex(p.c1) && ehHex(p.c2) && ehHex(p.bg)
        ? { c1: p.c1!, c2: p.c2!, c3: p.c3 ?? p.c1!, bg: p.bg! }
        : coresFinais(pal, custom, !!p.inv);
  const conj = CONJUNTOS.find((c) => c.id === m.conjunto_visual) ?? CONJUNTOS[0];
  const l = m.texto_cores?.l === "main" ? "main" : "ink";
  const d = m.texto_cores?.d === "accent" ? "accent" : m.texto_cores?.d === "off" ? "off" : "white";
  return {
    nome: m.nome_exibicao ?? "",
    c1: cores.c1,
    c2: cores.c2,
    c3: cores.c3,
    bg: cores.bg,
    estilo: (["elegante", "moderna", "marcante", "romantica"].includes(m.fonte ?? "") ? m.fonte : "moderna") as Brand["estilo"],
    layout: "bloco",
    set: conj.map,
    fundoMode: m.fundo === "nenhum" || m.fundo === "foto" ? m.fundo : "icone",
    tk: m.tipo_negocio ?? "outro",
    txt: txtDe(cores.c1, cores.c2, l, d),
  };
}
