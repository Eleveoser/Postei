// Biblioteca de marca do Postei (portada do protótipo): paletas, letras, conjuntos de
// estilos e serviços sugeridos por tipo de negócio. Sem chamadas externas: custo zero.

export type Paleta = { id: string; grupo: string; g: string; nome: string; c1: string; c2: string; c3: string; bg: string; mean: string };
export type FonteMarca = { id: "elegante" | "moderna" | "marcante" | "romantica" | "instituto" | "mistica"; nome: string; mean: string; css: string; privada?: boolean };
export type Conjunto = { id: string; nome: string; mean: string; map: Record<string, string> };

export const PAL_GROUPS: { id: string; nome: string; frase: string }[] = [
    {id:"premium",    nome:"Premium e exclusiva",  frase:"Comunica alto padrão. Para quem cobra pelo valor do trabalho, não pelo preço."},
    {id:"confianca",  nome:"Confiança e técnica",  frase:"Passa segurança e conhecimento. Para quem quer ser vista como especialista."},
    {id:"acolhedora", nome:"Acolhedora e natural", frase:"Próxima e calorosa. Fala de pele, cuidado e trabalho feito à mão."},
    {id:"delicada",   nome:"Leve e delicada",      frase:"Suave e tranquila. Transmite leveza, carinho e bem-estar."},
    {id:"atitude",    nome:"Atitude e energia",    frase:"Marcante e ousada. Para quem quer ser notada no feed."},
    {id:"sobria",     nome:"Sóbria e clássica",    frase:"Direta e atemporal. Combina com qualquer público, inclusive o masculino."}
  ];

