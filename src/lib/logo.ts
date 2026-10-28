// Limpeza do logo no navegador (sem custo de servidor): apaga o fundo branco quadrado que costuma vir
// em logos redondos salvos como foto e corta a sobra transparente. Só mexe em fundo branco ou quase
// branco ligado às bordas; o miolo do logo e fundos coloridos ficam como estão.

export type LogoPronto = { fonte: CanvasImageSource; w: number; h: number; redondo: boolean };

const MAX = 512;

/** Recebe um canvas com o logo desenhado e devolve outro, com o fundo branco apagado e cortado rente. */
export function limparCanvas(c: HTMLCanvasElement): HTMLCanvasElement {
  const w = c.width;
  const h = c.height;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return c;
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  const pos = (px: number, py: number) => (py * w + px) * 4;
  const cantos = [pos(0, 0), pos(w - 1, 0), pos(0, h - 1), pos(w - 1, h - 1)];
  const dist = (i: number, bg: number[]) => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);

  if (cantos.every((i) => d[i + 3] > 200)) {
    const bg = [0, 1, 2].map((k) => Math.round(cantos.reduce((s, i) => s + d[i + k], 0) / 4));
    const uniforme = cantos.every((i) => dist(i, bg) < 28);
    const claro = bg.every((v) => v >= 205); // fundo colorido faz parte do logo e não é apagado
    if (uniforme && claro) {
      const TOL = 40;
      const fora = new Uint8Array(w * h);
      const pilha: number[] = [];
      const entra = (px: number, py: number) => {
        const p = py * w + px;
        if (fora[p] || dist(p * 4, bg) > TOL) return;
        fora[p] = 1;
        pilha.push(p);
      };
      for (let i = 0; i < w; i++) {
        entra(i, 0);
        entra(i, h - 1);
      }
      for (let j = 0; j < h; j++) {
        entra(0, j);
        entra(w - 1, j);
      }
      while (pilha.length) {
        const p = pilha.pop()!;
        const px = p % w;
        const py = (p - px) / w;
        if (px > 0) entra(px - 1, py);
        if (px < w - 1) entra(px + 1, py);
        if (py > 0) entra(px, py - 1);
        if (py < h - 1) entra(px, py + 1);
      }
      let removidos = 0;
      for (let p = 0; p < w * h; p++) removidos += fora[p];
      if (removidos > 0 && removidos < w * h * 0.9) {
        const borda: number[] = [];
        for (let p = 0; p < w * h; p++) {
          if (fora[p]) continue;
          const px = p % w;
          const py = (p - px) / w;
          if ((px > 0 && fora[p - 1]) || (px < w - 1 && fora[p + 1]) || (py > 0 && fora[p - w]) || (py < h - 1 && fora[p + w])) borda.push(p);
        }
        for (let p = 0; p < w * h; p++) if (fora[p]) d[p * 4 + 3] = 0;
        for (const p of borda) {
          const t = Math.min(1, Math.max(0, (dist(p * 4, bg) - TOL) / 70)); // borda suave, sem serrilhado
          d[p * 4 + 3] = Math.round(255 * t);
        }
        x.putImageData(img, 0, 0);
      }
    }
  }

  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++)
      if (d[pos(px, py) + 3] > 16) {
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
  if (x1 >= x0 && y1 >= y0 && (x0 > 0 || y0 > 0 || x1 < w - 1 || y1 < h - 1)) {
    const cw = x1 - x0 + 1;
    const ch = y1 - y0 + 1;
    const c2 = document.createElement("canvas");
    c2.width = cw;
    c2.height = ch;
    c2.getContext("2d")!.drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);
    return c2;
  }
  return c;
}

/** Logo redondo: cantos transparentes e miolo cheio (depois da limpeza). */
export function ehRedondo(c: HTMLCanvasElement): boolean {
  try {
    if (Math.abs(c.width / c.height - 1) > 0.2) return false;
    const p = document.createElement("canvas");
    p.width = 16;
    p.height = 16;
    const x = p.getContext("2d", { willReadFrequently: true });
    if (!x) return false;
    x.drawImage(c, 0, 0, 16, 16);
    const a = (px: number, py: number) => x.getImageData(px, py, 1, 1).data[3];
    return [a(0, 0), a(15, 0), a(0, 15), a(15, 15)].every((v) => v < 60) && [a(8, 0), a(8, 15), a(0, 8), a(15, 8), a(8, 8)].every((v) => v > 200);
  } catch {
    return false;
  }
}

const cache = new Map<string, LogoPronto>();

/** Logo pronto para desenhar nos posts: vale também para logos enviados antes da limpeza existir. */
export function logoPronto(L: HTMLImageElement): LogoPronto {
  const chave = L.currentSrc || L.src;
  const guardado = chave ? cache.get(chave) : undefined;
  if (guardado) return guardado;
  let r: LogoPronto = { fonte: L, w: L.width, h: L.height, redondo: false };
  try {
    const esc = Math.min(1, MAX / Math.max(L.width, L.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(L.width * esc));
    c.height = Math.max(1, Math.round(L.height * esc));
    c.getContext("2d")!.drawImage(L, 0, 0, c.width, c.height);
    const limpo = limparCanvas(c);
    r = { fonte: limpo, w: limpo.width, h: limpo.height, redondo: ehRedondo(limpo) };
  } catch {
    // imagem de outro domínio sem permissão: usa o logo como veio
  }
  if (chave) cache.set(chave, r);
  return r;
}
