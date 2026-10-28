// Cálculo das cores da marca (portado do protótipo). Funções puras: servem no celular
// (prévia) e no servidor (valida e guarda as cores finais).

import type { Paleta } from "./marca-data";

export const INK = "#211A1E";

export function hexRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
}

export function lum(hex: string) {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string) {
  const A = lum(a) + 0.05;
  const B = lum(b) + 0.05;
  return Math.max(A, B) / Math.min(A, B);
}

export function mix(a: string, b: string, t: number) {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export const ehHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

export type CoresCustom = { c1: string; c2: string; c3: string; bg?: string }; // bg: fundo claro (opcional; sem ele é calculado)
export type Cores = { c1: string; c2: string; c3: string; bg: string };

const customBg = (c1: string, c2: string, bg?: string) =>
  bg && ehHex(bg) ? (lum(bg) > 0.55 ? bg : mix(bg, "#FFFFFF", 0.85)) : lum(c2) > 0.7 ? c2 : mix(c1, "#FFFFFF", 0.94);

/** Cores finais da marca: paleta pronta ou cores próprias, com inversão e ajuste de contraste. */
export function coresFinais(pal: Paleta | undefined, custom: CoresCustom | null, inv: boolean): Cores {
  const base = pal ?? { c1: "#1C1A19", c2: "#E9DFCC", c3: "#B8975A", bg: "#F7F3EC" };
  let c1 = custom?.c1 || base.c1;
  let c2 = custom?.c2 || base.c2;
  const c3 = custom?.c3 || base.c3 || mix(c1, c2, 0.5);
  if (inv) [c1, c2] = [c2, c1];
  if (contrast(c1, c2) < 1.8) c2 = lum(c1) < 0.3 ? mix(c1, "#FFFFFF", 0.72) : mix(c1, "#000000", 0.55);
  const bg = custom ? customBg(c1, c2, custom.bg) : base.bg;
  return { c1, c2, c3, bg };
}

export type TxtL = "ink" | "main";
export type TxtD = "white" | "off" | "accent";

/** Cor do texto: em fundo claro (dark) e em fundo de cor (light). */
export function txtDe(c1: string, c2: string, l: TxtL, d: TxtD) {
  return { dark: l === "main" ? c1 : INK, light: d === "accent" ? c2 : d === "off" ? "#F5EFE6" : "#FFFFFF" };
}

/** As cores mais frequentes e bem diferentes entre si do logo (roda só no navegador). */
export function logoPalette(img: HTMLImageElement): CoresCustom | null {
  const n = 64;
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const x = c.getContext("2d");
  if (!x) return null;
  x.drawImage(img, 0, 0, n, n);
  let data: Uint8ClampedArray;
  try {
    data = x.getImageData(0, 0, n, n).data;
  } catch {
    return null;
  }
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = [data[i], data[i + 1], data[i + 2]].map((v) => Math.min(255, Math.round(v / 24) * 24));
    const hex = "#" + key.map((v) => v.toString(16).padStart(2, "0")).join("");
    if (lum(hex) > 0.86) continue;
    buckets.set(hex, (buckets.get(hex) || 0) + 1);
  }
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  if (!ranked.length) return null;
  const dist = (a: string, b: string) => {
    const A = hexRgb(a);
    const B = hexRgb(b);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };
  const first = ranked[0];
  const second = ranked.find((h) => dist(h, first) > 90);
  const third = ranked.find((h) => h !== second && dist(h, first) > 90 && (!second || dist(h, second) > 90));
  let c1 = first;
  let c2 = second || "#FFFFFF";
  if (lum(c2) < lum(c1)) [c1, c2] = [c2, c1];
  const usadas = [first, second, third].filter(Boolean) as string[];
  const fourth = ranked.find((h) => usadas.every((u) => dist(h, u) > 60));
  const fundo = fourth ? (lum(fourth) > 0.6 ? fourth : mix(fourth, "#FFFFFF", 0.85)) : undefined;
  return { c1, c2, c3: third || mix(c1, "#000000", 0.35), ...(fundo ? { bg: fundo } : {}) };
}
