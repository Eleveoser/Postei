// Motor de arte do Postei — portado do protótipo (Kit de Visita).
// Desenha cada post em um <canvas> de 1080x1350 (formato feed do Instagram),
// a partir da marca da cliente (cores, fonte, logo) e do conteúdo do post.
//
// Roda só no navegador (depende de CanvasRenderingContext2D e, opcionalmente,
// de document.fonts) — importe isto só de Client Components.

export type Brand = {
  nome?: string;
  c1: string; // cor principal
  c2: string; // cor secundária
  c3?: string; // cor de detalhe (se ausente, é calculada a partir de c1/c2)
  bg: string; // fundo claro
  estilo?: "elegante" | "moderna" | "marcante" | "romantica" | "instituto" | "mistica";
  layout?: "bloco" | "leve" | "moldura" | "editorial";
  set?: Record<string, string>;
  fundoMode?: "icone" | "foto" | "nenhum";
  tk?: string; // ícone de marca d'água: lash | salao | barbearia | esmalteria | estetica | pilates | outro
  logo?: HTMLImageElement | null;
  fundo?: HTMLImageElement | null; // imagem de fundo (modo foto)
  foto?: HTMLImageElement | null; // foto do post (templates foto/transformacao)
  txt?: { dark: string; light: string };
};

export type PostContent = Record<string, any>;

export const W = 1080;
export const H = 1350;
export const PAD = 90;

const DISPLAY: Record<string, (s: number) => string> = {
  elegante: (s) => `700 ${s}px "Cormorant Garamond", Georgia, serif`,
  moderna: (s) => `700 ${Math.round(s * 0.86)}px Montserrat, Arial, sans-serif`,
  marcante: (s) => `400 ${s}px Gloock, Georgia, serif`,
  romantica: (s) => `italic 700 ${Math.round(s * 0.92)}px "Playfair Display", Georgia, serif`,
  instituto: (s) => `600 ${Math.round(s * 0.84)}px Cinzel, Georgia, serif`,
  mistica: (s) => `700 ${Math.round(s * 0.96)}px Philosopher, Georgia, serif`,
};
const BODY = (s: number, w?: number) => `${w || 400} ${s}px Chivo, Arial, sans-serif`;
const INK = "#211A1E";

function hexRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
}
function lum(hex: string) {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a: string, b: string) {
  const A = lum(a) + 0.05,
    B = lum(b) + 0.05;
  return Math.max(A, B) / Math.min(A, B);
}