export const PALETTES: Paleta[] = [
    {id:"ameixa",     grupo:"premium",    g:"fem",    nome:"Ameixa, Rosé e Ouro",          c1:"#4E2240", c2:"#EBCFD6", c3:"#B08A4F", bg:"#FAF3F4", mean:"Sofisticação acolhedora. Feminina sem ser infantil."},
    {id:"dourado",    grupo:"premium",    g:"neutra", nome:"Preto, Champanhe e Ouro",      c1:"#1C1A19", c2:"#E9DFCC", c3:"#B8975A", bg:"#F7F3EC", mean:"Luxo discreto. O ouro aparece só em fios e detalhes."},
    {id:"garrafa",    grupo:"premium",    g:"neutra", nome:"Verde Garrafa, Creme e Ouro",  c1:"#1E3A2F", c2:"#E6DCC4", c3:"#B39257", bg:"#F6F2E8", mean:"Clássica e exclusiva. Lembra spa e alfaiataria."},
    {id:"marinho",    grupo:"premium",    g:"masc",   nome:"Marinho, Off-white e Ouro",    c1:"#15284A", c2:"#E9E3D6", c3:"#B59660", bg:"#F7F5EF", mean:"Séria e tradicional, com acabamento nobre."},
    {id:"salvia",     grupo:"confianca",  g:"fem",    nome:"Sálvia, Linho e Musgo",        c1:"#56715F", c2:"#DCE5D3", c3:"#2F4A3A", bg:"#F3F6F0", mean:"Calma e saudável. Passa bem-estar sem frieza."},
    {id:"petroleo",   grupo:"confianca",  g:"neutra", nome:"Petróleo, Areia e Cobre",      c1:"#1F3A3D", c2:"#E2D2B8", c3:"#B06F45", bg:"#F5F1EA", mean:"Técnica e calorosa. Para quem quer ser vista como especialista."},
    {id:"grafite",    grupo:"confianca",  g:"masc",   nome:"Grafite, Gelo e Cobre",        c1:"#2B2E33", c2:"#DCDAD5", c3:"#C27A43", bg:"#F4F2EF", mean:"Industrial e artesanal. Lembra couro e metal."},
    {id:"bic",        grupo:"confianca",  g:"masc",   nome:"Azul Royal, Gelo e Marinho",   c1:"#1F3FA8", c2:"#E3EAF6", c3:"#0F1E45", bg:"#F6F8FB", mean:"Forte e atual. Azul vivo com acabamento sério."},
    {id:"nude",       grupo:"acolhedora", g:"fem",    nome:"Terracota, Nude e Café",       c1:"#9A5640", c2:"#EED6C4", c3:"#4A3226", bg:"#FAF3EC", mean:"Natural e próxima. Fala de pele e trabalho feito à mão."},
    {id:"cafe",       grupo:"acolhedora", g:"neutra", nome:"Café, Creme e Caramelo",       c1:"#4A3528", c2:"#EADCC8", c3:"#B5835A", bg:"#FBF7F1", mean:"Clássica e aconchegante. Atemporal."},
    {id:"lavanda",    grupo:"delicada",   g:"fem",    nome:"Lavanda, Névoa e Ameixa",      c1:"#6B5B95", c2:"#E3DCF2", c3:"#3E2F5B", bg:"#F7F5FB", mean:"Leve e tranquila. Transmite cuidado."},
    {id:"candy",      grupo:"delicada",   g:"fem",    nome:"Candy: Rosa, Verde e Dourado", c1:"#D97A9E", c2:"#CFEBD8", c3:"#C9A55C", bg:"#FDF6F0", mean:"Doce e fotogênica. Rosa bebê, verde bebê e fios dourados."},
    {id:"rosaantigo", grupo:"delicada",   g:"fem",    nome:"Rosa Antigo, Pérola e Grafite",c1:"#A85F6B", c2:"#F1E2DF", c3:"#3B3335", bg:"#FBF6F5", mean:"Romântica e madura. Delicada sem ser doce."},
    {id:"pink",       grupo:"atitude",    g:"fem",    nome:"Pink, Coral e Vinho",          c1:"#C2306A", c2:"#FFC2AE", c3:"#5E1530", bg:"#FFF4F1", mean:"Vibrante e alegre. Chama atenção no feed."},
    {id:"vermelho",   grupo:"atitude",    g:"neutra", nome:"Vermelho, Branco e Grafite",   c1:"#B3122E", c2:"#FFFFFF", c3:"#2A2A2A", bg:"#F7F5F2", mean:"Clássica e marcante. Vermelho forte sobre branco, sem tom de rosa."},
    {id:"amarelo",    grupo:"atitude",    g:"masc",   nome:"Preto, Amarelo e Grafite",     c1:"#141414", c2:"#F2C200", c3:"#6B6B6B", bg:"#FBF8EA", mean:"Alto contraste e ousadia."},
    {id:"chumbo",     grupo:"sobria",     g:"neutra", nome:"Chumbo, Areia e Preto",        c1:"#3A3D40", c2:"#E4DCCD", c3:"#141414", bg:"#F5F2EC", mean:"Discreta e elegante. Neutra para qualquer público."},
    {id:"pretobranco",grupo:"sobria",     g:"masc",   nome:"Preto, Branco e Prata",        c1:"#141414", c2:"#FFFFFF", c3:"#A7A9AC", bg:"#F3F3F1", mean:"O clássico de barbearia. Combina com qualquer público."}
  ];

export const FONTS: FonteMarca[] = [
    {id:"elegante",  nome:"Elegante", mean:"Refinada e clássica. Combina com marcas sofisticadas.", css:'700 1.55rem "Cormorant Garamond", Georgia, serif'},
    {id:"moderna",   nome:"Moderna",  mean:"Limpa e atual. Fácil de ler, passa organização.",       css:'700 1.25rem Montserrat, Arial, sans-serif'},
    {id:"marcante",  nome:"Marcante", mean:"Forte e com personalidade. Se destaca no feed.",         css:'400 1.4rem Gloock, Georgia, serif'},
    {id:"romantica", nome:"Romântica",mean:"Delicada e com movimento. Passa afeto e cuidado.",        css:'italic 700 1.4rem "Playfair Display", Georgia, serif'},
    // letras das marcas pessoais (aparecem só nos perfis privados)
    {id:"instituto", nome:"Instituto", mean:"Clássica e firme, com letras de inscrição. Passa autoridade e confiança.", css:'600 1.3rem Cinzel, Georgia, serif', privada:true},
    {id:"mistica",   nome:"Mística",   mean:"Humanista e sutil, com ar de livro antigo. Passa mistério e profundidade.", css:'700 1.45rem Philosopher, Georgia, serif', privada:true},
  ];

