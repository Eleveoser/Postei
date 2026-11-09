"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fontsReady, H, render, W, type Brand } from "@/lib/art-engine";
import { registrarPostProprio } from "../actions";

type Props = {
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  fundoUrl: string | null;
  servicos: string[];
};

type Formato = "fotoInteira" | "fotoPremium" | "antesDepois" | "meuPost";

const FORMATOS: { id: Formato; nome: string; desc: string }[] = [
  { id: "fotoInteira", nome: "Foto inteira", desc: "A sua foto ocupa o post e o título vai embaixo" },
  { id: "fotoPremium", nome: "Foto com moldura", desc: "Foto grande com moldura discreta" },
  { id: "antesDepois", nome: "Antes e depois", desc: "Duas fotos lado a lado" },
  { id: "meuPost", nome: "Só texto", desc: "Título e texto, com foto no alto se quiser" },
];

const botao =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C] disabled:text-white";
const botaoSec =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] border-2 border-[#0E1330] bg-white px-6 text-base font-extrabold text-[#0E1330] active:scale-[0.99] disabled:border-[#B9B29C] disabled:text-[#B9B29C]";
const campo =
  "min-h-12 w-full rounded-[14px] border border-[#B9B29C] bg-white px-3.5 text-[15px] font-semibold text-[#0E1330] focus:border-2 focus:border-[#0E1330] focus:outline-none";

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

export default function CriarView({ marca, logoUrl, fundoUrl, servicos }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [assunto, setAssunto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [formato, setFormato] = useState<Formato>("fotoInteira");
  const [tag, setTag] = useState("");
  const [texto, setTexto] = useState("");
  const [legenda, setLegenda] = useState("");
  const [img1, setImg1] = useState<HTMLImageElement | null>(null);
  const [img2, setImg2] = useState<HTMLImageElement | null>(null);
  const [cabe, setCabe] = useState(true);
  const [aviso, setAviso] = useState("");
  const [feito, setFeito] = useState(false);
  const [, startTransition] = useTransition();

  const ehTexto = formato === "meuPost";
  const duasFotos = formato === "antesDepois";
  const fotosProntas = ehTexto || (duasFotos ? !!img1 && !!img2 : !!img1);
  const pronto = titulo.trim().length > 0 && fotosProntas && (!ehTexto || cabe);

  // desenha a arte no próprio aparelho sempre que algo muda
  useEffect(() => {
    let vivo = true;
    Promise.all([fontsReady, carregar(logoUrl), carregar(fundoUrl)]).then(([, logo, fundo]) => {
      if (!vivo || !canvas.current) return;
      const dados: Record<string, unknown> = { titulo: titulo.trim() || "O seu título aparece aqui", tag, texto, img1, img2 };
      render(canvas.current, formato, { ...marca, logo, fundo }, dados);
      setCabe(dados.cabe !== false);
    });
    return () => {
      vivo = false;
    };
  }, [formato, titulo, tag, texto, img1, img2, marca, logoUrl, fundoUrl]);

  const mostrar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(""), 2600);
  };

  const escolherAssunto = (s: string) => {
    // o título acompanha o assunto enquanto ela não escreveu o dela
    setTitulo((t) => (t.trim() === "" || t === assunto ? s : t));
    setAssunto(s);
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

  const baixar = () => {
    canvas.current?.toBlob(async (b) => {
      if (!b) return;
      const arquivo = new File([b], "meu-post.png", { type: "image/png" });
      startTransition(() => void registrarPostProprio("baixou_arte", formato));
      try {
        if (navigator.canShare?.({ files: [arquivo] })) {
          await navigator.share({ files: [arquivo] });
          mostrar("Arte pronta. Escolha o Instagram ou salve na galeria.");
          return;
        }
      } catch {
        // cancelou ou não suportado: segue para o download simples
      }
      const url = URL.createObjectURL(arquivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.name;
      a.click();
      URL.revokeObjectURL(url);
      mostrar("Arte salva no seu aparelho.");
    }, "image/png");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
      mostrar("Legenda copiada. Agora é só colar no Instagram.");
    } catch {
      mostrar("Não consegui copiar sozinho: toque e segure no texto para copiar.");
    }
    startTransition(() => void registrarPostProprio("copiou_legenda", formato));
  };

  const jaPostei = () => {
    setFeito(true);
    startTransition(() => void registrarPostProprio("post_publicado", formato));
    mostrar("Anotado. Bom post!");
  };

  const seletorFoto = (qual: 1 | 2, rotulo: string, img: HTMLImageElement | null) => (
    <label className={`${img ? botaoSec : botao} cursor-pointer`}>
      {img ? `Trocar ${rotulo.toLowerCase()}` : rotulo}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherFoto(qual, e.target.files?.[0])} />
    </label>
  );

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="c-assunto" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-assunto" className="text-lg font-extrabold">1. Sobre o quê?</h2>
        {servicos.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Seus serviços">
            {servicos.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => escolherAssunto(s)}
                aria-pressed={assunto === s}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                  assunto === s ? "bg-[#C8FF2E] shadow-[inset_0_0_0_2px_#0E1330]" : "bg-[#F6F3EA] shadow-[inset_0_0_0_1px_#B9B29C]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <label htmlFor="c-titulo" className="mt-1 text-sm font-medium text-[#4A4F6B]">
          Título do post (é o que aparece na arte)
        </label>
        <input id="c-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={90} className={campo} placeholder="Ex.: Lash lifting" />
      </section>

      <section aria-labelledby="c-formato" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-formato" className="text-lg font-extrabold">2. Como quer o post?</h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Formato do post">
          {FORMATOS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={formato === f.id}
              onClick={() => setFormato(f.id)}
              className={`flex min-h-[84px] flex-col items-start gap-1 rounded-[14px] p-3 text-left ${
                formato === f.id ? "bg-[#C8FF2E] shadow-[inset_0_0_0_2px_#0E1330]" : "bg-[#F6F3EA] shadow-[inset_0_0_0_1px_#B9B29C]"
              }`}
            >
              <span className="text-[15px] font-extrabold">{f.nome}</span>
              <span className="text-xs font-medium leading-snug text-[#4A4F6B]">{f.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="c-conteudo" className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
        <h2 id="c-conteudo" className="text-lg font-extrabold">3. {ehTexto ? "O seu texto" : duasFotos ? "As suas fotos" : "A sua foto"}</h2>
        {ehTexto ? (
          <>
            <label htmlFor="c-tag" className="text-sm font-medium text-[#4A4F6B]">Etiqueta (opcional)</label>
            <input id="c-tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={22} className={campo} placeholder="Ex.: AVISO, NOVIDADE, DICA" />
            <label htmlFor="c-texto" className="text-sm font-medium text-[#4A4F6B]">Texto da arte</label>
            <textarea id="c-texto" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={700} rows={6} className={`${campo} py-3`} placeholder="Escreva o texto do post. Use Enter para separar os parágrafos." />
            {!cabe && <p className="rounded-[12px] bg-[#FFE9C7] px-3 py-2 text-sm font-semibold text-[#5A3200]">O texto não coube na arte. Encurte um pouco: nada é cortado sozinho.</p>}
            {seletorFoto(1, "Adicionar uma foto (opcional)", img1)}
          </>
        ) : (
          <>
            {seletorFoto(1, duasFotos ? "Foto do antes" : "Escolher a foto", img1)}
            {duasFotos && seletorFoto(2, "Foto do depois", img2)}
            <p className="text-xs font-medium text-[#4A4F6B]">Toque e escolha: tirar a foto agora ou pegar da galeria. A foto não sai do seu celular.</p>
          </>
        )}
      </section>

      <section aria-labelledby="c-previa" className="flex flex-col gap-3">
        <h2 id="c-previa" className="text-lg font-extrabold">A sua arte</h2>
        <canvas
          ref={canvas}
          width={W}
          height={H}
          role="img"
          aria-label="Prévia da arte do seu post"
          className="h-auto w-full rounded-[18px] border border-[#D9D3C0] bg-white"
        />
        <button type="button" onClick={baixar} disabled={!pronto} className={botao}>
          Baixar a arte
        </button>
        {!pronto && (
          <p className="text-xs font-medium text-[#4A4F6B]">
            {titulo.trim() === "" ? "Escreva o título para liberar a arte." : !fotosProntas ? "Escolha a foto para liberar a arte." : "Encurte o texto para a arte caber."}
          </p>
        )}
      </section>

      <section aria-labelledby="c-legenda" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-legenda" className="text-lg font-extrabold">Legenda</h2>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          maxLength={2200}
          rows={7}
          aria-label="Legenda do post"
          className={`${campo} py-3`}
          placeholder="Escreva aqui a legenda do seu post. Pode deixar em branco e escrever direto no Instagram."
        />
        <button type="button" onClick={copiar} disabled={legenda.trim() === ""} className={botaoSec}>
          Copiar a legenda
        </button>
      </section>

      <button type="button" onClick={jaPostei} disabled={feito || !pronto} className={botaoSec}>
        {feito ? "Anotado como postado" : "Já postei"}
      </button>

      {aviso && (
        <div role="status" className="fixed inset-x-5 bottom-6 z-40 mx-auto max-w-md rounded-[16px] bg-[#0E1330] px-4 py-3 text-center text-sm font-bold text-[#C8FF2E]">
          {aviso}
        </div>
      )}
    </div>
  );
}
