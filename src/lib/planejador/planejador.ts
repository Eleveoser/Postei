// Planejador do calendário do Postei.
//
// Decide, SEM IA e sem custo, o que vai em cada dia: tipo de post, serviço, assunto da biblioteca e
// intensidade do convite. A IA só entra depois, para escrever o texto de cada post.
//
// Regras (ver conhecimento/regras-conteudo-salao.md, seção 8):
//  - posts automáticos (reels, dica, mito) usam assuntos da biblioteca; os personalizados (foto,
//    depoimento, oferta, agenda) dependem de dado da cliente e ficam fora da rotação;
//  - um assunto só se repete na cliente quando todos os outros do serviço já foram usados;
//  - na mesma região e nicho, o mesmo assunto não sai duas vezes dentro da janela, e cada cliente da
//    região começa em uma posição diferente da lista;
//  - serviços principais aparecem mais, nunca dois dias seguidos, e há um limite por semana;
//  - convites: 40% sem convite, 35% leve, 25% direto, bem distribuídos.
//
// Arquivo sem dependências em tempo de execução: roda no app e no teste (node scripts/testar-planejador.ts).

export type TipoPost = "reels" | "dica" | "foto" | "mito" | "agenda" | "depoimento" | "oferta";
export type Intensidade = 0 | 1 | 2;

// Sequência de tipos conforme quantos posts por semana (do essencial para o completo).
// Sequência de tipos conforme quantos posts por semana. Desde 25/10/2026 o centro é foto e vídeo
// do resultado (cerca de metade dos dias), como nos feeds reais de salão; dicas, mitos e convites
// completam e preenchem os dias sem foto.
export const SEQ_BELEZA: Record<number, TipoPost[]> = {
  1: ["foto"],
  2: ["foto", "reels"],
  3: ["foto", "reels", "dica"],
  4: ["foto", "reels", "dica", "oferta"],
  5: ["foto", "reels", "dica", "foto", "oferta"],
  6: ["foto", "reels", "dica", "foto", "mito", "oferta"],
  7: ["foto", "reels", "dica", "foto", "reels", "mito", "oferta"],
};
// Pilates: dicas e benefícios continuam no centro, com foto e vídeo das aulas; plano e promoção como complemento.
export const SEQ_PILATES: Record<number, TipoPost[]> = {
  1: ["dica"],
  2: ["dica", "reels"],
  3: ["dica", "reels", "foto"],
  4: ["dica", "reels", "foto", "oferta"],
  5: ["dica", "reels", "foto", "mito", "oferta"],
  6: ["dica", "reels", "foto", "mito", "depoimento", "oferta"],
  7: ["dica", "reels", "foto", "mito", "dica", "depoimento", "oferta"],
};

export const MIX_CONVITE: Record<Intensidade, number> = { 0: 0.4, 1: 0.35, 2: 0.25 };
const AUTOMATICOS: TipoPost[] = ["reels", "dica", "mito"];
const SEMPRE_DIRETOS: TipoPost[] = ["oferta", "agenda"];
const SUBSTITUTO: Partial<Record<TipoPost, TipoPost>> = { foto: "dica", depoimento: "mito", agenda: "oferta" };

export type Assunto = {
  id: string;
  servico: string;
  tipo: string;
  formatos: string[];
  sazonal: number[];
  status: string;
  intensidade_convite: Intensidade;
};

export type EntradaPlano = {
  inicio: string; // YYYY-MM-DD, inclusive
  fim: string; // YYYY-MM-DD, inclusive
  dias: number[]; // 0 = segunda ... 6 = domingo
  nicho: string; // "pilates" usa a sequência própria
  servicos: { nome: string; principal: boolean }[];
  assuntos: Assunto[]; // biblioteca do nicho
  usadosPelaCliente: { assuntoId: string; data: string }[];
  usadosNaRegiao: { assuntoId: string; data: string }[]; // outras clientes do mesmo bairro e nicho
  posicaoNaRegiao: number; // 0, 1, 2... fixa por cliente dentro da região
  janelaRegiaoDias?: number; // padrão 14
  // Tipos personalizados que a cliente já consegue alimentar. Os que faltam viram automáticos:
  // foto -> dica, depoimento -> mito, agenda -> oferta (convite para agendar, sem inventar horário).
  personalizadosDisponiveis?: TipoPost[];
  permitirRascunho?: boolean; // MVP: aceita assuntos em rascunho
};

export type PostPlanejado = {
  data: string;
  diaSemana: number;
  tipoPost: TipoPost;
  origem: "biblioteca" | "gerar" | "personalizado";
  servico: string | null;
  assuntoId: string | null;
  reciclado: boolean; // assunto repetido por falta de estoque: o gerador precisa de um ângulo novo
  intensidadeConvite: Intensidade;
};