export const CONJUNTOS: Conjunto[] = [
    {id:"equilibrado", nome:"Equilibrado", mean:"Alterna cor cheia e fundo claro. Feed variado e organizado.",
     map:{reels:"bloco", dica:"bloco", foto:"leve", mito:"leve", agenda:"bloco", depoimento:"moldura", oferta:"leve"}},
    {id:"intenso", nome:"Intenso", mean:"Mais cor, com respiros claros. Feed marcante.",
     map:{reels:"bloco", dica:"bloco", foto:"bloco", mito:"bloco", agenda:"bloco", depoimento:"leve", oferta:"leve"}},
    {id:"suave", nome:"Suave", mean:"Mais claro, com toques de cor. Feed leve e elegante.",
     map:{reels:"bloco", dica:"leve", foto:"moldura", mito:"moldura", agenda:"leve", depoimento:"moldura", oferta:"bloco"}},
    {id:"editorial", nome:"Editorial", mean:"Fundo claro, filetes finos e cantoneiras na cor de detalhe. Visual de revista, alto padrão.",
     map:{reels:"bloco", dica:"editorial", foto:"moldura", mito:"editorial", agenda:"editorial", depoimento:"editorial", oferta:"bloco"}}
  ];

/** Catálogo de serviços por tipo de negócio, em categorias (a tela busca e abre por categoria). */
export const CATALOGO: Record<string, Record<string, string[]>> = {
  lash: {
    "Cílios": ["Extensão fio a fio", "Volume russo", "Volume brasileiro", "Volume híbrido", "Lash lifting", "Tintura de cílios", "Manutenção de cílios", "Remoção de extensão"],
    "Sobrancelha": ["Design de sobrancelha", "Design com henna", "Brow lamination", "Micropigmentação de sobrancelha", "Tintura de sobrancelha"],
    "Outros": ["Depilação facial", "Maquiagem", "Limpeza de pele"],
  },
  estetica: {
    "Facial": ["Limpeza de pele", "Peeling", "Microagulhamento", "Hidratação facial", "Tratamento para acne", "Radiofrequência facial", "Aplicação de botox", "Aplicação de colágeno"],
    "Corporal": ["Drenagem linfática", "Massagem modeladora", "Massagem relaxante", "Radiofrequência corporal", "Criolipólise", "Crioterapia"],
    "Depilação": ["Depilação a laser", "Depilação com cera", "Depilação com linha"],
    "Sobrancelha": ["Design de sobrancelha", "Micropigmentação de sobrancelha"],
  },
  salao: {
    "Cabelo": ["Corte feminino", "Corte masculino", "Corte infantil", "Escova", "Penteado", "Coloração", "Mechas e luzes", "Hidratação", "Tratamento capilar", "Alisamento e progressiva", "Cachos e crespos", "Tranças e penteados afro", "Mega hair"],
    "Unhas e pés": ["Manicure", "Pedicure", "Esmaltação em gel", "Alongamento de unhas", "Blindagem e banho de gel", "Nail art", "Podologia"],
    "Sobrancelha e cílios": ["Design de sobrancelha", "Brow lamination", "Micropigmentação de sobrancelha", "Extensão de cílios", "Lash lifting"],
    "Maquiagem": ["Maquiagem social", "Maquiagem para noivas", "Dia da noiva"],
    "Estética": ["Limpeza de pele", "Depilação", "Massagem relaxante", "Massagem modeladora", "Drenagem linfática"],
    "Masculino": ["Barba"],
  },
  esmalteria: {
    "Mãos": ["Manicure", "Esmaltação em gel", "Alongamento em fibra", "Alongamento em gel", "Blindagem", "Nail art", "Remoção de alongamento"],
    "Pés": ["Pedicure", "Spa dos pés", "Podologia", "Esmaltação de pés em gel"],
  },
  barbearia: {
    "Cabelo": ["Corte masculino", "Degradê", "Pezinho e acabamento", "Hidratação capilar", "Luzes e platinado", "Selagem"],
    "Barba": ["Barba", "Corte e barba", "Pigmentação de barba", "Barboterapia", "Sobrancelha masculina"],
    "Cuidados": ["Limpeza de pele masculina", "Depilação masculina"],
  },
  pilates: {
    "Aulas": ["Pilates de solo", "Pilates de aparelhos", "Pilates em grupo", "Aula individual", "Aula experimental"],
    "Para quem": ["Pilates para iniciantes", "Pilates para gestantes", "Pilates para a terceira idade", "Pilates clínico"],
  },
  outro: {
    "Beleza": ["Corte", "Coloração", "Manicure", "Pedicure", "Podologia", "Design de sobrancelha", "Maquiagem", "Depilação"],
    "Bem-estar": ["Massagem", "Limpeza de pele"],
  },
};

