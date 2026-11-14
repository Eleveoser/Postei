// Sugestão pronta de post de benefícios para o "Faça o post do seu jeito". Sem IA e sem custo: o texto é fixo,
// escrito sem promessa de resultado (regras N02 e N03), e a cliente edita o que quiser antes de usar.

const comum = (s: string) => ({
  tag: "BENEFÍCIOS",
  titulo: `Benefícios de ${s.toLowerCase()}`,
  pontos: [
    "Um tempo para cuidar de você, sem pressa",
    "Mais autoestima para muita gente que cuida de si",
    "Um profissional que avalia o que combina com o seu momento",
  ],
  fecho: "Cada pessoa responde de um jeito. Na avaliação, conversamos sobre o que faz sentido para você.",
});

const pilates = (s: string) => ({
  tag: "BENEFÍCIOS",
  titulo: `Benefícios de ${s.toLowerCase()}`,
  pontos: [
    "Mais consciência do corpo e da postura",
    "Movimentos que trabalham força, flexibilidade e equilíbrio",
    "Um momento de respiração e foco na sua rotina",
  ],
  fecho: "Cada pessoa tem um ritmo. Nossa equipe adapta os exercícios ao seu momento.",
});

export function sugerirBeneficios(servico: string, ehPilates: boolean) {
  const base = (ehPilates ? pilates : comum)(servico.trim() || (ehPilates ? "pilates" : "este cuidado"));
  return {
    tag: base.tag,
    titulo: base.titulo,
    texto: base.pontos.join("\n"),
    legenda: `${base.titulo}\n\n${base.pontos.map((p) => `• ${p}`).join("\n")}\n\n${base.fecho}`,
  };
}
