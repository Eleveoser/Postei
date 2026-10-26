// Helpers do calendário do mês (datas em UTC para não deslocar o dia).

export type PostCalendario = {
  id: string;
  data_publicacao: string; // YYYY-MM-DD
  tipo: string;
  status: "pendente" | "pronto" | "publicado";
  conteudo: { tema?: string; origem?: string; servico?: string | null; escolhaCliente?: boolean } | null;
};

export const TIPOS: { valor: string; rotulo: string }[] = [
  { valor: "reels", rotulo: "Reels" },
  { valor: "dica", rotulo: "Dica" },
  { valor: "mito", rotulo: "Mito ou verdade" },
  { valor: "foto", rotulo: "Foto do trabalho" },
  { valor: "oferta", rotulo: "Convite para agendar" },
];

export function rotuloTipo(tipo: string): string {
  return (
    TIPOS.find((t) => t.valor === tipo)?.rotulo ??
    tipo.charAt(0).toUpperCase() + tipo.slice(1)
  );
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function parseISO(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDias(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

/** Segunda-feira da semana que contém a data. */
export function inicioSemana(iso: string): string {
  const d = parseISO(iso);
  const dow = (d.getUTCDay() + 6) % 7; // segunda = 0
  return addDias(iso, -dow);
}

export function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export const diaDoMes = (iso: string) => parseISO(iso).getUTCDate();
export const mesNome = (iso: string) => MESES[parseISO(iso).getUTCMonth()];
export const mesAbrev = (iso: string) => mesNome(iso).slice(0, 3);
export const diaSemana = (iso: string) => DIAS[parseISO(iso).getUTCDay()];
export const diaSemanaAbrev = (iso: string) => diaSemana(iso).slice(0, 3).toUpperCase();

/** "13 DE OUTUBRO A 11 DE NOVEMBRO" */
export function rotuloPeriodo(inicio: string, fim: string): string {
  return `${diaDoMes(inicio)} DE ${mesNome(inicio).toUpperCase()} A ${diaDoMes(fim)} DE ${mesNome(fim).toUpperCase()}`;
}

/** "19 a 25 out" ou "26 out a 1 nov" */
export function rotuloSemana(inicio: string, fim: string): string {
  if (mesNome(inicio) === mesNome(fim)) {
    return `${diaDoMes(inicio)} a ${diaDoMes(fim)} ${mesAbrev(fim)}`;
  }
  return `${diaDoMes(inicio)} ${mesAbrev(inicio)} a ${diaDoMes(fim)} ${mesAbrev(fim)}`;
}

/** "Terça, 20 de outubro" */
export function rotuloDia(iso: string): string {
  const s = diaSemana(iso);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}, ${diaDoMes(iso)} de ${mesNome(iso)}`;
}

export type Semana = {
  chave: string; // segunda-feira (YYYY-MM-DD)
  inicio: string; // primeiro dia com post/limite do período
  fim: string;
  posts: PostCalendario[];
};

/** Agrupa os posts por semana (seg–dom), cortando nas pontas do período. */
export function agruparPorSemana(posts: PostCalendario[]): Semana[] {
  if (posts.length === 0) return [];
  const ordenados = [...posts].sort((a, b) =>
    a.data_publicacao.localeCompare(b.data_publicacao),
  );
  const primeiro = ordenados[0].data_publicacao;
  const ultimo = ordenados[ordenados.length - 1].data_publicacao;

  const mapa = new Map<string, PostCalendario[]>();
  for (const p of ordenados) {
    const k = inicioSemana(p.data_publicacao);
    mapa.set(k, [...(mapa.get(k) ?? []), p]);
  }
  return [...mapa.entries()].map(([chave, ps]) => {
    const dom = addDias(chave, 6);
    return {
      chave,
      inicio: chave < primeiro ? primeiro : chave,
      fim: dom > ultimo ? ultimo : dom,
      posts: ps,
    };
  });
}

/** "terças, quintas e sextas" a partir dos dias dos posts. */
export function descreverDias(posts: PostCalendario[]): string {
  const dows = [...new Set(posts.map((p) => parseISO(p.data_publicacao).getUTCDay()))].sort(
    (a, b) => a - b,
  );
  const nomes = dows.map((d) => `${DIAS[d]}s`);
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Aceita servicos como ["Lash lifting"] ou [{ nome: "Lash lifting" }]. */
export function listarServicos(servicos: unknown): string[] {
  if (!Array.isArray(servicos)) return [];
  const nomes = servicos
    .map((s) =>
      typeof s === "string" ? s : s && typeof s === "object" && "nome" in s ? String((s as { nome: unknown }).nome) : "",
    )
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(nomes)];
}
