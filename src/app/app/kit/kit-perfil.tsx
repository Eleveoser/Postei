"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fontsReady, recortarFixados, renderFixados, type Brand } from "@/lib/art-engine";

type Props = {
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  tipoNegocio: string;
  rotulo: string;
  nome: string;
  local: string;
  instagram: string;
  waBio: boolean;
  principais: string[];
};

// Frases do post 3, sempre na voz do negócio e sem promessa de resultado.
const SLOGANS: Record<string, string[]> = {
  barbearia: ["Estilo e cuidado em cada detalhe", "O seu corte, do seu jeito", "Tradição, técnica e um bom papo"],
  pilates: ["Movimento que cuida de você", "Corpo em movimento, mente em equilíbrio", "Aulas pensadas para você"],
  padrao: ["Beleza que transforma", "Cuidado em cada detalhe", "O seu momento de cuidar de você", "Técnica e carinho em cada atendimento"],
};

const botao =
  "flex min-h-12 w-full items-center justify-center rounded-[16px] bg-[#0E1330] px-4 text-[15px] font-extrabold text-[#C8FF2E] active:scale-[0.99]";

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

export default function KitPerfil({ marca, logoUrl, tipoNegocio, rotulo, nome, local, instagram, waBio, principais }: Props) {
  const opcoes = SLOGANS[tipoNegocio] ?? SLOGANS.padrao;
  const [slogan, setSlogan] = useState(opcoes[0]);
  const [proprio, setProprio] = useState("");
  const [foto, setFoto] = useState<HTMLImageElement | null>(null);
  const [partes, setPartes] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const painel = useRef<HTMLCanvasElement>(null);
  const recortes = useRef<HTMLCanvasElement[]>([]);
  const chamada = waBio ? "Agende pelo WhatsApp: link na bio" : "Agende pelo direct";
  const frase = proprio.trim() || slogan;

  const dados = useMemo(() => ({ rotulo, nome, slogan: frase, local, chamada, instagram, foto }), [rotulo, nome, frase, local, chamada, instagram, foto]);

  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(() => {
      Promise.all([fontsReady, carregar(logoUrl)]).then(([, logo]) => {
        if (!vivo || !painel.current) return;
        renderFixados(painel.current, { ...marca, logo, fundo: null }, dados);
        recortes.current = recortarFixados(painel.current);
        setPartes(recortes.current.map((c) => c.toDataURL("image/jpeg", 0.8)));
      });
    }, 150);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [marca, logoUrl, dados]);

  const legendas = [
    `Boas-vindas! Que bom ter você por aqui.\n\n${nome}${local ? ` · ${local}` : ""}`,
    `Este é o nosso espaço. Venha nos conhecer.\n\n${chamada}.`,
    `${frase}.${principais.length ? `\n\nPor aqui você encontra ${principais.join(", ").toLowerCase()} e muito mais.` : ""}\n\n${chamada}.`,
  ];

  const baixar = (i: number) => {
    recortes.current[i]?.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixado-${i + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const copiar = async (i: number) => {
    try {
      await navigator.clipboard.writeText(legendas[i]);
      setAviso(`Legenda do post ${i + 1} copiada.`);
    } catch {
      setAviso("Não consegui copiar sozinho: toque e segure no texto para copiar.");
    }
    window.setTimeout(() => setAviso(""), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <canvas ref={painel} width={3240} height={1350} className="hidden" aria-hidden="true" />

      <div className="grid grid-cols-3 gap-1 rounded-[14px] bg-[#0E1330] p-1" aria-label="Como fica o topo do seu perfil">
        {[0, 1, 2].map((i) =>
          partes[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={partes[i]} alt={`Post fixado ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
          ) : (
            <div key={i} className="aspect-[4/5] w-full bg-[#F6F3EA]" />
          ),
        )}
      </div>

      <section aria-labelledby="h-frase" className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4">
        <h2 id="h-frase" className="text-lg font-extrabold">A frase do terceiro post</h2>
        <div className="flex flex-wrap gap-2">
          {opcoes.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={!proprio.trim() && slogan === o}
              onClick={() => {
                setSlogan(o);
                setProprio("");
              }}
              className={`min-h-11 rounded-full border-2 px-4 text-[14px] font-bold ${!proprio.trim() && slogan === o ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}
            >
              {o}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="kit-frase">
          Ou escreva a sua
          <input
            id="kit-frase"
            value={proprio}
            onChange={(e) => setProprio(e.target.value)}
            maxLength={48}
            placeholder="Até 48 letras. Sem promessa de resultado"
            className="min-h-12 w-full rounded-[14px] border-2 border-[#B9B29C] bg-white px-4 text-base font-semibold focus:border-[#0E1330] focus:outline-none"
          />
        </label>
      </section>

      <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4">
        <h2 className="text-lg font-extrabold">Foto do seu espaço no post do meio (opcional)</h2>
        <p className="text-[14px] font-medium text-[#4A4F6B]">Sem foto, entra o seu logo (ou as iniciais) na cor da marca. A foto não sai do seu celular.</p>
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-[16px] border-2 border-[#0E1330] px-4 text-[15px] font-extrabold">
          {foto ? "Trocar a foto" : "Escolher a foto do espaço"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const i = new Image();
              i.onload = () => setFoto(i);
              i.src = URL.createObjectURL(f);
            }}
          />
        </label>
        {foto && (
          <button type="button" onClick={() => setFoto(null)} className="min-h-11 text-[15px] font-extrabold underline">
            Usar o logo no lugar da foto
          </button>
        )}
      </section>

      <section aria-labelledby="h-postar" className="flex flex-col gap-3 rounded-[20px] border-2 border-[#0E1330] bg-white p-4">
        <h2 id="h-postar" className="text-lg font-extrabold">Como postar e fixar</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] font-medium leading-snug">
          <li>Salve os 3 posts abaixo.</li>
          <li>Publique na ordem inversa: primeiro o <b>post 3</b>, depois o <b>2</b> e por último o <b>1</b>.</li>
          <li>Fixe também nessa ordem: <b>3</b>, <b>2</b> e <b>1</b> (nos três pontinhos do post, toque em <b>Fixar no perfil</b>).</li>
          <li>Se a ordem ficar trocada, desafixe e fixe de novo na ordem certa.</li>
        </ol>
        {[2, 1, 0].map((i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[16px] bg-[#F6F3EA] p-3">
            <p className="text-[15px] font-extrabold">Post {i + 1}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={botao} onClick={() => baixar(i)} disabled={!partes[i]}>Salvar a arte</button>
              <button type="button" className={botao} onClick={() => void copiar(i)}>Copiar a legenda</button>
            </div>
            <p className="whitespace-pre-line text-[14px] font-medium leading-snug text-[#4A4F6B]">{legendas[i]}</p>
          </div>
        ))}
        {aviso && <p role="status" className="rounded-[14px] bg-[#E6F6C8] px-4 py-3 text-[15px] font-bold text-[#2B4A00]">{aviso}</p>}
      </section>
    </div>
  );
}
