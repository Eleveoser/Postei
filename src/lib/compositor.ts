// Compositor de posts do Postei (sem IA, sem custo).
//
// Recebe o plano (planejador) e monta o conteúdo de cada post a partir da biblioteca:
// arte (modelo + dados para o motor de arte), legenda, roteiro de reels e convite no tom da cliente.
// Segue as regras de conteúdo: voz do negócio, sem inventar preço/telefone, diferencial com as
// palavras da cliente, convite conforme a intensidade sorteada pelo planejador.
//
// Quando a API estiver ligada, o gerador de IA reescreve a legenda no tom da cliente a partir deste
// mesmo conteúdo; os posts marcados como `provisorio` são os primeiros a ganhar texto completo.

import type { Intensidade, PostPlanejado } from "./planejador/planejador";

export type AssuntoCompleto = {
  id: string;
  servico: string;
  tipo: string;
  titulo: string;
  gancho: string;
  pontos: string[];
  olhar_profissional: string;
  exemplo: string;
  veredito: string | null;
};

export type Convite = { id: string; tom: string; intensidade: number; texto: string };

export type MarcaCompositor = {
  nome: string;
  tom: string;
  waBio: boolean;
  principais: string[];
  servicos: string[];
  diferenciais: { servico: string; texto: string }[];
};

export type ConteudoPost = {
  origem: PostPlanejado["origem"];
  servico: string | null;
  assunto_id: string | null;
  reciclado: boolean;
  provisorio: boolean;
  intensidade: Intensidade;
  convite_id: string | null;
  tema: string;
  arte: { tpl: string; dados: Record<string, unknown> };
  legenda: string;
  roteiro?: { tela: string; cena: string }[];
};

const ponto = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
const semPrefixoMito = (t: string) => t.replace(/^mito ou verdade:\s*/i, "");
const corta = (t: string, max: number) => (t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);

// Formatos de reels que aparecem nos feeds reais de salão. Rosto da cliente só com autorização dela.
function roteiroReels(k: number, a: AssuntoCompleto, convite: string): { tela: string; cena: string }[] {
  const fecho = convite ? corta(convite, 90) : ponto(a.pontos[a.pontos.length - 1]);
  const formatos = [
    // revelação: o antes, as mãos trabalhando e a cliente virando para mostrar o resultado
    [
      { tela: a.gancho, cena: "O antes: um detalhe de como a cliente chegou (3 segundos)." },
      { tela: ponto(a.pontos[0]), cena: "As mãos da equipe trabalhando, bem de perto (4 a 5 segundos)." },
      { tela: fecho, cena: "A revelação: a cliente vira e mostra o resultado. Rosto só com autorização dela (3 a 4 segundos)." },
    ],
    // bastidor: o profissional em ação, filmado no espelho ou de lado
    [
      { tela: a.gancho, cena: "O profissional em ação, filmado pelo espelho ou de lado (3 a 4 segundos)." },
      { tela: ponto(a.pontos[0]), cena: "O detalhe do procedimento, com luz boa (4 a 5 segundos)." },
      { tela: fecho, cena: "O resultado final, no mesmo cantinho de sempre (3 a 4 segundos)." },
    ],
    // frase na tela: o resultado em movimento, com uma frase de gancho
    [
      { tela: a.gancho, cena: "O resultado em movimento: cabelo balançando, mãos mostrando as unhas ou o detalhe girando (4 segundos)." },
      { tela: ponto(a.pontos[0]), cena: "Outro ângulo do mesmo resultado (3 segundos)." },
      { tela: fecho, cena: "Fechamento com o resultado de frente ou o detalhe mais bonito (3 segundos)." },
    ],
  ];
  return formatos[k % formatos.length];
}

// Legendas de abertura para os dias de foto (a foto é real, da cliente; o texto não promete resultado).
const LEGENDA_FOTO = [
  "{S}: resultado de hoje aqui com a gente.",
  "Mais um {s} feito com carinho pela nossa equipe.",
  "Detalhes que fazem diferença: {s} de hoje.",
  "Hoje teve {s} por aqui. Gostou?",
  "Cada atendimento de {s} é pensado para cada cliente.",
];

// Reserva para serviço sem assunto na biblioteca: textos variados, nunca o mesmo em todos os posts.
const RESERVA: [string, string][] = [
  ["{S} com a nossa equipe.", "Conte para a gente o resultado que você quer: nós avaliamos e indicamos o melhor caminho."],
  ["Você já conhece o nosso atendimento de {s}?", "Cada atendimento começa com uma conversa sobre o que você quer."],
  ["{S}: cuidado em cada detalhe.", "A nossa equipe explica cada etapa antes de começar."],
  ["Pensando em fazer {s}?", "Traga as suas dúvidas: nossos profissionais adoram conversar sobre isso."],
  ["{S} do seu jeito.", "Leve uma foto de referência e conte como é a sua rotina: isso ajuda muito."],
  ["Por aqui, {s} começa com uma boa conversa.", "Entender o que você quer é o primeiro passo do nosso atendimento."],
];

export function canalDe(waBio: boolean) {
  return waBio ? "no WhatsApp (link na bio)" : "no direct";
}