// cor do texto: automática por fundo; a escolha da cliente só vale se tiver
// contraste de pelo menos 4,5 naquele fundo
let TXT = { dark: INK, light: "#FFFFFF" };
function onColor(hex: string) {
  const def = contrast(hex, INK) >= contrast(hex, "#FFFFFF") ? INK : "#FFFFFF";
  const pickC = def === INK ? TXT.dark : TXT.light;
  return contrast(hex, pickC) >= 4.5 ? pickC : def;
}
// cor de destaque legível (texto) e cor de detalhe (fios, bordas) para um fundo
function strong(bg: string, ...cands: (string | undefined)[]) {
  for (const c of cands) {
    if (c && contrast(bg, c) >= 3) return c;
  }
  return onColor(bg);
}
function detailOn(bg: string, b: Brand) {
  return [b.c3, b.c2, b.c1].find((x) => x && contrast(bg, x) >= 1.6) || onColor(bg);
}
let PILL_OUT: { col: string; txt: string } | null = null;
function mix(a: string, b: string, t: number) {
  const A = hexRgb(a),
    B = hexRgb(b);
  return (
    "#" +
    A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")
  );
}
function initials(n?: string) {
  const w = String(n || "")
    .trim()
    .split(/\s+/)
    .filter((x) => x.length > 1 || /\w/.test(x));
  return ((w[0] || "P")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
}
function fontOf(b: Brand) {
  return DISPLAY[b.estilo || "elegante"] || DISPLAY.elegante;
}
const precoNum = (t?: string) =>
  parseFloat(String(t || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;

// esquema de cores conforme o estilo de post
function scheme(b: Brand) {
  const bloco = b.layout === "bloco";
  const bg = bloco ? b.c1 : b.bg;
  const acc = bloco ? b.c2 : contrast(b.bg, b.c1) >= contrast(b.bg, b.c2) ? b.c1 : b.c2;
  return {
    bg,
    fg: onColor(bg),
    acc,
    accFg: onColor(acc),
    accT: strong(bg, acc, b.c3, b.c1),
    det: detailOn(bg, b),
    ring: acc,
    band: b.layout === "leve",
    ed: b.layout === "editorial",
  };
}
type Scheme = ReturnType<typeof scheme>;

function corners(ctx: CanvasRenderingContext2D, col: string) {
  const m = 52,
    L = 70;
  ctx.strokeStyle = col;
  ctx.lineWidth = 6;
  ([[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const).forEach(
    ([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * L);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * L, y);
      ctx.stroke();
    }
  );
}
// moldura: fio duplo na cor de detalhe; editorial: fio fino + cantoneiras
function frame(ctx: CanvasRenderingContext2D, b: Brand) {
  if (b.layout === "moldura") {
    ctx.strokeStyle = detailOn(b.bg, b);
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.lineWidth = 2;
    ctx.strokeRect(58, 58, W - 116, H - 116);
  } else if (b.layout === "editorial") {
    const d = detailOn(b.bg, b);
    ctx.strokeStyle = d;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    corners(ctx, d);
  }
}
// ícones de marca d'água, desenhados em traço (sem imagem externa)
function wmIcon(ctx: CanvasRenderingContext2D, tk: string, S: number) {
  ctx.beginPath();
  if (tk === "lash") {
    ctx.moveTo(-S / 2, 0);
    ctx.quadraticCurveTo(0, -S * 0.42, S / 2, 0);
    ctx.quadraticCurveTo(0, S * 0.42, -S / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, S * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const u = 0.14 + i * 0.12,
        x = (u - 0.5) * S,
        y = -2 * (1 - u) * u * S * 0.42;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x * 1.18, y - S * 0.13);
      ctx.stroke();
    }
  } else if (tk === "salao" || tk === "barbearia") {
    ctx.arc(-S * 0.2, S * 0.3, S * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(S * 0.2, S * 0.3, S * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-S * 0.13, S * 0.2);
    ctx.lineTo(S * 0.16, -S * 0.48);
    ctx.moveTo(S * 0.13, S * 0.2);
    ctx.lineTo(-S * 0.16, -S * 0.48);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -S * 0.08, S * 0.025, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tk === "esmalteria") {
    rr(ctx, -S * 0.22, -S * 0.02, S * 0.44, S * 0.48, S * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-S * 0.08, -S * 0.12, S * 0.16, S * 0.1);
    ctx.stroke();
    rr(ctx, -S * 0.1, -S * 0.5, S * 0.2, S * 0.38, S * 0.05);
    ctx.stroke();
  } else if (tk === "estetica") {
    ctx.moveTo(0, -S * 0.46);
    ctx.bezierCurveTo(S * 0.36, -S * 0.04, S * 0.32, S * 0.42, 0, S * 0.42);
    ctx.bezierCurveTo(-S * 0.32, S * 0.42, -S * 0.36, -S * 0.04, 0, -S * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-S * 0.08, S * 0.16, S * 0.12, Math.PI * 0.9, Math.PI * 1.4);
    ctx.stroke();
  } else if (tk === "pilates") {
    // figura em arco (postura de alongamento) sobre um tapete
    ctx.arc(S * 0.02, -S * 0.4, S * 0.09, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-S * 0.36, S * 0.34);
    ctx.quadraticCurveTo(-S * 0.1, -S * 0.3, S * 0.3, -S * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-S * 0.5, S * 0.44);
    ctx.lineTo(S * 0.5, S * 0.44);
    ctx.stroke();
  } else {
    const r = S * 0.45;
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.stroke();
  }
}
// fundo: degradê leve na cor cheia; bloco/leve ganham arcos finos na cor de
// detalhe, para não ficar chapado; marca d'água opcional (ícone ou foto)
function paint(ctx: CanvasRenderingContext2D, b: Brand, bg: string) {
  const dark = lum(bg) < 0.25,
    orn = b.layout === "bloco" || b.layout === "leve";
  const fillBg = () => {
    if (dark) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, mix(bg, "#FFFFFF", 0.07));
      g.addColorStop(1, mix(bg, "#000000", 0.22));
      ctx.fillStyle = g;
    } else ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  };
  fillBg();
  if (orn && b.fundoMode === "foto" && b.fundo) {
    const im = b.fundo,
      sc = Math.max(W / im.width, H / im.height),
      w = im.width * sc,
      h = im.height * sc;
    ctx.save();
    try {
      ctx.filter = "grayscale(1)";
    } catch {
      /* ignore */
    }
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    try {
      ctx.filter = "none";
    } catch {
      /* ignore */
    }
    ctx.globalAlpha = dark ? 0.82 : 0.88;
    fillBg();
    ctx.restore();
  }
  if (orn && b.fundoMode === "icone") {
    ctx.save();
    ctx.translate(W - 215, H - 340);
    ctx.rotate(-0.12);
    ctx.globalAlpha = dark ? 0.12 : 0.08;
    ctx.strokeStyle = dark ? b.c2 : b.c1;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    wmIcon(ctx, b.tk || "outro", 440);
    ctx.restore();
  }
  if (b.layout === "bloco") {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = b.c2;
    ctx.beginPath();
    ctx.arc(-60, H + 40, 430, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = b.c2;
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.restore();
  }
  if (orn) {
    ctx.save();
    ctx.globalAlpha = dark ? 0.55 : 0.4;
    ctx.strokeStyle = detailOn(bg, b);
    ctx.lineWidth = 3;
    [190, 228].forEach((r) => {
      ctx.beginPath();
      ctx.arc(W + 20, -20, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }
}
function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
function ruleUnder(ctx: CanvasRenderingContext2D, S: Scheme, ret: number, size: number) {
  ctx.fillStyle = S.det;
  ctx.fillRect(PAD, ret - size * 0.55, 120, 5);
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function lines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width <= maxW || !cur) {
      cur = t;
    } else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFn: (s: number) => string,
  big: number,
  small: number,
  maxW: number,
  maxLines: number
) {
  for (let s = big; s >= small; s -= 4) {
    ctx.font = fontFn(s);
    const l = lines(ctx, text, maxW);
    if (l.length <= maxLines) return { size: s, lines: l };
  }
  ctx.font = fontFn(small);
  const l = lines(ctx, text, maxW).slice(0, maxLines);
  return { size: small, lines: l };
}
function drawLines(ctx: CanvasRenderingContext2D, l: string[], x: number, y: number, lh: number) {
  l.forEach((t, i) => ctx.fillText(t, x, y + i * lh));
  return y + l.length * lh;
}
function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bg: string,
  fg: string
) {
  ctx.font = BODY(28, 700);
  const w = ctx.measureText(text).width + 48;
  if (PILL_OUT) {
    ctx.strokeStyle = PILL_OUT.col;
    ctx.lineWidth = 3;
    rr(ctx, x + 1.5, y + 1.5, w - 3, 53, 26.5);
    ctx.stroke();
    fg = PILL_OUT.txt;
  } else {
    ctx.fillStyle = bg;
    rr(ctx, x, y, w, 56, 28);
    ctx.fill();
  }
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 24, y + 29);
  ctx.textBaseline = "alphabetic";
}
// Logo redondo (cantos transparentes, miolo cheio): preenche o círculo inteiro em vez de ficar numa moldura branca.
const redondos = new WeakMap<object, boolean>();
function logoRedondo(L: HTMLImageElement): boolean {
  const antes = redondos.get(L);
  if (antes !== undefined) return antes;
  let r = false;
  try {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 16;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (x) {
      x.drawImage(L, 0, 0, 16, 16);
      const a = (px: number, py: number) => x.getImageData(px, py, 1, 1).data[3];
      const cantos = [a(0, 0), a(15, 0), a(0, 15), a(15, 15)];
      const meios = [a(8, 0), a(8, 15), a(0, 8), a(15, 8), a(8, 8)];
      r = cantos.every((v) => v < 60) && meios.every((v) => v > 200) && Math.abs(L.width / L.height - 1) < 0.2;
    }
  } catch {
    r = false;
  }
  redondos.set(L, r);
  return r;
}

function footer(ctx: CanvasRenderingContext2D, b: Brand, y: number, fg: string, ringBg: string) {
  const r = 38,
    L = b.logo,
    wide = !!(L && L.width / L.height > 1.3);
  let textX = PAD + 2 * r + 22,
    showName = true;
  if (L && wide) {
    const ph = 2 * r,
      maxH = ph - 16,
      w = Math.min(320, (maxH * L.width) / L.height),
      h = (w * L.height) / L.width,
      bw = w + 32;
    ctx.fillStyle = "#FFFFFF";
    rr(ctx, PAD, y - r, bw, ph, 20);
    ctx.fill();
    ctx.drawImage(L, PAD + 16, y - h / 2, w, h);
    showName = false;
    textX = PAD + bw + 22;
  } else {
    const cx = PAD + r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y, r, 0, Math.PI * 2);
    ctx.closePath();
    if (L && logoRedondo(L)) {
      ctx.clip();
      const s = (2 * r + 2) / Math.max(L.width, L.height);
      ctx.drawImage(L, cx - (L.width * s) / 2, y - (L.height * s) / 2, L.width * s, L.height * s);
    } else if (L) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.clip();
      const box = 2 * r - 14,
        s = Math.min(box / L.width, box / L.height),
        w = L.width * s,
        h = L.height * s;
      ctx.drawImage(L, cx - w / 2, y - h / 2, w, h);
    } else {
      ctx.fillStyle = ringBg;
      ctx.fill();
      ctx.fillStyle = onColor(ringBg);
      ctx.font = BODY(28, 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(b.nome), cx, y + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
  }
  if (showName) {
    ctx.fillStyle = fg;
    let fs = 32;
    ctx.font = BODY(fs, 600);
    const name = b.nome || "Seu estúdio",
      maxW = W - PAD - textX;
    while (ctx.measureText(name).width > maxW && fs > 22) {
      fs -= 2;
      ctx.font = BODY(fs, 600);
    }
    ctx.fillText(name, textX, y + 11);
  }
}
// rodapé: faixa na cor principal no estilo "leve"; no resto, assinatura sobre o fundo
function base(ctx: CanvasRenderingContext2D, b: Brand, S: Scheme, bandH: number) {
  if (S.band) {
    ctx.fillStyle = b.c1;
    ctx.fillRect(0, H - bandH, W, bandH);
    footer(ctx, b, H - bandH / 2, onColor(b.c1), b.c2);
  } else {
    if (S.ed) {
      ctx.fillStyle = S.det;
      ctx.fillRect(PAD, H - 172, W - 2 * PAD, 2);
    }
    footer(ctx, b, H - 110, S.fg, S.ring);
  }
  frame(ctx, b);
}

type TplFn = (ctx: CanvasRenderingContext2D, b: Brand, p: PostContent) => void;

/* posts de base: serviços, equipe (sem foto) e história — layout padrão por tipo */
// Moldura premium para posts de foto: margem na cor de fundo, filete fino na cor de detalhe,
// foto(s) grande(s) e faixa baixa só com o título (nome do serviço) e a assinatura discreta.
function fotoComMoldura(
  ctx: CanvasRenderingContext2D,
  b: Brand,
  p: PostContent,
  imgs: (HTMLImageElement | undefined)[],
  vazios: string[],
  etiquetas?: string[],
) {
  const M = 48,
    banda = 196,
    top = M,
    alt = H - M - banda,
    larg = W - 2 * M,
    gap = imgs.length > 1 ? 8 : 0,
    cada = (larg - gap * (imgs.length - 1)) / imgs.length;
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, W, H);

  imgs.forEach((img, i) => {
    const x = M + i * (cada + gap);
    ctx.save();
    rr(ctx, x, top, cada, alt, 6);
    ctx.clip();
    if (img) {
      const s = Math.max(cada / img.width, alt / img.height),
        w = img.width * s,
        h = img.height * s;
      ctx.drawImage(img, x + (cada - w) / 2, top + (alt - h) / 2, w, h);
    } else {
      const ph = mix(b.bg, "#000000", 0.07);
      ctx.fillStyle = ph;
      ctx.fillRect(x, top, cada, alt);
      ctx.fillStyle = strong(ph, b.c1, b.c2, b.c3);
      ctx.font = BODY(imgs.length > 1 ? 32 : 40, 600);
      ctx.textAlign = "center";
      ctx.fillText(vazios[i] || "Sua foto", x + cada / 2, top + alt / 2);
      ctx.font = BODY(imgs.length > 1 ? 26 : 30, 400);
      ctx.fillText("entra aqui", x + cada / 2, top + alt / 2 + 44);
      ctx.textAlign = "left";
    }
    ctx.restore();
    if (etiquetas?.[i]) {
      ctx.font = BODY(24, 700);
      const tw = ctx.measureText(etiquetas[i]).width + 32;
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      rr(ctx, x + 20, top + 20, tw, 44, 22);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(etiquetas[i], x + 36, top + 50);
    }
  });

  // filete fino (moldura discreta), a 22 px da borda
  ctx.strokeStyle = detailOn(b.bg, b);
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, W - 44, H - 44);

  // título: nome do serviço, centralizado na faixa de baixo
  const F = fontOf(b);
  ctx.fillStyle = strong(b.bg, b.c1, b.c3, INK);
  const t = fit(ctx, String(p.titulo || ""), F, 66, 40, W - 2 * PAD, 1);
  ctx.font = F(t.size);
  ctx.textAlign = "center";
  ctx.fillText(t.lines[0] || "", W / 2, H - banda + 92);
  // assinatura discreta
  ctx.fillStyle = mix(onColor(b.bg), b.bg, 0.35);
  ctx.font = BODY(24, 600);
  const assinatura = (b.nome || "").toUpperCase().split("").join(" ");
  ctx.fillText(assinatura, W / 2, H - banda + 146);
  ctx.textAlign = "left";
}

// Luminância média da imagem (0 escura, 1 clara), amostrada em 24x24 pontos.
function luminanciaMedia(img: HTMLImageElement): number {
  try {
    const c = document.createElement("canvas");
    c.width = 24;
    c.height = 24;
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data;
    let t = 0;
    for (let i = 0; i < d.length; i += 4) t += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return t / (d.length / 4);
  } catch {
    return 0.5;
  }
}

// Foto de fundo de ponta a ponta com véu adaptado: imagem clara recebe véu claro e texto escuro;
// imagem escura recebe véu escuro e texto claro. Devolve as cores de texto e de destaque.
function fundoComVeu(ctx: CanvasRenderingContext2D, b: Brand, img: HTMLImageElement | undefined) {
  let clara = false;
  if (img) {
    const s = Math.max(W / img.width, H / img.height),
      w = img.width * s,
      h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    clara = luminanciaMedia(img) > 0.55;
  } else {
    ctx.fillStyle = b.bg;
    ctx.fillRect(0, 0, W, H);
    clara = lum(b.bg) > 0.5;
  }
  ctx.fillStyle = clara ? "rgba(255,255,255,0.58)" : "rgba(10,10,14,0.58)";
  ctx.fillRect(0, 0, W, H);
  const texto = clara ? "#241C1F" : "#FFFFFF";
  const destaque = clara ? strong("#FFFFFF", b.c1, b.c3, INK) : strong("#101014", b.c2, b.c3, "#FFFFFF");
  return { texto, destaque };
}

function assinaturaFundo(ctx: CanvasRenderingContext2D, b: Brand, cor: string) {
  ctx.fillStyle = cor;
  ctx.globalAlpha = 0.8;
  ctx.font = BODY(26, 600);
  ctx.fillText((b.nome || "").toUpperCase().split("").join(" "), PAD, H - 90);
  ctx.globalAlpha = 1;
}

export const BASE_LAYOUT: Record<string, string> = {
  servicos: "leve",
  equipe: "bloco",
  historia: "moldura",
  horarios: "leve",
};

export const T: Record<string, TplFn> = {
  reels(ctx, b, p) {
    const F = fontOf(b),
      fg = onColor(b.c1);
    paint(ctx, b, b.c1);
    pill(ctx, "REELS", PAD, 110, b.c2, onColor(b.c2));
    ctx.strokeStyle = detailOn(b.c1, b);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, 560, 156, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = b.c2;
    ctx.beginPath();
    ctx.arc(W / 2, 560, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = onColor(b.c2);
    ctx.beginPath();
    ctx.moveTo(W / 2 - 40, 490);
    ctx.lineTo(W / 2 + 66, 560);
    ctx.lineTo(W / 2 - 40, 630);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fg;
    const t = fit(ctx, p.titulo, F, 92, 56, W - 2 * PAD, 3);
    ctx.font = F(t.size);
    ctx.textAlign = "center";
    drawLines(ctx, t.lines, W / 2, 820 + t.size * 0.8, t.size * 1.08);
    ctx.textAlign = "left";
    footer(ctx, b, H - 110, fg, b.c2);
  },
  dica(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, "DICA", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo, F, 96, 56, W - 2 * PAD, 4);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.08);
    ruleUnder(ctx, S, tr, t.size);
    let y = tr + 50;
    (p.itens || []).slice(0, 4).forEach((it: string, i: number) => {
      ctx.fillStyle = S.accT;
      ctx.font = F(64);
      ctx.fillText(String(i + 1), PAD, y + 50);
      ctx.fillStyle = S.fg;
      ctx.font = BODY(40);
      const l = lines(ctx, it, W - 2 * PAD - 90).slice(0, 3);
      y = Math.max(drawLines(ctx, l, PAD + 90, y + 44, 52), y + 70) + 34;
    });
    base(ctx, b, S, 180);
  },
  oferta(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b),
      limit = S.band ? H - 252 : H - 200,
      promo = !!p.preco;
    paint(ctx, b, S.bg);
    ctx.fillStyle = S.accT;
    ctx.font = BODY(30, 700);
    ctx.fillText(String(p.rotulo || "OFERTA DA SEMANA").toUpperCase(), PAD, 150);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.servico, F, 100, 56, W - 2 * PAD, promo ? 2 : 3);
    ctx.font = F(t.size);
    let y = drawLines(ctx, t.lines, PAD, 230 + t.size * 0.85, t.size * 1.08);
    ruleUnder(ctx, S, y, t.size);
    y -= t.size * 0.3;
    const lh = promo ? 54 : 64;
    ctx.font = BODY(promo ? 40 : 50);
    const c = lines(ctx, p.chamada, W - 2 * PAD).slice(0, 3);
    if (promo) {
      const deH = p.precoDe ? 74 : 0,
        pzH = p.prazo ? 66 : 0,
        rest = 66 + (c.length - 1) * lh;
      const big = Math.max(64, Math.min(200, Math.floor((limit - y - deH - 34 - pzH - rest) / 0.82)));
      if (p.precoDe) {
        const de = "De " + p.precoDe,
          yy = y + 74,
          nd = precoNum(p.precoDe),
          np = precoNum(p.preco);
        ctx.fillStyle = S.fg;
        ctx.globalAlpha = 0.75;
        ctx.font = BODY(40, 600);
        ctx.fillText(de + " por", PAD, yy);
        const x0 = PAD + ctx.measureText("De ").width,
          x1 = PAD + ctx.measureText(de).width;
        ctx.fillRect(x0 - 4, yy - 14, x1 - x0 + 8, 4);
        ctx.globalAlpha = 1;
        if (nd > np && np > 0) {
          const pct = "-" + Math.round((1 - np / nd) * 100) + "%";
          ctx.font = BODY(28, 700);
          const pw = ctx.measureText(pct).width + 48;
          const po = PILL_OUT;
          PILL_OUT = null;
          pill(ctx, pct, W - PAD - pw, yy - 42, S.acc, S.accFg);
          PILL_OUT = po;
        }
        y = yy;
      }
      ctx.fillStyle = S.accT;
      const pr = fit(ctx, p.preco, F, big, Math.min(big, 64), W - 2 * PAD, 1);
      ctx.font = F(pr.size);
      y = y + 34 + pr.size * 0.82;
      ctx.fillText(pr.lines[0] || "", PAD, y);
      if (p.prazo) {
        ctx.font = BODY(34, 700);
        y += 66;
        ctx.fillText(("Válido até " + p.prazo).toUpperCase(), PAD, y);
      }
      ctx.fillStyle = S.fg;
      ctx.font = BODY(40);
      drawLines(ctx, c, PAD, Math.max(y + 66, Math.min(y + 66, limit - (c.length - 1) * lh)), lh);
    } else {
      ctx.fillStyle = S.fg;
      ctx.font = BODY(50);
      drawLines(ctx, c, PAD, Math.min(y + 110, limit - (c.length - 1) * lh), lh);
    }
    base(ctx, b, S, 200);
  },
  mito(ctx, b, p) {
    const F = fontOf(b),
      top = 660;
    const topBg = b.layout === "bloco" ? b.c1 : b.layout === "leve" ? mix(b.c1, "#FFFFFF", 0.8) : b.bg;
    const topFg = onColor(topBg);
    ctx.fillStyle = b.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = topBg;
    ctx.fillRect(0, 0, W, top);
    if (b.layout === "moldura" || b.layout === "editorial") {
      ctx.fillStyle = detailOn(b.bg, b);
      ctx.fillRect(PAD, top, W - 2 * PAD, 3);
    }
    const pb = b.layout === "bloco" ? b.c2 : b.c1;
    pill(ctx, "MITO OU VERDADE?", PAD, 110, pb, onColor(pb));
    ctx.fillStyle = topFg;
    const q = fit(ctx, p.pergunta, F, 92, 52, W - 2 * PAD, 4);
    ctx.font = F(q.size);
    drawLines(ctx, q.lines, PAD, 260 + q.size * 0.85, q.size * 1.1);
    const ans = /mito/i.test(p.resposta || "") ? "MITO" : /depende/i.test(p.resposta || "") ? "DEPENDE" : "VERDADE";
    ctx.fillStyle = strong(b.bg, b.c1, b.c2, b.c3);
    const a = fit(ctx, ans, F, 150, 90, W - 2 * PAD, 1);
    ctx.font = F(a.size);
    ctx.fillText(ans, PAD, top + 190);
    ctx.fillStyle = onColor(b.bg);
    ctx.font = BODY(40);
    const e = lines(ctx, p.explicacao, W - 2 * PAD).slice(0, 5);
    drawLines(ctx, e, PAD, top + 280, 54);
    footer(ctx, b, H - 110, onColor(b.bg), b.c1);
    frame(ctx, b);
  },
  foto(ctx, b, p) {
    const F = fontOf(b),
      lightPanel = b.layout === "moldura" || b.layout === "editorial",
      panel = lightPanel ? b.bg : b.c1;
    if (b.foto) {
      const s = Math.max(W / b.foto.width, H / b.foto.height);
      const w = b.foto.width * s,
        h = b.foto.height * s;
      ctx.drawImage(b.foto, (W - w) / 2, (H - h) / 2, w, h);
    } else {
      const ph = mix(b.bg, "#000000", 0.06),
        phc = strong(ph, b.c1, b.c2, b.c3);
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = phc;
      ctx.lineWidth = 4;
      ctx.setLineDash([18, 14]);
      rr(ctx, PAD, 120, W - 2 * PAD, 640, 28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = phc;
      ctx.font = BODY(40, 600);
      ctx.textAlign = "center";
      ctx.fillText("A sua foto", W / 2, 420);
      ctx.fillText("entra aqui", W / 2, 476);
      ctx.textAlign = "left";
    }
    if (p.tag) {
      const po = PILL_OUT;
      PILL_OUT = null;
      pill(ctx, p.tag, PAD, 110, b.c1, onColor(b.c1));
      PILL_OUT = po;
    }
    if (p.kind === "comemoracao") {
      ([[W - 170, 170, 30, b.c2], [W - 105, 255, 18, detailOn(b.c1, b)], [W - 235, 270, 14, b.c2]] as const).forEach(
        ([x, y, r, col]) => sparkle(ctx, x, y, r, col)
      );
    }
    const [r, g, bb] = hexRgb(panel);
    const grd = ctx.createLinearGradient(0, H - 640, 0, H - 300);
    grd.addColorStop(0, `rgba(${r},${g},${bb},0)`);
    grd.addColorStop(1, `rgba(${r},${g},${bb},1)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, H - 640, W, 340);
    ctx.fillStyle = panel;
    ctx.fillRect(0, H - 302, W, 302);
    const fg = onColor(panel);
    ctx.fillStyle = fg;
    const t = fit(ctx, p.titulo, F, 84, 50, W - 2 * PAD, 3);
    ctx.font = F(t.size);
    const y0 = H - 230 - (t.lines.length - 1) * t.size * 1.06;
    drawLines(ctx, t.lines, PAD, y0, t.size * 1.06);
    footer(ctx, b, H - 100, fg, lightPanel ? b.c1 : b.c2);
    frame(ctx, b);
  },
  transformacao(ctx, b, p) {
    const F = fontOf(b),
      ph = 940,
      half = W / 2,
      panel = b.c1,
      pfg = onColor(panel);
    ctx.fillStyle = b.bg;
    ctx.fillRect(0, 0, W, H);
    const po = PILL_OUT;
    PILL_OUT = null;
    ([[p.antes, 0, "ANTES"], [p.depois || b.foto, half, "DEPOIS"]] as const).forEach(([img, x, lab]) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, half, ph);
      ctx.clip();
      if (img) {
        const sc = Math.max(half / img.width, ph / img.height),
          w = img.width * sc,
          h = img.height * sc;
        ctx.drawImage(img, x + (half - w) / 2, (ph - h) / 2, w, h);
      } else {
        const bgc = mix(b.bg, "#000000", lab === "ANTES" ? 0.1 : 0.05);
        ctx.fillStyle = bgc;
        ctx.fillRect(x, 0, half, ph);
        ctx.fillStyle = strong(bgc, b.c1, b.c3);
        ctx.font = BODY(34, 600);
        ctx.textAlign = "center";
        ctx.fillText("Foto do " + lab.toLowerCase(), x + half / 2, ph / 2 + 80);
        ctx.textAlign = "left";
      }
      ctx.restore();
      const dep = lab === "DEPOIS";
      pill(ctx, lab, x + 36, 40, dep ? b.c1 : "#FFFFFF", dep ? onColor(b.c1) : INK);
    });
    PILL_OUT = po;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(half - 3, 0, 6, ph);
    ctx.fillStyle = b.c2;
    ctx.beginPath();
    ctx.arc(half, ph / 2, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = onColor(b.c2);
    ctx.beginPath();
    ctx.moveTo(half - 10, ph / 2 - 16);
    ctx.lineTo(half + 14, ph / 2);
    ctx.lineTo(half - 10, ph / 2 + 16);
    ctx.closePath();
    ctx.fill();
    const g = ctx.createLinearGradient(0, ph, W, H);
    g.addColorStop(0, panel);
    g.addColorStop(1, mix(panel, "#000000", lum(panel) < 0.25 ? 0.2 : 0.06));
    ctx.fillStyle = g;
    ctx.fillRect(0, ph, W, H - ph);
    ctx.fillStyle = detailOn(panel, b);
    ctx.fillRect(0, ph, W, 6);
    let y = ph + 72;
    if (p.servico) {
      ctx.fillStyle = strong(panel, b.c2, b.c3, pfg);
      ctx.font = BODY(28, 700);
      ctx.fillText(String(p.servico).toUpperCase(), PAD, y);
      y += 22;
    }
    ctx.fillStyle = pfg;
    const t = fit(ctx, p.titulo || "Antes e depois", F, 70, 44, W - 2 * PAD, 2);
    ctx.font = F(t.size);
    drawLines(ctx, t.lines, PAD, y + t.size * 0.9, t.size * 1.06);
    footer(ctx, b, H - 70, pfg, b.c2);
  },
  // Capa do carrossel da equipe: cor da marca, título e os nomes de quem aparece nos próximos posts.
  equipeCapa(ctx, b, p) {
    const F = fontOf(b),
      fg = onColor(b.c1);
    paint(ctx, b, b.c1);
    pill(ctx, "NOSSA EQUIPE", PAD, 110, b.c2, onColor(b.c2));
    ctx.fillStyle = fg;
    const t = fit(ctx, String(p.titulo || "Quem cuida de você"), F, 120, 64, W - 2 * PAD, 3);
    ctx.font = F(t.size);
    const y = drawLines(ctx, t.lines, PAD, 330 + t.size * 0.8, t.size * 1.05);
    ctx.fillStyle = detailOn(b.c1, b);
    ctx.fillRect(PAD, y + 20, 140, 4);
    ctx.fillStyle = fg;
    ctx.font = BODY(44, 600);
    const nomes = ((p.nomes as string[]) || []).filter(Boolean).slice(0, 8);
    nomes.forEach((n, i) => ctx.fillText(n, PAD, y + 110 + i * 70));
    ctx.font = BODY(32, 600);
    ctx.globalAlpha = 0.85;
    ctx.fillText("Deslize para conhecer  →", PAD, H - 240);
    ctx.globalAlpha = 1;
    footer(ctx, b, H - 110, fg, b.c2);
  },
  // Um profissional: foto grande em cima e, embaixo, só os campos que a cliente escolheu mostrar.
  equipeProfissional(ctx, b, p) {
    const F = fontOf(b),
      panel = b.c1,
      fg = onColor(panel);
    const fatos = ((p.fatos as string[]) || []).filter(Boolean).slice(0, 4);
    const servicos = ((p.servicos as string[]) || []).filter(Boolean).slice(0, 4);
    const temNome = !!p.nome;
    const painelH = Math.min(640, 250 + (temNome ? 110 : 0) + (servicos.length ? 70 : 0) + fatos.length * 62);
    const fotoH = H - painelH;
    const img = p.img1 as HTMLImageElement | undefined;
    ctx.fillStyle = mix(b.bg, "#000000", 0.07);
    ctx.fillRect(0, 0, W, fotoH);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, fotoH);
      ctx.clip();
      const s = Math.max(W / img.width, fotoH / img.height),
        w = img.width * s,
        h = img.height * s;
      // enquadra pelo alto da imagem, onde costuma estar o rosto
      ctx.drawImage(img, (W - w) / 2, Math.min(0, (fotoH - h) * 0.25), w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = strong(mix(b.bg, "#000000", 0.07), b.c1, b.c2, b.c3);
      ctx.font = BODY(40, 600);
      ctx.textAlign = "center";
      ctx.fillText("A foto da profissional", W / 2, fotoH / 2 - 10);
      ctx.font = BODY(30, 400);
      ctx.fillText("entra aqui", W / 2, fotoH / 2 + 38);
      ctx.textAlign = "left";
    }
    // painel
    ctx.fillStyle = panel;
    ctx.fillRect(0, fotoH, W, painelH);
    ctx.fillStyle = detailOn(panel, b);
    ctx.fillRect(0, fotoH, W, 6);
    let y = fotoH + 58;
    if (p.funcao) {
      ctx.fillStyle = strong(panel, b.c2, b.c3, fg);
      ctx.font = BODY(28, 700);
      ctx.fillText(String(p.funcao).toUpperCase().slice(0, 38), PAD, y);
      y += 24;
    }
    if (temNome) {
      ctx.fillStyle = fg;
      const t = fit(ctx, String(p.nome), F, 84, 48, W - 2 * PAD, 1);
      ctx.font = F(t.size);
      ctx.fillText(t.lines[0] || "", PAD, y + t.size * 0.85);
      y += t.size + 22;
    }
    if (servicos.length) {
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.9;
      ctx.font = BODY(32, 600);
      ctx.fillText(lines(ctx, servicos.join("  ·  "), W - 2 * PAD)[0] || "", PAD, y + 36);
      ctx.globalAlpha = 1;
      y += 70;
    }
    ctx.font = BODY(34, 400);
    fatos.forEach((f) => {
      ctx.fillStyle = detailOn(panel, b);
      ctx.beginPath();
      ctx.moveTo(PAD, y + 28);
      ctx.lineTo(PAD + 10, y + 18);
      ctx.lineTo(PAD + 20, y + 28);
      ctx.lineTo(PAD + 10, y + 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(lines(ctx, f, W - 2 * PAD - 44)[0] || "", PAD + 44, y + 40);
      y += 62;
    });
    ctx.fillStyle = fg;
    ctx.globalAlpha = 0.7;
    ctx.font = BODY(24, 600);
    ctx.textAlign = "right";
    ctx.fillText((b.nome || "").toUpperCase().split("").join(" "), W - PAD, H - 44);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  },
  // Dica sobre foto de fundo (banco de imagens da cliente): a foto ocupa o post inteiro e um véu
  // suave, claro ou escuro conforme a imagem, deixa o texto legível.
  dicaFoto(ctx, b, p) {
    const F = fontOf(b);
    const t0 = fundoComVeu(ctx, b, p.img1 as HTMLImageElement | undefined);
    pill(ctx, "DICA", PAD, 110, b.c1, onColor(b.c1));
    ctx.fillStyle = t0.texto;
    const t = fit(ctx, String(p.titulo || ""), F, 92, 54, W - 2 * PAD, 4);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.08);
    ctx.fillStyle = t0.destaque;
    ctx.fillRect(PAD, tr + 8, 120, 4);
    let y = tr + 60;
    ((p.itens as string[]) || []).slice(0, 4).forEach((it, i) => {
      ctx.fillStyle = t0.destaque;
      ctx.font = F(58);
      ctx.fillText(String(i + 1), PAD, y + 46);
      ctx.fillStyle = t0.texto;
      ctx.font = BODY(38);
      const l = lines(ctx, it, W - 2 * PAD - 90).slice(0, 3);
      y = Math.max(drawLines(ctx, l, PAD + 90, y + 40, 50), y + 64) + 30;
    });
    assinaturaFundo(ctx, b, t0.texto);
  },
  // Mito ou verdade sobre foto de fundo.
  mitoFoto(ctx, b, p) {
    const F = fontOf(b);
    const t0 = fundoComVeu(ctx, b, p.img1 as HTMLImageElement | undefined);
    pill(ctx, "MITO OU VERDADE?", PAD, 110, b.c1, onColor(b.c1));
    ctx.fillStyle = t0.texto;
    const q = fit(ctx, String(p.pergunta || ""), F, 88, 50, W - 2 * PAD, 4);
    ctx.font = F(q.size);
    const qy = drawLines(ctx, q.lines, PAD, 270 + q.size * 0.85, q.size * 1.1);
    const r = String(p.resposta || "");
    const ans = /mito/i.test(r) ? "MITO" : /depende/i.test(r) ? "DEPENDE" : "VERDADE";
    ctx.fillStyle = t0.destaque;
    const a = fit(ctx, ans, F, 140, 80, W - 2 * PAD, 1);
    ctx.font = F(a.size);
    ctx.fillText(ans, PAD, qy + 150);
    ctx.fillStyle = t0.texto;
    ctx.font = BODY(38);
    drawLines(ctx, lines(ctx, String(p.explicacao || ""), W - 2 * PAD).slice(0, 5), PAD, qy + 240, 52);
    assinaturaFundo(ctx, b, t0.texto);
  },
  // Foto inteira (padrão dos feeds de salão): a foto de ponta a ponta, sem moldura; só um degradê
  // suave embaixo com o nome do serviço e a assinatura discreta.
  fotoInteira(ctx, b, p) {
    const img = p.img1 as HTMLImageElement | undefined;
    if (img) {
      const s = Math.max(W / img.width, H / img.height),
        w = img.width * s,
        h = img.height * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    } else {
      const ph = mix(b.bg, "#000000", 0.07);
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = strong(ph, b.c1, b.c2, b.c3);
      ctx.font = BODY(40, 600);
      ctx.textAlign = "center";
      ctx.fillText("Sua foto do resultado", W / 2, H / 2 - 20);
      ctx.font = BODY(30, 400);
      ctx.fillText("entra aqui", W / 2, H / 2 + 26);
      ctx.textAlign = "left";
    }
    const g = ctx.createLinearGradient(0, H - 380, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 380, W, 380);
    const F = fontOf(b);
    ctx.fillStyle = "#FFFFFF";
    const t = fit(ctx, String(p.titulo || ""), F, 64, 40, W - 2 * PAD, 1);
    ctx.font = F(t.size);
    ctx.fillText(t.lines[0] || "", PAD, H - 128);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = BODY(24, 600);
    ctx.fillText((b.nome || "").toUpperCase().split("").join(" "), PAD, H - 78);
  },
  // Foto do resultado: a foto ocupa quase o post inteiro; passe-partout na cor de fundo da marca,
  // filete fino na cor de detalhe (moldura discreta e premium) e só o nome do serviço como título.
  fotoPremium(ctx, b, p) {
    fotoComMoldura(ctx, b, p, [p.img1 as HTMLImageElement | undefined], ["Sua foto do resultado"]);
  },
  // Antes e depois: duas fotos grandes lado a lado, etiquetas discretas, mesma moldura e título.
  antesDepois(ctx, b, p) {
    fotoComMoldura(
      ctx,
      b,
      p,
      [p.img1 as HTMLImageElement | undefined, p.img2 as HTMLImageElement | undefined],
      ["Foto do antes", "Foto do depois"],
      ["ANTES", "DEPOIS"],
    );
  },
  depoConversa(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, "DEPOIMENTO", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo || "Mensagem que chegou", F, 84, 52, W - 2 * PAD, 2);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.05);
    ruleUnder(ctx, S, tr, t.size);
    const msg = (p.msgs && p.msgs.length ? p.msgs.join(" ") : p.frase) || "Cole aqui a mensagem que a cliente mandou.";
    const bubbles: { txt: string; me: boolean; ls?: string[]; w?: number; h?: number }[] = [{ txt: msg, me: false }].concat(
      p.resposta ? [{ txt: p.resposta, me: true }] : []
    );
    const maxW = 800,
      padX = 40,
      lh = 52;
    ctx.font = BODY(38);
    bubbles.forEach((bu) => {
      const all = lines(ctx, bu.txt, maxW - 2 * padX),
        mx = bu.me ? 3 : p.resposta ? 6 : 9;
      bu.ls = all.slice(0, mx);
      if (all.length > mx) bu.ls[mx - 1] = bu.ls[mx - 1].replace(/\s*\S*$/, "") + "…";
      bu.w = Math.min(maxW, Math.max(260, ...bu.ls.map((l) => ctx.measureText(l).width)) + 2 * padX);
      bu.h = (bu.me ? 42 : 82) + bu.ls.length * lh;
    });
    let y = tr + 56;
    bubbles.forEach((bu) => {
      const x = bu.me ? W - PAD - bu.w! : PAD,
        fill = bu.me ? S.acc : "#FFFFFF",
        fg = bu.me ? S.accFg : INK;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.14)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = fill;
      rr(ctx, x, y, bu.w!, bu.h!, 34);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = fill;
      ctx.beginPath();
      if (bu.me) {
        ctx.moveTo(x + bu.w! - 34, y + bu.h! - 4);
        ctx.lineTo(x + bu.w! + 14, y + bu.h! + 12);
        ctx.lineTo(x + bu.w! - 6, y + bu.h! - 36);
      } else {
        ctx.moveTo(x + 34, y + bu.h! - 4);
        ctx.lineTo(x - 14, y + bu.h! + 12);
        ctx.lineTo(x + 6, y + bu.h! - 36);
      }
      ctx.closePath();
      ctx.fill();
      let ty = y + 30;
      if (!bu.me) {
        ctx.fillStyle = strong("#FFFFFF", b.c1, b.c3);
        ctx.font = BODY(28, 700);
        ctx.fillText("Cliente", x + padX, ty + 24);
        ty += 40;
      }
      ctx.fillStyle = fg;
      ctx.font = BODY(38);
      drawLines(ctx, bu.ls!, x + padX, ty + 38, lh);
      y += bu.h! + 40;
    });
    base(ctx, b, S, 200);
  },
  depoTres(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b),
      msgs = (p.msgs || []).filter(Boolean).slice(0, 3);
    if (!msgs.length) msgs.push("Cole até 3 elogios reais, um por parágrafo.");
    paint(ctx, b, S.bg);
    pill(ctx, b.tk === "barbearia" ? "O QUE ELES DIZEM" : "O QUE ELAS DIZEM", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo || "Quem vem, volta", F, 84, 52, W - 2 * PAD, 1);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 260 + t.size * 0.8, t.size * 1.05);
    ruleUnder(ctx, S, tr, t.size);
    const top = tr + 36,
      bottom = S.band ? H - 236 : H - 196,
      gap = 26,
      n = msgs.length,
      ch = (bottom - top - gap * (n - 1)) / n;
    const card = lum(S.bg) < 0.25 ? mix(S.bg, "#FFFFFF", 0.12) : "#FFFFFF",
      cfg = onColor(card);
    msgs.forEach((m: string, i: number) => {
      const y = top + i * (ch + gap);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.10)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = card;
      rr(ctx, PAD, y, W - 2 * PAD, ch, 28);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = detailOn(card, b);
      ctx.font = DISPLAY.marcante(130);
      ctx.fillText("“", PAD + 26, y + 110);
      const area = ch - 80;
      let fs = 36,
        ls: string[] = [];
      for (; fs >= 26; fs -= 2) {
        ctx.font = BODY(fs);
        ls = lines(ctx, m, W - 2 * PAD - 150);
        if (ls.length * fs * 1.35 <= area) break;
      }
      const lh = fs * 1.35,
        mx = Math.max(1, Math.floor(area / lh));
      if (ls.length > mx) {
        ls = ls.slice(0, mx);
        ls[mx - 1] = ls[mx - 1].replace(/\s*\S*$/, "") + "…";
      }
      ctx.fillStyle = cfg;
      ctx.font = BODY(fs);
      drawLines(ctx, ls, PAD + 116, y + 26 + (area - ls.length * lh) / 2 + lh * 0.78, lh);
      ctx.globalAlpha = 0.6;
      ctx.font = BODY(24, 700);
      ctx.fillText("CLIENTE", PAD + 116, y + ch - 24);
      ctx.globalAlpha = 1;
    });
    base(ctx, b, S, 200);
  },
  depoimento(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b),
      bandH = S.band ? 200 : 160;
    paint(ctx, b, S.bg);
    const q = fit(ctx, p.frase, F, 76, 42, W - 2 * PAD, 6);
    const blockH = 200 + q.lines.length * q.size * 1.15 + 90,
      top = Math.max(110, (H - bandH - blockH) / 2);
    ctx.fillStyle = S.ed ? S.det : S.accT;
    ctx.font = DISPLAY.marcante(320);
    ctx.fillText(p.convite ? "?" : "“", PAD - 10, top + 250);
    ctx.fillStyle = S.fg;
    ctx.font = F(q.size);
    const y = drawLines(ctx, q.lines, PAD, top + 200 + q.size * 0.8, q.size * 1.15);
    ctx.globalAlpha = 0.72;
    ctx.font = BODY(34, 600);
    ctx.fillText(p.convite ? "Conta pra gente nos comentários" : "Cliente " + (b.nome ? "do " + b.nome : ""), PAD, y + 50);
    ctx.globalAlpha = 1;
    base(ctx, b, S, 200);
  },
  agenda(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, "AGENDA", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo, F, 110, 64, W - 2 * PAD, 2);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 280 + t.size * 0.8, t.size * 1.05);
    ruleUnder(ctx, S, tr, t.size);
    let y = tr + 60;
    const hs = (p.horarios || []).slice(0, 3),
      gap = 30,
      bw = (W - 2 * PAD - gap * (hs.length - 1)) / Math.max(hs.length, 1);
    hs.forEach((h: string, i: number) => {
      const x = PAD + i * (bw + gap);
      ctx.strokeStyle = S.ed ? S.det : S.accT;
      ctx.lineWidth = S.ed ? 3 : 5;
      rr(ctx, x, y, bw, 200, 26);
      ctx.stroke();
      ctx.fillStyle = S.fg;
      ctx.font = F(84);
      ctx.textAlign = "center";
      ctx.fillText(h, x + bw / 2, y + 128);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = S.fg;
    ctx.font = BODY(42);
    drawLines(ctx, lines(ctx, p.chamada, W - 2 * PAD).slice(0, 3), PAD, y + 300, 56);
    base(ctx, b, S, 180);
  },
  servicos(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, "SERVIÇOS", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo || "Nossos serviços", F, 100, 60, W - 2 * PAD, 2);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.05);
    ruleUnder(ctx, S, tr, t.size);
    const y = tr + 40;
    const items = (p.itens || []).slice(0, 6),
      hasDesc = items.some((i: any) => i.desc);
    const rowH = Math.min(hasDesc ? 140 : 100, (H - 220 - y) / Math.max(items.length, 1));
    items.forEach((it: any, i: number) => {
      const ry = y + i * rowH;
      ctx.fillStyle = S.det;
      ctx.beginPath();
      ctx.moveTo(PAD, ry + 34);
      ctx.lineTo(PAD + 12, ry + 22);
      ctx.lineTo(PAD + 24, ry + 34);
      ctx.lineTo(PAD + 12, ry + 46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = S.fg;
      const n = fit(ctx, it.nome, F, hasDesc ? 54 : 58, 36, W - 2 * PAD - 50, 1);
      ctx.font = F(n.size);
      ctx.fillText(n.lines[0] || "", PAD + 50, ry + 48);
      if (it.desc) {
        ctx.globalAlpha = 0.75;
        ctx.font = BODY(30);
        ctx.fillText(lines(ctx, it.desc, W - 2 * PAD - 50)[0] || "", PAD + 50, ry + 92);
        ctx.globalAlpha = 1;
      }
    });
    base(ctx, b, S, 180);
  },
  equipe(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    const circle = (cx: number, cy: number, r: number, ini: string, ring?: boolean) => {
      ctx.fillStyle = S.acc;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = S.bg;
      ctx.lineWidth = 8;
      ctx.stroke();
      if (ring) {
        ctx.strokeStyle = S.det;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = S.accFg;
      ctx.font = F(Math.round(r * 0.8));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ini, cx, cy + 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    };
    if (p.modo === "capa") {
      pill(ctx, "EQUIPE", PAD, 110, S.acc, S.accFg);
      ctx.fillStyle = S.fg;
      const t = fit(ctx, p.titulo || "Quem cuida de você", F, 110, 64, W - 2 * PAD, 3);
      ctx.font = F(t.size);
      drawLines(ctx, t.lines, PAD, 280 + t.size * 0.8, t.size * 1.05);
      const ini = (p.iniciais || []).slice(0, 6),
        n = ini.length,
        r = n > 4 ? 76 : 100,
        step = n > 1 ? Math.min(150, (W - 2 * PAD - 2 * r) / (n - 1)) : 0;
      ini.forEach((s: string, i: number) => circle(PAD + r + i * step, 850, r, s));
      ctx.fillStyle = S.fg;
      ctx.font = BODY(36, 600);
      ctx.fillText("Deslize para conhecer", PAD, 1090);
    } else {
      circle(W / 2, 380, 160, p.iniciais || "", true);
      ctx.fillStyle = S.fg;
      ctx.textAlign = "center";
      const n = fit(ctx, p.nome, F, 96, 56, W - 2 * PAD, 2);
      ctx.font = F(n.size);
      const y = drawLines(ctx, n.lines, W / 2, 640 + n.size * 0.6, n.size * 1.05);
      ctx.fillStyle = S.accT;
      ctx.font = BODY(36, 700);
      ctx.fillText(String(p.funcao || "").toUpperCase(), W / 2, y + 20);
      const dest = p.destaque || p.historia;
      if (dest) {
        ctx.fillStyle = S.fg;
        ctx.font = BODY(38);
        drawLines(ctx, lines(ctx, dest, W - 2 * PAD - 40).slice(0, 5), W / 2, y + 100, 54);
      }
      ctx.textAlign = "left";
    }
    base(ctx, b, S, 180);
  },
  historia(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, String(p.rotulo || "NOSSA HISTÓRIA").toUpperCase(), PAD, 110, S.acc, S.accFg);
    let y = 230;
    if (p.titulo) {
      ctx.fillStyle = S.fg;
      const t = fit(ctx, p.titulo, F, 100, 60, W - 2 * PAD, 2);
      ctx.font = F(t.size);
      const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.05);
      ruleUnder(ctx, S, tr, t.size);
      y = tr + 20;
    }
    ctx.fillStyle = S.fg;
    ctx.font = BODY(42);
    const ls = p.linhas || lines(ctx, p.texto, W - 2 * PAD).slice(0, 8);
    drawLines(ctx, ls, PAD, y + 40, 58);
    if (p.mais) {
      ctx.fillStyle = S.accT;
      ctx.font = BODY(30, 700);
      ctx.textAlign = "right";
      ctx.fillText(p.mais, W - PAD, H - 200);
      ctx.textAlign = "left";
    }
    base(ctx, b, S, 180);
  },
  horarios(ctx, b, p) {
    const S = scheme(b),
      F = fontOf(b);
    paint(ctx, b, S.bg);
    pill(ctx, "HORÁRIOS", PAD, 110, S.acc, S.accFg);
    ctx.fillStyle = S.fg;
    const t = fit(ctx, p.titulo || "Horário de atendimento", F, 100, 60, W - 2 * PAD, 2);
    ctx.font = F(t.size);
    const tr = drawLines(ctx, t.lines, PAD, 270 + t.size * 0.8, t.size * 1.05);
    ruleUnder(ctx, S, tr, t.size);
    const rows = (p.linhas || []).slice(0, 7),
      y0 = tr + 50,
      rh = Math.min(110, (H - 260 - y0) / Math.max(rows.length, 1));
    rows.forEach(([d, h]: [string, string], i: number) => {
      const y = y0 + i * rh;
      ctx.fillStyle = S.fg;
      ctx.font = F(52);
      ctx.fillText(d, PAD, y + rh * 0.62);
      ctx.font = BODY(40, 600);
      ctx.textAlign = "right";
      ctx.globalAlpha = /fechado/i.test(h) ? 0.55 : 1;
      ctx.fillText(h, W - PAD, y + rh * 0.62);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      if (i < rows.length - 1) {
        ctx.fillStyle = S.det;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(PAD, y + rh, W - 2 * PAD, 2);
        ctx.globalAlpha = 1;
      }
    });
    if (p.extra) {
      ctx.fillStyle = S.accT;
      ctx.font = BODY(34, 700);
      ctx.fillText(p.extra, PAD, H - 215);
    }
    base(ctx, b, S, 180);
  },
};

export function makeCanvas(label?: string) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", label || "Arte do post");
  return c;
}

/** Desenha um post no canvas dado o template (tpl), a marca e o conteúdo. */
export function render(canvas: HTMLCanvasElement, tpl: string, brand: Brand, p: PostContent) {
  TXT = brand.txt || { dark: INK, light: "#FFFFFF" };
  const lk = tpl === "transformacao" ? "foto" : tpl === "depoConversa" || tpl === "depoTres" ? "depoimento" : tpl;
  if (brand.set) brand = Object.assign({}, brand, { layout: (brand.set[lk] || BASE_LAYOUT[lk] || "leve") as Brand["layout"] });
  if (!brand.c3) brand = Object.assign({}, brand, { c3: mix(brand.c1, brand.c2, 0.5) });
  PILL_OUT =
    brand.layout === "editorial" ? { col: detailOn(brand.bg, brand), txt: strong(brand.bg, brand.c1, brand.c3) } : null;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  try {
    T[tpl](ctx, brand, p);
  } catch (e) {
    console.error(e);
  }
}

/** Garante que as fontes usadas nos templates estão carregadas antes de renderizar. */
export const fontsReady: Promise<unknown> =
  typeof document !== "undefined"
    ? Promise.all(
        [
          '700 40px "Cormorant Garamond"',
          "400 40px Gloock",
          "700 40px Chivo",
          "400 40px Chivo",
          "600 40px Chivo",
          "700 40px Montserrat",
          'italic 700 40px "Playfair Display"',
          "600 40px Cinzel",
          "700 40px Philosopher",
        ].map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f).catch(() => null) : null))
      ).catch(() => null)
    : Promise.resolve(null);

/* ------------------------------------------------------------------------------------------
   Kit dos 3 posts fixados: um painel de 3240 x 1350 que vira 3 posts (1080 x 1350) e forma o
   banner do perfil. O conteúdo de cada parte fica longe das emendas, porque o Instagram corta
   um pouco as laterais de cada post na grade.
   ------------------------------------------------------------------------------------------ */
export type DadosFixados = {
  rotulo: string; // tipo do negócio, ex.: "Salão de beleza"
  nome: string;
  slogan: string;
  local: string; // "Jabaquara · São Paulo"
  chamada: string; // "Agende pelo link da bio"
  instagram: string; // "@studiobela" ou ""
  foto?: HTMLImageElement | null; // opcional: foto do espaço no post do meio
};

export function renderFixados(canvas: HTMLCanvasElement, brand: Brand, d: DadosFixados) {
  const b: Brand = brand.c3 ? brand : Object.assign({}, brand, { c3: mix(brand.c1, brand.c2, 0.5) });
  TXT = b.txt || { dark: INK, light: "#FFFFFF" };
  const ctx = canvas.getContext("2d")!;
  const LW = 3 * W;
  ctx.clearRect(0, 0, LW, H);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const F = fontOf(b);
  const fg = onColor(b.bg);
  const detalhe = detailOn(b.bg, b);
  const forte = strong(b.bg, b.c1, b.c3, INK);
  const M = 150; // margem segura dentro de cada post

  // fundo contínuo e filete que atravessa os três posts
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, LW, H);
  ctx.strokeStyle = detalhe;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, LW - 80, H - 80);
  ctx.beginPath();
  ctx.moveTo(40, H - 220);
  ctx.lineTo(LW - 40, H - 220);
  ctx.stroke();

  // ---- post 1: o nome ----
  ctx.textAlign = "center";
  ctx.fillStyle = forte;
  ctx.font = BODY(30, 700);
  ctx.fillText(d.rotulo.toUpperCase().split("").join(" "), W / 2, 330);
  ctx.fillStyle = fg;
  const t = fit(ctx, d.nome, F, 150, 70, W - 2 * M, 3);
  ctx.font = F(t.size);
  const altura = t.lines.length * t.size * 1.05;
  drawLines(ctx, t.lines, W / 2, 640 - altura / 2 + t.size * 0.8, t.size * 1.05);
  ctx.fillStyle = detalhe;
  ctx.fillRect(W / 2 - 60, 640 + altura / 2 + 30, 120, 3);
  ctx.fillStyle = fg;
  ctx.font = BODY(30, 400);
  if (d.local) ctx.fillText(d.local, W / 2, 640 + altura / 2 + 100);

  // ---- post 2: foto do espaço, ou o logo/monograma sobre a cor da marca ----
  const x2 = W;
  if (d.foto) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x2 + 70, 70, W - 140, H - 140);
    ctx.clip();
    const s = Math.max((W - 140) / d.foto.width, (H - 140) / d.foto.height);
    const w = d.foto.width * s;
    const h = d.foto.height * s;
    ctx.drawImage(d.foto, x2 + 70 + (W - 140 - w) / 2, 70 + (H - 140 - h) / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = b.c1;
    ctx.fillRect(x2 + 70, 70, W - 140, H - 140);
    const cx = x2 + W / 2;
    const cy = H / 2 - 40;
    if (b.logo && logoRedondo(b.logo)) {
      const L = b.logo;
      const s = 504 / Math.max(L.width, L.height);
      ctx.drawImage(L, cx - (L.width * s) / 2, cy - (L.height * s) / 2, L.width * s, L.height * s);
    } else if (b.logo) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy, 250, 0, Math.PI * 2);
      ctx.fill();
      const L = b.logo;
      const s = Math.min(380 / L.width, 380 / L.height);
      ctx.drawImage(L, cx - (L.width * s) / 2, cy - (L.height * s) / 2, L.width * s, L.height * s);
    } else {
      ctx.strokeStyle = detailOn(b.c1, b);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 250, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = onColor(b.c1);
      const ini = fit(ctx, initials(d.nome), F, 260, 120, 420, 1);
      ctx.font = F(ini.size);
      ctx.fillText(ini.lines[0] || "", cx, cy + ini.size * 0.35);
    }
    ctx.fillStyle = onColor(b.c1);
    ctx.font = BODY(32, 600);
    if (d.instagram) ctx.fillText(d.instagram, cx, H - 230);
  }

  // ---- post 3: a frase e o convite ----
  const x3 = 2 * W;
  ctx.fillStyle = fg;
  const f = fit(ctx, d.slogan, F, 120, 64, W - 2 * M, 4);
  ctx.font = F(f.size);
  const altF = f.lines.length * f.size * 1.08;
  drawLines(ctx, f.lines, x3 + W / 2, 600 - altF / 2 + f.size * 0.8, f.size * 1.08);
  ctx.fillStyle = forte;
  ctx.font = BODY(34, 700);
  const c = lines(ctx, d.chamada, W - 2 * M).slice(0, 2);
  drawLines(ctx, c, x3 + W / 2, 600 + altF / 2 + 110, 48);
  ctx.textAlign = "left";
}

/** Recorta o painel em 3 posts de 1080 x 1350, na ordem da esquerda para a direita. */
export function recortarFixados(painel: HTMLCanvasElement): HTMLCanvasElement[] {
  return [0, 1, 2].map((i) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.getContext("2d")!.drawImage(painel, i * W, 0, W, H, 0, 0, W, H);
    return c;
  });
}
