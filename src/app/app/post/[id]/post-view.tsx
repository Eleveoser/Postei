"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fontsReady, render, type Brand } from "@/lib/art-engine";
import { comImagens } from "@/lib/arte-imagens";
import { marcarPublicado, mudarPost, registrarUso, salvarLegenda } from "../../actions";
import ReelsMontador from "./reels-montador";

type Props = {
  id: string;
  tipo: string;
  servico: string;
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  fundoUrl: string | null;
  arte: { tpl: string; dados: Record<string, unknown> } | null;
  legendaInicial: string;
  roteiro: { tela: string; cena: string }[];
  publicado: boolean;
};

const botao =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C]";
const botaoSec =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] border-2 border-[#0E1330] bg-white px-6 text-base font-extrabold text-[#0E1330] active:scale-[0.99]";

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

/** Foto escolhida no celular: vira imagem para a arte sem sair do aparelho (nada é enviado). */
function lerFoto(file: File): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = erro;
    i.src = URL.createObjectURL(file);
  });
}

export default function PostView({ id, tipo, servico, marca, logoUrl, fundoUrl, arte, legendaInicial, roteiro, publicado }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [legenda, setLegenda] = useState(legendaInicial);
  const [aviso, setAviso] = useState("");
  const [feito, setFeito] = useState(publicado);
  const [, startTransition] = useTransition();
  const ehFoto = arte?.tpl === "fotoInteira" || arte?.tpl === "fotoPremium" || arte?.tpl === "antesDepois";
  const [modo, setModo] = useState<"fotoInteira" | "fotoPremium" | "antesDepois">(
    arte?.tpl === "antesDepois" || arte?.tpl === "fotoPremium" ? arte.tpl : "fotoInteira",
  );
  const [img1, setImg1] = useState<HTMLImageElement | null>(null);
  const [img2, setImg2] = useState<HTMLImageElement | null>(null);

  const arteAtual = useMemo(
    () => (arte && ehFoto ? { tpl: modo, dados: { ...arte.dados, img1, img2 } } : arte),
    [arte, ehFoto, modo, img1, img2],
  );
  const fotosProntas = !ehFoto || (modo === "antesDepois" ? !!img1 && !!img2 : !!img1);

  useEffect(() => {
    let vivo = true;
    Promise.all([fontsReady, carregar(logoUrl), carregar(fundoUrl), arteAtual ? comImagens(arteAtual.dados) : Promise.resolve({})]).then(([, logo, fundo, dados]) => {
      if (!vivo || !canvas.current || !arteAtual) return;
      render(canvas.current, arteAtual.tpl, { ...marca, logo, fundo }, dados);
    });
    return () => {
      vivo = false;
    };
  }, [arteAtual, marca, logoUrl, fundoUrl]);

  const mostrar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(""), 2500);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
      mostrar("Legenda copiada. Agora é só colar no Instagram.");
    } catch {
      mostrar("Não consegui copiar sozinho: toque e segure no texto para copiar.");
    }
    startTransition(() => void registrarUso(id, "copiou_legenda"));
  };

  const baixar = () => {
    canvas.current?.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post-${id.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      mostrar("Arte salva no seu aparelho.");
    }, "image/png");
    startTransition(() => void registrarUso(id, "baixou_arte"));
  };

  const escolherFoto = async (qual: 1 | 2, file: File | undefined) => {
    if (!file) return;
    try {
      const img = await lerFoto(file);
      if (qual === 1) setImg1(img);
      else setImg2(img);
    } catch {
      mostrar("Não consegui abrir essa foto. Tente outra.");
    }
  };

  const salvar = () => startTransition(() => void salvarLegenda(id, legenda).then(() => mostrar("Legenda salva.")));

  const trocarPorDica = () => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("tipo", "dica");
    fd.set("tema", servico);
    startTransition(async () => {
      await mudarPost(fd);
      window.location.reload();
    });
  };

  const seletorFoto = (qual: 1 | 2, rotulo: string, img: HTMLImageElement | null) => (
    <label className={`${img ? botaoSec : botao} cursor-pointer`}>
      {img ? `Trocar ${rotulo.toLowerCase()}` : rotulo}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherFoto(qual, e.target.files?.[0])} />
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      {ehFoto && (
        <section aria-labelledby="h-foto" className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
          <h2 id="h-foto" className="text-xl font-extrabold">Dia de mostrar o seu trabalho</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de foto">
            {([["fotoInteira", "Foto inteira"], ["fotoPremium", "Com moldura"], ["antesDepois", "Antes e depois"]] as const).map(([v, r]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={modo === v}
                onClick={() => setModo(v)}
                className={`min-h-12 rounded-full border-2 px-2 text-[14px] font-bold leading-tight ${modo === v ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}
              >
                {r}
              </button>
            ))}
          </div>
          {modo !== "antesDepois" ? (
            seletorFoto(1, "Escolher a foto do resultado", img1)
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {seletorFoto(1, "Foto do antes", img1)}
              {seletorFoto(2, "Foto do depois", img2)}
            </div>
          )}
          <p className="text-[14px] font-medium leading-snug text-[#4A4F6B]">
            Use foto real do seu trabalho. Se aparecer o rosto de uma cliente, combine com ela antes de postar. A foto não sai do seu celular.
          </p>
          <details className="rounded-[14px] bg-[#F6F3EA] px-3.5 py-2">
            <summary className="min-h-11 cursor-pointer py-2 text-[15px] font-extrabold">Dica de ouro: o seu cantinho da foto</summary>
            <ul className="flex list-disc flex-col gap-1 pb-2 pl-5 text-[14px] font-medium leading-snug">
              <li>Escolha um lugar fixo para todas as fotos: a mesma parede ou o mesmo fundo.</li>
              <li>Use sempre a mesma luz: perto de uma janela ou com uma luz de apoio.</li>
              <li>Celular na vertical, na altura do resultado, e lente limpa.</li>
              <li>É isso que deixa o feed bonito e com cara de marca, mais do que qualquer filtro.</li>
            </ul>
          </details>
          <button type="button" onClick={trocarPorDica} className="min-h-11 text-[15px] font-extrabold underline">
            Não tenho foto hoje: trocar por uma dica
          </button>
        </section>
      )}

      {arteAtual ? (
        <canvas ref={canvas} width={1080} height={1350} role="img" aria-label="Arte do post" className="aspect-[4/5] w-full rounded-[18px] border border-[#D9D3C0] bg-white shadow-sm" />
      ) : (
        <p className="rounded-[18px] bg-white p-4 text-[15px] font-semibold text-[#4A4F6B]">Este post ainda não tem arte.</p>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className={botao} onClick={baixar} disabled={!arteAtual || !fotosProntas}>Salvar a arte</button>
        <button type="button" className={botao} onClick={copiar}>Copiar a legenda</button>
      </div>
      {aviso && <p role="status" className="rounded-[14px] bg-[#E6F6C8] px-4 py-3 text-[15px] font-bold text-[#2B4A00]">{aviso}</p>}

      <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="legenda">
        Legenda
        <textarea
          id="legenda"
          rows={10}
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          className="w-full rounded-[16px] border-2 border-[#B9B29C] bg-white px-4 py-3 text-base font-medium leading-relaxed focus:border-[#0E1330] focus:outline-none"
        />
      </label>
      {legenda !== legendaInicial && (
        <button type="button" className={botaoSec} onClick={salvar}>Salvar a legenda ajustada</button>
      )}

      {roteiro.length > 0 && (
        <section aria-labelledby="h-roteiro" className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4">
          <h2 id="h-roteiro" className="text-xl font-extrabold">Roteiro do Reels (3 tomadas)</h2>
          <ol className="flex flex-col gap-3">
            {roteiro.map((t, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#4A4F6B]">Tomada {i + 1}</span>
                <span className="text-[15px] font-semibold">{t.cena}</span>
                <span className="text-[15px] font-medium text-[#4A4F6B]">Texto na tela: &ldquo;{t.tela}&rdquo;</span>
              </li>
            ))}
          </ol>
          <div className="mt-1 flex flex-col gap-2 rounded-[16px] bg-[#F6F3EA] p-3.5">
            <h3 className="text-base font-extrabold">Como gravar e postar</h3>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] font-medium leading-snug">
              <li>Grave as 3 tomadas no celular, na vertical, seguindo o roteiro acima (de 3 a 5 segundos cada).</li>
              <li>Monte o vídeo logo abaixo, ou no próprio Instagram (toque em <b>+</b> e depois em <b>Reels</b>).</li>
              <li>Toque em <b>Salvar a arte</b>: ela será a capa do seu reels.</li>
              <li>No Instagram, escolha a música e, antes de publicar, toque em <b>Editar capa</b> e escolha a arte salva.</li>
              <li>Toque em <b>Copiar a legenda</b> aqui, cole no Instagram e publique.</li>
            </ol>
          </div>
        </section>
      )}

      {tipo === "reels" && roteiro.length > 0 && (
        <ReelsMontador roteiro={roteiro} corFundo={marca.c1} corTexto={marca.txt?.light ?? "#FFFFFF"} nome={marca.nome ?? ""} />
      )}

      <button
        type="button"
        className={feito ? botaoSec : botao}
        onClick={() => {
          const novo = !feito;
          setFeito(novo);
          startTransition(() => void marcarPublicado(id, novo));
        }}
      >
        {feito ? "Publicado ✓ (tocar para desfazer)" : "Já publiquei este post"}
      </button>
    </div>
  );
}
