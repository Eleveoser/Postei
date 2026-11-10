// Hashtags sugeridas, sem IA e sem custo: vêm do serviço do post e do cadastro da cliente (negócio, bairro, cidade).
// Poucas e específicas (3 a 5), porque hashtag genérica em excesso tem cara de spam.

function juntar(texto: string | null | undefined, maxPalavras = 3): string {
  if (!texto) return "";
  const palavras = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 1 && !["de", "da", "do", "das", "dos", "e", "com", "para", "em", "no", "na"].includes(p));
  return palavras.slice(0, maxPalavras).join("");
}

export function sugerirHashtags(o: {
  servico?: string | null;
  tipoNegocio?: string | null;
  bairro?: string | null;
  cidade?: string | null;
}): string[] {
  const servico = juntar(o.servico);
  const tipo = juntar(o.tipoNegocio, 2);
  const cidade = juntar(o.cidade, 3);
  const bairro = juntar(o.bairro, 3);
  const candidatas = [
    servico,
    servico && cidade ? servico + cidade : "",
    tipo && cidade ? tipo + cidade : "",
    bairro,
    cidade,
    tipo,
  ];
  const vistas = new Set<string>();
  const saida: string[] = [];
  for (const c of candidatas) {
    if (c.length < 4 || c.length > 30 || vistas.has(c)) continue;
    vistas.add(c);
    saida.push("#" + c);
    if (saida.length === 5) break;
  }
  return saida;
}