export function comporPosts(
  plano: PostPlanejado[],
  assuntos: Map<string, AssuntoCompleto>,
  convites: Convite[],
  marca: MarcaCompositor,
): ConteudoPost[] {
  const canal = canalDe(marca.waBio);
  const contConvite: Record<number, number> = { 1: 0, 2: 0 };
  let ultimoConvite: string | null = null;
  const usosServico = new Map<string, number>();
  let ofertas = 0;
  let reservas = 0;
  let fotos = 0;
  let reelsFeitos = 0;

  const convite = (intensidade: Intensidade): { id: string | null; texto: string } => {
    if (intensidade === 0) return { id: null, texto: "" };
    const lista = convites.filter((c) => c.tom === marca.tom && c.intensidade === intensidade);
    const reserva = convites.filter((c) => c.intensidade === intensidade);
    const opcoes = lista.length ? lista : reserva;
    if (!opcoes.length) return { id: null, texto: "" };
    let i = contConvite[intensidade]++ % opcoes.length;
    if (opcoes[i].id === ultimoConvite && opcoes.length > 1) i = (i + 1) % opcoes.length;
    ultimoConvite = opcoes[i].id;
    return { id: opcoes[i].id, texto: opcoes[i].texto.replaceAll("{canal}", canal) };
  };

  return plano.map((p) => {
    // ---------- dia de foto: ela escolhe a foto do resultado (ou antes e depois) no post ----------
    if (p.tipoPost === "foto") {
      const lista = marca.principais.length ? marca.principais : marca.servicos;
      const servico = p.servico ?? (lista.length ? lista[fotos % lista.length] : "");
      const k = fotos++;
      const c = convite(p.intensidadeConvite);
      const nomeS = servico || "nosso trabalho";
      const abre = LEGENDA_FOTO[k % LEGENDA_FOTO.length].replaceAll("{S}", nomeS).replaceAll("{s}", nomeS.toLowerCase()).replaceAll("{nome}", marca.nome);
      return {
        origem: p.origem,
        servico: servico || null,
        assunto_id: null,
        reciclado: false,
        provisorio: false,
        intensidade: p.intensidadeConvite,
        convite_id: c.id,
        tema: servico,
        arte: { tpl: "fotoInteira", dados: { titulo: servico || marca.nome } },
        legenda: [abre, ...(c.texto ? ["", c.texto] : [])].join("\n"),
      };
    }

    // ---------- convite para agendar (oferta sem preço informado) ----------
    if (p.origem === "personalizado") {
      const lista = marca.principais.length ? marca.principais : marca.servicos;
      const servico = p.servico ?? (lista.length ? lista[ofertas++ % lista.length] : "");
      const c = convite(2);
      const chamada = c.texto || `Agende o seu horário ${canal}.`;
      return {
        origem: p.origem,
        servico: servico || null,
        assunto_id: null,
        reciclado: false,
        provisorio: false,
        intensidade: 2,
        convite_id: c.id,
        tema: servico || "Agende o seu horário",
        arte: { tpl: "oferta", dados: { rotulo: "Agende o seu horário", servico: servico || marca.nome, chamada } },
        legenda: [servico ? `Que tal reservar um horário para ${servico.toLowerCase()}?` : "Que tal reservar o seu horário?", "", chamada].join("\n"),
      };
    }

    const servico = p.servico ?? "";
    const c = convite(p.intensidadeConvite);
    const a = p.assuntoId ? assuntos.get(p.assuntoId) : undefined;

    // ---------- sem assunto na biblioteca: apresentação do serviço (provisório) ----------
    if (!a) {
      // respeita o equilíbrio de convites: com intensidade 0 o post termina sem chamada para agendar
      const k = reservas++;
      const [abre, meio] = RESERVA[k % RESERVA.length];
      const nomeS = servico || "nossos serviços";
      const chamada = c.texto || meio.replaceAll("{s}", nomeS.toLowerCase());
      return {
        origem: p.origem,
        servico: servico || null,
        assunto_id: null,
        reciclado: false,
        provisorio: true,
        intensidade: p.intensidadeConvite,
        convite_id: c.id,
        tema: servico,
        arte: { tpl: "oferta", dados: { rotulo: "Nossos serviços", servico: servico || marca.nome, chamada } },
        legenda: [abre.replaceAll("{s}", nomeS.toLowerCase()).replaceAll("{S}", nomeS), "", meio.replaceAll("{s}", nomeS.toLowerCase()), ...(c.texto ? ["", c.texto] : [])].join("\n"),
      };
    }

    // ---------- post da biblioteca ----------
    const n = (usosServico.get(servico) ?? 0) + 1;
    usosServico.set(servico, n);
    const dif = marca.diferenciais.find((d) => d.servico === servico);
    const comDiferencial = !!dif && n % 3 === 1; // espaçado: 1º, 4º, 7º post do serviço
    const olhar = comDiferencial ? `${a.olhar_profissional}\n\nUm cuidado nosso: ${ponto(dif!.texto)}` : a.olhar_profissional;

    const legenda = [
      a.gancho,
      "",
      ...a.pontos.map((x) => `• ${ponto(x)}`),
      "",
      olhar,
      ...(c.texto ? ["", c.texto] : []),
    ].join("\n");

    let arte: ConteudoPost["arte"];
    let roteiro: ConteudoPost["roteiro"];
    if (p.tipoPost === "mito") {
      arte = {
        tpl: "mito",
        dados: {
          pergunta: semPrefixoMito(a.titulo),
          resposta: a.veredito ?? "depende",
          explicacao: corta(a.pontos.slice(0, 2).map(ponto).join(" "), 220),
        },
      };
    } else if (p.tipoPost === "reels") {
      arte = { tpl: "reels", dados: { titulo: a.titulo } };
      roteiro = roteiroReels(reelsFeitos++, a, c.texto);
    } else {
      arte = { tpl: "dica", dados: { titulo: a.titulo, itens: a.pontos.slice(0, 4) } };
    }

    return {
      origem: p.origem,
      servico,
      assunto_id: a.id,
      reciclado: p.reciclado,
      provisorio: false,
      intensidade: p.intensidadeConvite,
      convite_id: c.id,
      tema: servico,
      arte,
      legenda,
      ...(roteiro ? { roteiro } : {}),
    };
  });
}
