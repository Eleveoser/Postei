"use client";

import { useEffect, useRef } from "react";
import { fontsReady, render, type Brand } from "@/lib/art-engine";

type Props = {
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  arte: { tpl: string; dados: Record<string, unknown> } | null;
  className?: string;
};

function carregar(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((ok) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = url;
  });
}

/** Miniatura da arte do post, desenhada no celular (sem custo de servidor). */
export default function MiniArte({ marca, logoUrl, arte, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let vivo = true;
    if (!arte) return;
    Promise.all([fontsReady, carregar(logoUrl)]).then(([, logo]) => {
      if (!vivo || !ref.current) return;
      render(ref.current, arte.tpl, { ...marca, logo, fundo: null }, arte.dados);
    });
    return () => {
      vivo = false;
    };
  }, [marca, logoUrl, arte]);
  if (!arte) return null;
  return <canvas ref={ref} width={1080} height={1350} aria-hidden="true" className={className ?? "aspect-[4/5] w-16 flex-none rounded-[8px] border border-[#D9D3C0] bg-white"} />;
}