/** Lista simples (compatibilidade): todos os serviços de cada tipo. */
export const SERVICOS: Record<string, string[]> = Object.fromEntries(
  Object.entries(CATALOGO).map(([tipo, cats]) => [tipo, Object.values(cats).flat()]),
);

export const MAX_SERVICOS = 80;


export const TIPOS_NEGOCIO: { id: string; nome: string; frase: string }[] = [
  { id: "lash", nome: "Cílios e sobrancelha", frase: "Estúdio de lash, design e brow" },
  { id: "estetica", nome: "Clínica de estética", frase: "Facial, corporal e depilação" },
  { id: "salao", nome: "Salão de beleza", frase: "Cabelo, unhas e maquiagem" },
  { id: "esmalteria", nome: "Esmalteria", frase: "Manicure, pedicure e nail art" },
  { id: "barbearia", nome: "Barbearia", frase: "Corte, barba e cuidados" },
  { id: "pilates", nome: "Estúdio de pilates", frase: "Aulas de pilates e movimento" },
  { id: "outro", nome: "Outro negócio", frase: "Beleza ou bem-estar" },
];

/** Sugestão pronta por tipo: a cliente aprova com um toque e ajusta só se quiser. */
export const SUGESTAO: Record<string, { pal: string; fonte: FonteMarca["id"]; conjunto: string }> = {
  lash: { pal: "ameixa", fonte: "elegante", conjunto: "equilibrado" },
  estetica: { pal: "petroleo", fonte: "moderna", conjunto: "suave" },
  salao: { pal: "nude", fonte: "elegante", conjunto: "equilibrado" },
  esmalteria: { pal: "candy", fonte: "romantica", conjunto: "intenso" },
  barbearia: { pal: "grafite", fonte: "moderna", conjunto: "intenso" },
  pilates: { pal: "salvia", fonte: "moderna", conjunto: "suave" },
  outro: { pal: "dourado", fonte: "moderna", conjunto: "equilibrado" },
};

/** Exemplos para a prévia da arte (sem texto de saúde ou promessa). */
export const EXEMPLO_POST: Record<string, Record<string, unknown>> = {
  dica: { titulo: "3 cuidados para o resultado durar", itens: ["Siga a orientação da profissional", "Hidrate todos os dias", "Mantenha a rotina no prazo"] },
  oferta: { servico: "Serviço do mês", precoDe: "R$ 100", preco: "R$ 80", prazo: "sábado", chamada: "Só esta semana. Chame no direct." },
  mito: { pergunta: "Descansar é perder tempo?", resposta: "mito", explicacao: "Pausas ajudam a continuar com mais clareza e constância." },
  depoimento: { frase: "Saí me sentindo outra pessoa. Vou voltar sempre." },
};

export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Dias sugeridos para cada quantidade de posts por semana. */
export const DIAS_SUGERIDOS: Record<number, number[]> = {
  1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 2, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6],
};

export function planoDoRitmo(postsPorSemana: number): { id: "ate3" | "ate4" | "ate7"; nome: string } {
  if (postsPorSemana <= 3) return { id: "ate3", nome: "Até 3 posts por semana" };
  if (postsPorSemana === 4) return { id: "ate4", nome: "Até 4 posts por semana" };
  return { id: "ate7", nome: "Até 7 posts por semana" };
}

