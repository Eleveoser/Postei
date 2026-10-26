"use client";

import { useRef, useState } from "react";

// Monta o reels no próprio celular: junta até 3 tomadas, põe o texto do roteiro na tela e grava
// um vídeo vertical (1080 x 1920). Nada é enviado ao servidor: custo zero e privacidade.
// Sem som: a cliente escolhe a música no Instagram, que é onde as músicas são liberadas.

type Props = {
  roteiro: { tela: string; cena: string }[];
  corFundo: string;
  corTexto: string;
  nome: string;
};

const LARG = 1080;
const ALT = 1920;
const MAX_SEG = 5;

function escolherFormato(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const opcoes: [string, string][] = [
    ["video/mp4;codecs=avc1", "mp4"],
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9", "webm"],
    ["video/webm", "webm"],
  ];
  for (const [mime, ext] of opcoes) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  return null;
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > max && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas.slice(0, 4);
}

export default function ReelsMontador({ roteiro, corFundo, corTexto, nome }: Props) {
  const [arquivos, setArquivos] = useState<(File | null)[]>([null, null, null]);
  const [estado, setEstado] = useState<"" | "montando" | "pronto" | "erro">("");
  const [msg, setMsg] = useState("");
  const [video, setVideo] = useState<{ url: string; ext: string } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const escolher = (i: number, f: File | undefined) => setArquivos((a) => a.map((x, j) => (j === i ? (f ?? null) : x)));

  const montar = async () => {
    const formato = escolherFormato();
    const lista = arquivos.filter(Boolean) as File[];
    if (!formato || !canvas.current) {
      setEstado("erro");
      setMsg("Este celular não consegue montar vídeo pelo navegador. Use o passo a passo para montar no Instagram.");
      return;
    }
    if (!lista.length) return;
    setEstado("montando");
    setMsg("Montando o seu reels. Deixe esta tela aberta.");
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);

    const c = canvas.current;
    const ctx = c.getContext("2d")!;
    const stream = c.captureStream(30);
    const gravador = new MediaRecorder(stream, { mimeType: formato.mime, videoBitsPerSecond: 6_000_000 });
    const partes: Blob[] = [];
    gravador.ondataavailable = (e) => e.data.size && partes.push(e.data);
    const fim = new Promise<void>((ok) => (gravador.onstop = () => ok()));
    gravador.start(250);

    try {
      for (let i = 0; i < arquivos.length; i++) {
        const f = arquivos[i];
        if (!f) continue;
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.src = URL.createObjectURL(f);
        await new Promise<void>((ok, erro) => {
          v.onloadeddata = () => ok();
          v.onerror = () => erro(new Error("video"));
        });
        const ate = Math.min(v.duration || MAX_SEG, MAX_SEG);
        await v.play();
        const texto = roteiro[i]?.tela ?? "";
        await new Promise<void>((ok) => {
          const quadro = () => {
            // vídeo preenchendo a tela vertical
            const s = Math.max(LARG / v.videoWidth, ALT / v.videoHeight);
            const w = v.videoWidth * s;
            const h = v.videoHeight * s;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, LARG, ALT);
            ctx.drawImage(v, (LARG - w) / 2, (ALT - h) / 2, w, h);
            // texto do roteiro em uma caixa na cor da marca, no terço de baixo
            if (texto) {
              ctx.font = "700 64px Chivo, Arial, sans-serif";
              const linhas = quebrar(ctx, texto, LARG - 200);
              const alturaCaixa = linhas.length * 82 + 70;
              const y0 = ALT * 0.68;
              ctx.fillStyle = corFundo;
              ctx.globalAlpha = 0.9;
              ctx.beginPath();
              ctx.roundRect(70, y0, LARG - 140, alturaCaixa, 28);
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.fillStyle = corTexto;
              ctx.textAlign = "center";
              linhas.forEach((l, k) => ctx.fillText(l, LARG / 2, y0 + 92 + k * 82));
              ctx.textAlign = "left";
            }
            // assinatura discreta
            ctx.font = "600 34px Chivo, Arial, sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.textAlign = "center";
            ctx.fillText(nome, LARG / 2, ALT - 110);
            ctx.textAlign = "left";
            if (v.currentTime >= ate || v.ended) {
              v.pause();
              URL.revokeObjectURL(v.src);
              ok();
            } else requestAnimationFrame(quadro);
          };
          requestAnimationFrame(quadro);
        });
      }
      gravador.stop();
      await fim;
      const blob = new Blob(partes, { type: formato.mime.split(";")[0] });
      setVideo({ url: URL.createObjectURL(blob), ext: formato.ext });
      setEstado("pronto");
      setMsg(
        formato.ext === "mp4"
          ? "Pronto! Salve o vídeo e poste no Instagram, escolhendo a música por lá."
          : "Pronto! Este celular gerou o vídeo em formato WebM. Se o Instagram não aceitar, use o passo a passo para montar por lá.",
      );
    } catch {
      if (gravador.state !== "inactive") gravador.stop();
      setEstado("erro");
      setMsg("Não consegui ler um dos vídeos. Tente gravar de novo com a câmera do celular.");
    }
  };

  const salvar = () => {
    if (!video) return;
    const a = document.createElement("a");
    a.href = video.url;
    a.download = `reels.${video.ext}`;
    a.click();
  };

  return (
    <section aria-labelledby="h-montar" className="flex flex-col gap-3 rounded-[20px] border-2 border-[#0E1330] bg-white p-4">
      <h2 id="h-montar" className="text-xl font-extrabold">Montar o vídeo aqui (teste)</h2>
      <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
        Escolha as tomadas que você gravou. O app junta tudo, coloca o texto de cada tomada e entrega o reels pronto. Os vídeos não saem do seu celular.
      </p>
      {roteiro.map((t, i) => (
        <label key={i} className="flex flex-col gap-1 text-[15px] font-extrabold">
          Tomada {i + 1}
          <span className="text-[13px] font-medium text-[#4A4F6B]">{t.cena}</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => escolher(i, e.target.files?.[0])}
            className="text-[14px] font-medium file:mr-3 file:min-h-11 file:rounded-full file:border-2 file:border-[#0E1330] file:bg-white file:px-4 file:font-extrabold"
          />
        </label>
      ))}
      <button
        type="button"
        onClick={montar}
        disabled={estado === "montando" || !arquivos.some(Boolean)}
        className="flex min-h-14 items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] disabled:bg-[#B9B29C]"
      >
        {estado === "montando" ? "Montando..." : "Montar o reels"}
      </button>
      <canvas ref={canvas} width={LARG} height={ALT} className={estado === "montando" ? "mx-auto w-40 rounded-[12px]" : "hidden"} aria-hidden="true" />
      {msg && (
        <p role="status" className={`rounded-[14px] px-4 py-3 text-[15px] font-bold ${estado === "erro" ? "bg-[#FFE3DD] text-[#8A1F0A]" : "bg-[#E6F6C8] text-[#2B4A00]"}`}>
          {msg}
        </p>
      )}
      {video && (
        <>
          <video src={video.url} controls playsInline className="mx-auto w-48 rounded-[12px]" />
          <button
            type="button"
            onClick={salvar}
            className="flex min-h-14 items-center justify-center rounded-[18px] border-2 border-[#0E1330] bg-white px-6 text-base font-extrabold"
          >
            Salvar o vídeo
          </button>
        </>
      )}
    </section>
  );
}
