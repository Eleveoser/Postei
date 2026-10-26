"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fontsReady, render, type Brand } from "@/lib/art-engine";
import { coresFinais, txtDe } from "@/lib/marca-cores";
import { CONJUNTOS, EXEMPLO_POST, PALETTES } from "@/lib/marca-data";
import type { DadosMarca } from "./tipos";

export type SetDados = <K extends keyof DadosMarca>(k: K, v: DadosMarca[K]) => void;

export const campo =
  "min-h-14 w-full rounded-[16px] border-2 border-[#B9B29C] bg-white px-4 text-base font-semibold text-[#0E1330] placeholder:font-medium placeholder:text-[#8A8FA8] focus:border-[#0E1330] focus:outline-none";
export const botaoPrimario =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C] disabled:text-[#F6F3EA]";
export const botaoSecundario =
  "flex min-h-12 items-center justify-center rounded-[16px] border-2 border-[#0E1330] px-5 text-[15px] font-extrabold text-[#0E1330] active:scale-[0.99]";

export function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">{children}</h1>
      {sub && <p className="text-base font-medium leading-snug text-[#4A4F6B]">{sub}</p>}
    </div>
  );
}

export function Chip({ rotulo, sel, onClick, principal = false }: { rotulo: string; sel: boolean; onClick: () => void; principal?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={sel}
      onClick={onClick}
      className={`min-h-12 rounded-full border-2 px-4 text-[15px] font-bold transition active:scale-[0.98] ${
        principal && sel
          ? "border-[#0E1330] bg-[#C8FF2E] text-[#0E1330]"
          : sel
            ? "border-[#0E1330] bg-[#0E1330] text-white"
            : "border-[#B9B29C] bg-white"
      }`}
    >
      {principal && sel ? "★ " : sel ? "✓ " : ""}{rotulo}
    </button>
  );
}

/* ---------------- imagens (logo e foto de fundo) ---------------- */

export function useImagem(url: string | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
    i.src = url;
  }, [url]);
  return url ? img : null;
}

/** Reduz a imagem no celular antes de enviar (logo 512 px, fundo 1080 px): pouco armazenamento. */
export async function reduzirImagem(file: File, max: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const esc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * esc));
  c.height = Math.max(1, Math.round(bmp.height * esc));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise<Blob>((ok, falha) =>
    c.toBlob((b) => (b ? ok(b) : falha(new Error("sem imagem"))), "image/webp", 0.86),
  );
}

export async function enviarImagem(userId: string, nome: "logo" | "fundo", blob: Blob): Promise<string> {
  const supabase = createClient();
  const caminho = `${userId}/${nome}.webp`;
  const { error } = await supabase.storage.from("logos").upload(caminho, blob, { upsert: true, contentType: "image/webp" });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function carregarBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(blob);
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = falha;
    i.src = url;
  });
}

/* ---------------- arte da marca (desenhada no celular, sem custo) ---------------- */

export function montarMarca(
  d: DadosMarca,
  logo: HTMLImageElement | null,
  fundo: HTMLImageElement | null,
  conjuntoId?: string,
): Brand | null {
  const pal = PALETTES.find((p) => p.id === d.palId);
  const conj = CONJUNTOS.find((c) => c.id === (conjuntoId ?? d.conjunto));
  if ((!pal && !d.custom) || !conj || !d.fonte) return null;
  const cores = coresFinais(pal, d.custom, d.inv);
  return {
    nome: d.nome || "Seu negócio",
    ...cores,
    estilo: d.fonte as Brand["estilo"],
    layout: "bloco",
    set: conj.map,
    fundoMode: d.fundo,
    fundo,
    tk: d.tipo || "outro",
    logo,
    txt: txtDe(cores.c1, cores.c2, d.txtL, d.txtD),
  };
}

export const AMOSTRAS = ["dica", "oferta", "depoimento"] as const;

function usePrevia(marca: Brand | null, refs: React.MutableRefObject<(HTMLCanvasElement | null)[]>) {
  useEffect(() => {
    if (!marca) return;
    let vivo = true;
    const t = window.setTimeout(() => {
      fontsReady.then(() => {
        if (!vivo) return;
        AMOSTRAS.forEach((tpl, i) => {
          const c = refs.current[i];
          if (c) render(c, tpl, marca, EXEMPLO_POST[tpl]);
        });
      });
    }, 120);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [marca, refs]);
}

/** Faixa de posts de exemplo, rolando de lado. */
export function PreviaFeed({ d }: { d: DadosMarca }) {
  const logo = useImagem(d.logoUrl);
  const fundo = useImagem(d.fundoUrl);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const marca = useMemo(() => montarMarca(d, logo, fundo), [d, logo, fundo]);
  usePrevia(marca, refs);
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2" aria-label="Prévia dos seus posts">
      {AMOSTRAS.map((tpl, i) => (
        <canvas
          key={tpl}
          ref={(el) => { refs.current[i] = el; }}
          width={1080}
          height={1350}
          role="img"
          aria-label={`Exemplo de post ${i + 1}`}
          className="aspect-[4/5] w-[72%] max-w-[300px] flex-none snap-center rounded-[18px] border border-[#D9D3C0] bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

/** Três posts pequenos lado a lado, no estilo de feed escolhido. */
export function FaixaFeed({ d, conjuntoId }: { d: DadosMarca; conjuntoId: string }) {
  const logo = useImagem(d.logoUrl);
  const fundo = useImagem(d.fundoUrl);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const marca = useMemo(() => montarMarca(d, logo, fundo, conjuntoId), [d, logo, fundo, conjuntoId]);
  usePrevia(marca, refs);
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden="true">
      {AMOSTRAS.map((tpl, i) => (
        <canvas
          key={tpl}
          ref={(el) => { refs.current[i] = el; }}
          width={1080}
          height={1350}
          className="aspect-[4/5] w-full rounded-[10px] border border-[#D9D3C0] bg-white"
        />
      ))}
    </div>
  );
}