/** Termo de confirmação da marca (mesmo texto do protótipo; revisar com o jurídico antes de cobrar). */
export const TERMO_MARCA =
  "Revisei as escolhas acima e confirmo que são as que eu quero para a minha marca no Postei. As artes serão geradas com estas cores, letra, logo e estilo. A identidade visual (cores, letra, logo e conjunto de estilos) só pode ser alterada depois de 30 dias de uso. Ritmo, serviços, promoções e horários podem mudar a qualquer momento. As escolhas do painel da semana vão até sexta, 23h59; o que eu não escolher segue o calendário e o meu histórico. Posts que dependem de informação minha (promoção, elogio de cliente, horários vagos) só saem com o que eu enviar no prazo; sem isso, entra a alternativa prevista: convite para agendar (sem preço), convite para as clientes contarem a experiência e chamada para consultar horários. Responsabilidade pelo conteúdo: tudo o que eu publicar no meu perfil é de minha inteira responsabilidade. Verifiquei que textos, imagens, promoções e informações respeitam as regras do meu conselho de classe (como CRM, CREFITO, CONFEF e CREF, conselhos de estética e outros) e de qualquer órgão regulador, além do Código de Defesa do Consumidor. O Postei oferece sugestões, textos e artes prontos, mas a decisão de publicar é minha. Se houver qualquer impedimento ou penalidade de conselho de classe ou de outro órgão regulador por conteúdo publicado, a responsabilidade é minha e não do Postei.";

// ---------------------------------------------------------------
// Prévia da semana: que tipo de post ela recebe em cada dia, já com o serviço.
// É uma amostra determinística (sem IA, custo zero) usada na tela de ritmo.
// ---------------------------------------------------------------

const ROTULO_POST: Record<TipoPost, { nome: string; objetivo: string }> = {
  reels: { nome: "Reels", objetivo: "Atrair" },
  dica: { nome: "Carrossel de dica", objetivo: "Ensinar" },
  foto: { nome: "Foto do trabalho", objetivo: "Mostrar" },
  mito: { nome: "Mito ou verdade", objetivo: "Engajar" },
  agenda: { nome: "Agenda da semana", objetivo: "Vender" },
  depoimento: { nome: "Depoimento", objetivo: "Gerar confiança" },
  oferta: { nome: "Oferta", objetivo: "Vender" },
};

import { SEQ_BELEZA, SEQ_PESSOAL, SEQ_PILATES, ehPessoal, type TipoPost } from "./planejador/planejador";

export type DiaPrevia = { dia: string; tipo: string; objetivo: string; detalhe: string };

