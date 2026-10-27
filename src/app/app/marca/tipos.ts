import type { CoresCustom, TxtD, TxtL } from "@/lib/marca-cores";

export type FundoTipo = "nenhum" | "icone" | "foto";

/** Tudo o que a cliente escolhe no cadastro da marca. */
export type DadosMarca = {
  tipo: string;
  nome: string;
  instagram: string;
  bairro: string;
  cidade: string;
  telefone: string; // telefone pessoal da dona (só para o Postei falar com ela)
  servicos: string[];
  principais: string[];
  // identidade visual (trava de 30 dias depois de confirmada)
  palId: string;
  inv: boolean;
  custom: CoresCustom | null; // cores próprias ou do logo (substituem a paleta)
  deLogo: boolean;
  fonte: string;
  conjunto: string;
  logoUrl: string | null;
  fundo: FundoTipo;
  fundoUrl: string | null;
  txtL: TxtL;
  txtD: TxtD;
  // comunicação
  tom: string;
  waBio: boolean;
  whatsapp: string; // WhatsApp de agendamento, usado nos posts (só vale se waBio)
  // ritmo
  dias: number[];
};

/** Nicho privado (só a administradora vê): vem do banco, nunca do código. */
export type NichoPrivado = {
  id: string;
  nome: string;
  frase: string;
  voz: "pessoa" | "negocio";
  sugestao: { pal?: string; fonte?: string; conjunto?: string; tom?: string };
  catalogo: Record<string, string[]>;
};
