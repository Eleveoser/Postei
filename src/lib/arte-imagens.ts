// Carrega no navegador as imagens citadas nos dados de um post (fotoUrl) e as entrega como img1,
// que é o que o motor de arte desenha. Se a imagem não carregar, o post sai com o fundo da marca.
export async function comImagens(dados: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = typeof dados.fotoUrl === "string" ? dados.fotoUrl : null;
  if (!url) return dados;
  const img = await new Promise<HTMLImageElement | null>((ok) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = url;
  });
  return { ...dados, img1: img };
}