/** O assunto funciona nesse tipo de post? (reels pede formato reels, mito pede mito, dica pede carrossel/legenda) */
export function cabeNoFormato(tipoPost: TipoPost, formatos: string[]) {
  if (tipoPost === "reels") return formatos.includes("reels");
  if (tipoPost === "mito") return formatos.includes("mito");
  return formatos.some((f) => ["carrossel", "legenda", "foto", "bastidor"].includes(f));
}

/* ---------- datas (UTC, para não deslocar o dia) ---------- */
const dia = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
const somaDias = (i: string, n: number) => {
  const d = dia(i);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const diasEntre = (a: string, b: string) => Math.round((dia(b).getTime() - dia(a).getTime()) / 86_400_000);
const diaDaSemana = (i: string) => (dia(i).getUTCDay() + 6) % 7; // segunda = 0
const segundaDa = (i: string) => somaDias(i, -diaDaSemana(i));

/** Distribui as etiquetas 0/1/2 de forma bem espalhada (sem blocos seguidos iguais). */
function espalhar(qtd: Record<Intensidade, number>): Intensidade[] {
  const itens: { v: Intensidade; pos: number }[] = [];
  (Object.keys(qtd) as unknown as Intensidade[]).forEach((k) => {
    const v = Number(k) as Intensidade;
    const n = qtd[v];
    for (let i = 0; i < n; i++) itens.push({ v, pos: (i + 0.5) / n });
  });
  itens.sort((a, b) => a.pos - b.pos || a.v - b.v);
  return itens.map((x) => x.v);
}

/** Ordem estável a partir do id, para que o deslocamento por região mude a primeira escolha. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function tiposDaSemana(nicho: string, qtd: number, semana: number): TipoPost[] {
  const base = (nicho === "pilates" ? SEQ_PILATES : SEQ_BELEZA)[Math.min(Math.max(qtd, 1), 7)];
  // Gira a sequência a cada semana para o feed variar; o primeiro tipo "forte" não fica sempre no mesmo dia.
  const g = semana % base.length;
  return [...base.slice(g), ...base.slice(0, g)];
}

export function planejar(e: EntradaPlano): PostPlanejado[] {
  const diasValidos = [...new Set(e.dias)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (!diasValidos.length || e.inicio > e.fim) return [];

  // 1. Datas dos posts
  const datas: string[] = [];
  for (let d = e.inicio; d <= e.fim; d = somaDias(d, 1)) if (diasValidos.includes(diaDaSemana(d))) datas.push(d);
  if (!datas.length) return [];

  const disponiveis = e.personalizadosDisponiveis ?? ["foto", "depoimento", "oferta", "agenda"];

  // 2. Tipo de cada dia (a sequência gira por semana)
  const segundaInicial = segundaDa(e.inicio);
  const slots = datas.map((data) => {
    const semana = Math.floor(diasEntre(segundaInicial, data) / 7);
    const indiceNaSemana = diasValidos.indexOf(diaDaSemana(data));
    let tipoPost = tiposDaSemana(e.nicho, diasValidos.length, semana)[indiceNaSemana];
    if (!AUTOMATICOS.includes(tipoPost) && !disponiveis.includes(tipoPost)) tipoPost = SUBSTITUTO[tipoPost] ?? "dica";
    return { data, semana, tipoPost };
  });

  // 3. Intensidade do convite: oferta e agenda são sempre diretas; o resto completa a cota 40/35/25
  const N = slots.length;
  const forcados = slots.filter((s) => SEMPRE_DIRETOS.includes(s.tipoPost)).length;
  const n2 = Math.max(forcados, Math.round(N * MIX_CONVITE[2]));
  let n0 = Math.round(N * MIX_CONVITE[0]);
  let n1 = N - n2 - n0;
  if (n1 < 0) {
    n0 += n1;
    n1 = 0;
  }
  const restantes = espalhar({ 0: n0, 1: n1, 2: n2 - forcados });
  let r = 0;
  const intensidades: Intensidade[] = slots.map((s) => (SEMPRE_DIRETOS.includes(s.tipoPost) ? 2 : restantes[r++] ?? 1));

  // 4. Serviço de cada post automático (principais pesam mais; nunca dois dias seguidos; limite por semana)
  const nomes = e.servicos.map((s) => s.nome);
  const principal = new Map(e.servicos.map((s) => [s.nome, s.principal]));
  const ultimoUso = new Map<string, string>();
  const porSemana = new Map<string, number>(); // `${semana}|${servico}`
  const resultado: PostPlanejado[] = [];
  const usadosPlano = new Set<string>();
  const usoCliente = new Map<string, string>(); // assunto -> última data
  e.usadosPelaCliente.forEach((u) => {
    const antes = usoCliente.get(u.assuntoId);
    if (!antes || u.data > antes) usoCliente.set(u.assuntoId, u.data);
  });
  const janela = e.janelaRegiaoDias ?? 14;
  let anterior: string | null = null;
  let passo = 0;

  slots.forEach((s, i) => {
    const intensidade = intensidades[i];
    const automatico = AUTOMATICOS.includes(s.tipoPost);

    if (!automatico) {
      resultado.push({
        data: s.data,
        diaSemana: diaDaSemana(s.data),
        tipoPost: s.tipoPost,
        origem: "personalizado",
        servico: null,
        assuntoId: null,
        reciclado: false,
        intensidadeConvite: intensidade,
      });
      return;
    }
    if (!nomes.length) {
      resultado.push({
        data: s.data,
        diaSemana: diaDaSemana(s.data),
        tipoPost: s.tipoPost,
        origem: "gerar",
        servico: null,
        assuntoId: null,
        reciclado: false,
        intensidadeConvite: intensidade,
      });
      return;
    }

    // serviço: maior (peso x dias desde o último uso), respeitando limite semanal e o dia anterior
    const escolha = nomes
      .filter((n) => n !== anterior || nomes.length === 1)
      .filter((n) => (porSemana.get(`${s.semana}|${n}`) ?? 0) < (principal.get(n) ? 2 : 1) || nomes.length <= 2)
      .map((n) => {
        const ult = ultimoUso.get(n);
        const parado = ult ? diasEntre(ult, s.data) : 60;
        return { n, score: (principal.get(n) ? 2 : 1) * (1 + parado) };
      })
      .sort((a, b) => b.score - a.score || a.n.localeCompare(b.n))[0];
    const servico = (escolha ?? { n: nomes[i % nomes.length] }).n;
    ultimoUso.set(servico, s.data);
    porSemana.set(`${s.semana}|${servico}`, (porSemana.get(`${s.semana}|${servico}`) ?? 0) + 1);
    anterior = servico;

    // assunto: biblioteca do serviço, que caiba no formato e na época, sem repetir
    const mes = dia(s.data).getUTCMonth() + 1;
    const doServico = e.assuntos.filter(
      (a) =>
        a.servico === servico &&
        (e.permitirRascunho || a.status !== "rascunho") &&
        (a.sazonal.length === 0 || a.sazonal.includes(mes)) &&
        cabeNoFormato(s.tipoPost, a.formatos),
    );
    const naRegiao = (id: string) => e.usadosNaRegiao.some((u) => u.assuntoId === id && Math.abs(diasEntre(u.data, s.data)) < janela);
    let livres = doServico.filter((a) => !usoCliente.has(a.id) && !usadosPlano.has(a.id) && !naRegiao(a.id));
    let reciclado = false;
    if (!livres.length) livres = doServico.filter((a) => !usoCliente.has(a.id) && !usadosPlano.has(a.id)); // região apertada: ainda sem repetir na cliente

    let escolhido: Assunto | undefined;
    if (livres.length) {
      const ordenados = [...livres].sort((a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id));
      const preferidos = ordenados.filter((a) => a.intensidade_convite === intensidade);
      const lista = preferidos.length ? preferidos : ordenados;
      escolhido = lista[(e.posicaoNaRegiao + passo) % lista.length];
    } else if (doServico.length) {
      // estoque acabou: recicla o mais antigo, com ângulo novo, respeitando um intervalo mínimo
      const candidatos = doServico
        .filter((a) => !usadosPlano.has(a.id))
        .map((a) => ({ a, ult: usoCliente.get(a.id) ?? "0000-00-00" }))
        .filter(({ ult }) => ult === "0000-00-00" || diasEntre(ult, s.data) >= 30)
        .sort((x, y) => x.ult.localeCompare(y.ult) || x.a.id.localeCompare(y.a.id));
      if (candidatos.length) {
        escolhido = candidatos[0].a;
        reciclado = true;
      }
    }
    passo += 1;

    if (escolhido) {
      usadosPlano.add(escolhido.id);
      usoCliente.set(escolhido.id, s.data);
    }
    resultado.push({
      data: s.data,
      diaSemana: diaDaSemana(s.data),
      tipoPost: s.tipoPost,
      origem: escolhido ? "biblioteca" : "gerar",
      servico,
      assuntoId: escolhido?.id ?? null,
      reciclado,
      intensidadeConvite: intensidade,
    });
  });

  return resultado;
}