export function previaSemana(
  dias: number[],
  tipoNegocio: string,
  servicos: string[],
  principais: string[],
): DiaPrevia[] {
  const ordenados = [...new Set(dias)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (ordenados.length === 0) return [];
  const pessoal = ehPessoal(tipoNegocio);
  const seq = (pessoal ? SEQ_PESSOAL : tipoNegocio === "pilates" ? SEQ_PILATES : SEQ_BELEZA)[Math.min(ordenados.length, 7)];

  // Os principais entram duas vezes na rodada, então aparecem mais.
  const outros = servicos.filter((s) => !principais.includes(s));
  const rodada = [...principais.flatMap((s) => [s, s]), ...outros];
  let i = 0;
  const proximo = () => (rodada.length ? rodada[i++ % rodada.length] : "");

  return ordenados.map((d, k) => {
    const tipo = seq[k];
    const r = pessoal && tipo === "oferta" ? { nome: "Convite", objetivo: "Convidar" } : ROTULO_POST[tipo];
    let detalhe = "";
    if (tipo === "agenda") detalhe = "Horários livres da semana";
    else if (tipo === "depoimento") detalhe = "Elogio de uma cliente";
    else if (tipo === "oferta" && tipoNegocio === "pilates") detalhe = "Plano ou aula experimental";
    else if (tipo === "dica" && tipoNegocio === "pilates") detalhe = `Benefício de ${proximo() || "pilates"}, com base em estudos`;
    else {
      const s = proximo();
      if (s) detalhe = tipo === "oferta" ? (pessoal ? `Convite para conhecer: ${s}` : `Oferta de ${s}`) : tipo === "dica" ? `Dica sobre ${s}` : tipo === "foto" ? `Seu trabalho em ${s}` : tipo === "mito" ? `Mito ou verdade sobre ${s}` : `Destaque: ${s}`;
    }
    return { dia: DIAS_SEMANA[d], tipo: r.nome, objetivo: r.objetivo, detalhe };
  });
}

/** Tom de voz: como as legendas falam. `regra` é a instrução usada na geração do conteúdo. */
export type TomVoz = { id: string; nome: string; desc: string; exemplo: string; exemploBarb: string; regra: string };

export const TONS: TomVoz[] = [
  {
    id: "acolhedor",
    nome: "Acolhedor",
    desc: "Fala como uma amiga que cuida. Frases médias, carinho, valoriza a cliente. No máximo 1 emoji suave.",
    exemplo: "Sabe aquele dia em que você se olha no espelho e quer se sentir bem? A gente cuida de cada detalhe para você sair daqui mais leve. Tem horário esta semana, me chama.",
    exemploBarb: "Semana puxada? Senta aqui que a gente cuida do resto. Corte no capricho e aquele papo bom. Tem horário esta semana, é só chamar.",
    regra: "fale como uma amiga que cuida: trate por você, valide o que a cliente sente, frases de tamanho médio, palavras de carinho (cuidar, leve, do seu jeito), sem gíria, sem excesso de exclamação, no máximo 1 emoji suave",
  },
  {
    id: "sofisticado",
    nome: "Sofisticado",
    desc: "Frases curtas e elegantes. Foco em técnica, exclusividade e detalhe. Sem gíria, sem exclamação, sem emoji.",
    exemplo: "Coloração personalizada. Cada tom é escolhido para a sua pele e o seu estilo. Agenda desta semana com horários limitados.",
    exemploBarb: "Corte clássico, acabamento à navalha. Atendimento com hora marcada e sem pressa. Poucos horários nesta semana.",
    regra: "frases curtas e elegantes; vocabulário refinado; foco em técnica, exclusividade e detalhe; nunca use gíria, exclamação, emoji ou diminutivo",
  },
  {
    id: "descontraido",
    nome: "Descontraído",
    desc: "Informal e bem-humorado: perguntas, exclamações e expressões do dia a dia, sem forçar piada. Até 2 emojis.",
    exemplo: "Cabelo pedindo socorro? A gente resolve! Bora fazer aquela hidratação que deixa até o vento com inveja. Corre no direct que a agenda voa!",
    exemploBarb: "Barba de lenhador sem querer? Bora dar um jeito nisso! Cadeira livre esta semana, chega mais.",
    regra: "bem-humorado e animado; comece com uma pergunta ou uma brincadeira; use exclamações e expressões do dia a dia (bora, chega de, corre); frases curtas; até 2 emojis",
  },
  {
    id: "tecnico",
    nome: "Técnico",
    desc: "Explica o porquê, com termos corretos e orientações práticas. Passa autoridade. Sem emoji.",
    exemplo: "A hidratação repõe a água da fibra capilar e reduz o frizz. Para manter o resultado, o ideal é repetir a cada 15 dias. Agende pelo direct.",
    exemploBarb: "O degradê fica alinhado por cerca de 15 dias; depois, o fio cresce e perde o desenho. A manutenção quinzenal mantém o corte no ponto.",
    regra: "explique o porquê de cada coisa com termos corretos e fáceis de entender; dê orientações práticas (frequência, cuidados); tom de especialista, sem exagero e sem emoji",
  },
];

/** Tom sugerido por tipo de negócio (ela pode trocar). */
export const TOM_SUGERIDO: Record<string, string> = {
  lash: "acolhedor",
  estetica: "tecnico",
  salao: "acolhedor",
  esmalteria: "descontraido",
  barbearia: "descontraido",
  pilates: "tecnico",
  outro: "acolhedor",
};
