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
  voz?: "negocio" | "pessoa"; // pessoa: "eu"; negocio: "nós"
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
  "{S}: mais um resultado feito com carinho pela nossa equipe.",
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

// Tom de voz sem IA: abre o parágrafo do olhar profissional com uma ponte do tom e ajusta o registro.
// O tom completo (ritmo da frase, vocabulário) só chega quando a IA reescrever a legenda.
const PONTES: Record<string, string[]> = {
  acolhedor: ["O cuidado que a gente tem:", "Com carinho, o nosso olhar:", "Aqui, cada detalhe importa:"],
  sofisticado: ["Nosso olhar profissional:", "Em nosso atendimento:", "O que avaliamos com atenção:"],
  descontraido: ["O que a nossa equipe faz por aqui:", "Olha só o que acontece aqui:", "Bastidor da nossa equipe:"],
  tecnico: ["O que avaliamos:", "Avaliação profissional:", "Critério da nossa equipe:"],
};

/** Ajusta o registro do texto ao tom: sofisticado e técnico não usam gíria, "a gente" nem exclamação. */
export function adaptarTom(texto: string, tom: string): string {
  if (tom !== "sofisticado" && tom !== "tecnico") return texto;
  return texto
    .replace(/\bA gente\b/g, "Nós")
    .replace(/\ba gente\b/g, "nós")
    .replace(/\bpra\b/g, "para")
    .replace(/!/g, ".")
    .replace(/\.{2,}/g, ".");
}

export function canalDe(waBio: boolean) {
  return waBio ? "no WhatsApp (link na bio)" : "no direct";
}

// Voz pessoal (perfis de uma pessoa): "eu", "na minha experiência".
const PONTES_PESSOA: Record<string, string[]> = {
  acolhedor: ["Com carinho, o que eu vejo:", "O que eu aprendi no caminho:", "Uma conversa de coração:"],
  sofisticado: ["Na minha experiência:", "O que eu observo com atenção:", "Uma reflexão:"],
  descontraido: ["O que eu faço na prática:", "Olha só o que eu vejo por aí:", "Bastidor do meu trabalho:"],
  tecnico: ["O que eu avalio:", "Na prática, eu faço assim:", "O critério que eu uso:"],
};
const RESERVA_PESSOA: [string, string][] = [
  ["{S}: um convite para você.", "Se isso faz sentido para você, vamos conversar sobre o próximo passo."],
  ["Quer saber mais sobre {s}?", "Conta para mim o que você busca e eu te ajudo a entender o melhor caminho."],
  ["{S}, do jeito que você precisa.", "Cada pessoa tem o seu momento, e eu respeito o seu."],
  ["Pensando em {s}?", "Traga as suas dúvidas: eu respondo com prazer."],
  ["Por aqui, {s} começa com uma boa conversa.", "Entender o que você vive é o primeiro passo do meu trabalho."],
];
const LEGENDA_FOTO_PESSOA = [
  "{S}: um registro de hoje.",
  "Um momento do meu trabalho com {s}.",
  "Hoje teve {s} por aqui. Gostou?",
  "Detalhes que fazem diferença em {s}.",
];

function comporBruto(
  plano: PostPlanejado[],
  assuntos: Map<string, AssuntoCompleto>,
  convites: Convite[],
  marca: MarcaCompositor,
): ConteudoPost[] {
  const canal = canalDe(marca.waBio);
  const pessoa = marca.voz === "pessoa";
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
      const bancoFoto = pessoa ? LEGENDA_FOTO_PESSOA : LEGENDA_FOTO;
      const abre = bancoFoto[k % bancoFoto.length].replaceAll("{S}", nomeS).replaceAll("{s}", nomeS.toLowerCase()).replaceAll("{nome}", marca.nome);
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
        legenda: [servico ? (pessoa ? `Quer conversar sobre ${servico.toLowerCase()}?` : `Que tal reservar um horário para ${servico.toLowerCase()}?`) : (pessoa ? "Quer conversar comigo?" : "Que tal reservar o seu horário?"), "", chamada].join("\n"),
      };
    }

    const servico = p.servico ?? "";
    const c = convite(p.intensidadeConvite);
    const a = p.assuntoId ? assuntos.get(p.assuntoId) : undefined;

    // ---------- sem assunto na biblioteca: apresentação do serviço (provisório) ----------
    if (!a) {
      // respeita o equilíbrio de convites: com intensidade 0 o post termina sem chamada para agendar
      const k = reservas++;
      const banco = pessoa ? RESERVA_PESSOA : RESERVA;
      const [abre, meio] = banco[k % banco.length];
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
    const olhar0 = comDiferencial ? `${a.olhar_profissional}\n\n${pessoa ? "Um diferencial meu" : "Um cuidado nosso"}: ${ponto(dif!.texto)}` : a.olhar_profissional;
    // Tom de voz (sem IA): a ponte antes do olhar profissional e o ajuste de registro seguem o tom da cliente.
    const pontes = (pessoa ? PONTES_PESSOA : PONTES)[marca.tom] ?? (pessoa ? PONTES_PESSOA : PONTES).acolhedor;
    const ponte = pontes[(n - 1) % pontes.length];
    const olhar = `${ponte}\n${adaptarTom(olhar0, marca.tom)}`;

    const legenda = [
      adaptarTom(a.gancho, marca.tom),
      "",
      ...a.pontos.map((x) => `• ${adaptarTom(ponto(x), marca.tom)}`),
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

/** Monta os posts e aplica o registro do tom a toda a legenda (inclusive reserva e dias de foto). */
export function comporPosts(
  plano: PostPlanejado[],
  assuntos: Map<string, AssuntoCompleto>,
  convites: Convite[],
  marca: MarcaCompositor,
): ConteudoPost[] {
  return comporBruto(plano, assuntos, convites, marca).map((c) => ({ ...c, legenda: adaptarTom(c.legenda, marca.tom) }));
}
