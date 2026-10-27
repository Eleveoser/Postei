"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fontsReady, render, type Brand } from "@/lib/art-engine";
import { enviarImagem, reduzirImagem } from "../marca/ui";
import type { CampoEquipe, Profissional } from "./actions";

type Props = {
  userId: string;
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  nomeNegocio: string;
  servicosNegocio: string[];
  profissionais: Profissional[];
  onChange: (l: Profissional[]) => void;
};

const CAMPOS: { id: CampoEquipe; rotulo: string }[] = [
  { id: "nome", rotulo: "Nome" },
  { id: "funcao", rotulo: "Especialidade" },
  { id: "servicos", rotulo: "Serviços que faz" },
  { id: "anos", rotulo: "Tempo de experiência" },
  { id: "clientes", rotulo: "Clientes atendidas" },
  { id: "formacao", rotulo: "Formação ou cursos" },
  { id: "detalhe", rotulo: "Um detalhe" },
];

const campo =
  "min-h-12 w-full rounded-[14px] border-2 border-[#B9B29C] bg-white px-3.5 text-[15px] font-semibold focus:border-[#0E1330] focus:outline-none";
const botao =
  "flex min-h-12 w-full items-center justify-center rounded-[16px] bg-[#0E1330] px-4 text-[15px] font-extrabold text-[#C8FF2E] active:scale-[0.99] disabled:bg-[#B9B29C]";
const botaoSec =
  "flex min-h-12 w-full items-center justify-center rounded-[16px] border-2 border-[#0E1330] bg-white px-4 text-[15px] font-extrabold text-[#0E1330] active:scale-[0.99]";

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

/** Fatos do post: só o que a cliente marcou e preencheu. */
export function fatosDe(p: Profissional): string[] {
  const f: string[] = [];
  if (p.campos.includes("anos") && p.anos) f.push(`${p.anos} ${p.anos === "1" ? "ano" : "anos"} de experiência`);
  if (p.campos.includes("clientes") && p.clientes) f.push(`Mais de ${p.clientes} clientes atendidas com a técnica`);
  if (p.campos.includes("formacao") && p.formacao) f.push(p.formacao);
  if (p.campos.includes("detalhe") && p.detalhe) f.push(p.detalhe);
  return f;
}

function dadosDe(p: Profissional, img: HTMLImageElement | null) {
  return {
    img1: img,
    nome: p.campos.includes("nome") ? p.nome : "",
    funcao: p.campos.includes("funcao") ? p.funcao : "",
    servicos: p.campos.includes("servicos") ? p.servicos : [],
    fatos: fatosDe(p),
  };
}

export function Slide({ marca, logoUrl, tpl, dados, rotulo, nomeArquivo }: { marca: Props["marca"]; logoUrl: string | null; tpl: string; dados: Record<string, unknown>; rotulo: string; nomeArquivo: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(() => {
      Promise.all([fontsReady, carregar(logoUrl)]).then(([, logo]) => {
        if (vivo && ref.current) render(ref.current, tpl, { ...marca, logo, fundo: null }, dados);
      });
    }, 150);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [marca, logoUrl, tpl, dados]);
  const baixar = () =>
    ref.current?.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeArquivo}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#4A4F6B]">{rotulo}</p>
      <canvas ref={ref} width={1080} height={1350} role="img" aria-label={rotulo} data-slide={nomeArquivo} className="aspect-[4/5] w-full rounded-[14px] border border-[#D9D3C0] bg-white" />
      <button type="button" className={botaoSec} onClick={baixar}>Salvar este post</button>
    </div>
  );
}

export default function EquipeEditor({ userId, marca, logoUrl, nomeNegocio, servicosNegocio, profissionais, onChange }: Props) {
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement | null>>({});
  const [enviando, setEnviando] = useState("");
  const [aviso, setAviso] = useState("");

  // carrega as fotos já salvas
  useEffect(() => {
    let vivo = true;
    profissionais.forEach((p) => {
      if (p.foto_url && fotos[p.id] === undefined) {
        carregar(p.foto_url).then((img) => vivo && setFotos((f) => ({ ...f, [p.id]: img })));
      }
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionais.length]);

  const atualiza = (id: string, parte: Partial<Profissional>) => onChange(profissionais.map((p) => (p.id === id ? { ...p, ...parte } : p)));
  const alternaCampo = (p: Profissional, c: CampoEquipe) =>
    atualiza(p.id, { campos: p.campos.includes(c) ? p.campos.filter((x) => x !== c) : [...p.campos, c] });
  const alternaServico = (p: Profissional, s: string) =>
    atualiza(p.id, { servicos: p.servicos.includes(s) ? p.servicos.filter((x) => x !== s) : [...p.servicos, s].slice(0, 6) });

  const adicionar = () =>
    onChange([
      ...profissionais,
      { id: `p${Date.now().toString(36)}`, campos: ["nome", "funcao", "servicos"], nome: "", funcao: "", servicos: [], anos: "", clientes: "", formacao: "", detalhe: "", foto_url: null },
    ]);

  const escolherFoto = async (p: Profissional, file: File | undefined) => {
    if (!file) return;
    setEnviando(p.id);
    setAviso("");
    try {
      const blob = await reduzirImagem(file, 900);
      const img = await new Promise<HTMLImageElement>((ok, erro) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = erro;
        i.src = URL.createObjectURL(blob);
      });
      setFotos((f) => ({ ...f, [p.id]: img }));
      const url = await enviarImagem(userId, `equipe-${p.id}`, blob);
      atualiza(p.id, { foto_url: url });
    } catch {
      setAviso("Não consegui usar essa foto. Tente outra.");
    }
    setEnviando("");
  };

  const nomes = useMemo(() => profissionais.map((p) => (p.nome || p.funcao).trim()).filter(Boolean), [profissionais]);
  const capa = useMemo(() => ({ titulo: "Quem cuida de você", nomes }), [nomes]);

  const legenda = `Conheça quem cuida de você na ${nomeNegocio || "nossa casa"}.\n\n${profissionais
    .map((p) => `• ${[p.campos.includes("nome") ? p.nome : "", p.campos.includes("funcao") ? p.funcao : ""].filter(Boolean).join(", ") || "Nossa equipe"}`)
    .join("\n")}\n\nDeslize para conhecer cada um. Venha nos visitar.`;

  const baixarTodos = async () => {
    const telas = Array.from(document.querySelectorAll<HTMLCanvasElement>("canvas[data-slide]"));
    for (const c of telas) {
      await new Promise<void>((ok) =>
        c.toBlob((b) => {
          if (b) {
            const url = URL.createObjectURL(b);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${c.dataset.slide}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
          window.setTimeout(ok, 350);
        }, "image/png"),
      );
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
      setAviso("Legenda copiada.");
    } catch {
      setAviso("Toque e segure no texto para copiar.");
    }
    window.setTimeout(() => setAviso(""), 2200);
  };

  return (
    <div className="flex flex-col gap-4">
      {profissionais.map((p, idx) => (
        <div key={p.id} className="flex flex-col gap-3 rounded-[18px] border-2 border-[#D9D3C0] bg-[#FBF9F4] p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold">Profissional {idx + 1}</h3>
            <button type="button" onClick={() => onChange(profissionais.filter((x) => x.id !== p.id))} className="min-h-11 px-2 text-[15px] font-extrabold underline">
              Remover
            </button>
          </div>

          <label className={`${fotos[p.id] ? botaoSec : botao} cursor-pointer`}>
            {enviando === p.id ? "Enviando..." : fotos[p.id] ? "Trocar a foto" : "Escolher a foto"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherFoto(p, e.target.files?.[0])} />
          </label>

          <div>
            <p className="mb-1.5 text-[14px] font-extrabold">O que mostrar no post? Marque e preencha.</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Informações do post">
              {CAMPOS.map((c) => {
                const sel = p.campos.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={sel} onClick={() => alternaCampo(p, c.id)} className={`min-h-11 rounded-full border-2 px-3.5 text-[14px] font-bold ${sel ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-white"}`}>
                    {sel ? "✓ " : ""}{c.rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          {p.campos.includes("nome") && <input aria-label="Nome" className={campo} maxLength={40} placeholder="Nome" value={p.nome} onChange={(e) => atualiza(p.id, { nome: e.target.value })} />}
          {p.campos.includes("funcao") && <input aria-label="Especialidade" className={campo} maxLength={40} placeholder="Especialidade. Ex.: Colorista" value={p.funcao} onChange={(e) => atualiza(p.id, { funcao: e.target.value })} />}
          {p.campos.includes("servicos") && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Serviços que faz">
              {servicosNegocio.map((s) => (
                <button key={s} type="button" aria-pressed={p.servicos.includes(s)} onClick={() => alternaServico(p, s)} className={`min-h-11 rounded-full border-2 px-3.5 text-[14px] font-bold ${p.servicos.includes(s) ? "border-[#0E1330] bg-[#C8FF2E]" : "border-[#B9B29C] bg-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {p.campos.includes("anos") && <input aria-label="Anos de experiência" className={campo} inputMode="numeric" maxLength={5} placeholder="Anos de experiência. Ex.: 8" value={p.anos} onChange={(e) => atualiza(p.id, { anos: e.target.value.replace(/\D/g, "") })} />}
          {p.campos.includes("clientes") && <input aria-label="Clientes atendidas" className={campo} inputMode="numeric" maxLength={5} placeholder="Clientes atendidas com a técnica. Ex.: 500" value={p.clientes} onChange={(e) => atualiza(p.id, { clientes: e.target.value.replace(/\D/g, "") })} />}
          {p.campos.includes("formacao") && <input aria-label="Formação ou cursos" className={campo} maxLength={90} placeholder="Formação ou cursos" value={p.formacao} onChange={(e) => atualiza(p.id, { formacao: e.target.value })} />}
          {p.campos.includes("detalhe") && <input aria-label="Um detalhe" className={campo} maxLength={110} placeholder="Um detalhe sobre você ou o seu trabalho" value={p.detalhe} onChange={(e) => atualiza(p.id, { detalhe: e.target.value })} />}
        </div>
      ))}

      <button type="button" onClick={adicionar} disabled={profissionais.length >= 8} className={botaoSec}>
        {profissionais.length ? "Adicionar outro profissional" : "Adicionar o primeiro profissional"}
      </button>
      <p className="text-[13px] font-medium leading-snug text-[#4A4F6B]">
        Avise cada profissional antes de postar a foto e os dados dela.
      </p>
      {aviso && <p role="status" className="rounded-[14px] bg-[#E6F6C8] px-4 py-3 text-[15px] font-bold text-[#2B4A00]">{aviso}</p>}

      {profissionais.length > 0 && (
        <>
          <h3 className="text-lg font-extrabold">O carrossel (deslize na ordem)</h3>
          <Slide marca={marca} logoUrl={logoUrl} tpl="equipeCapa" dados={capa} rotulo="Capa" nomeArquivo="equipe-0-capa" />
          {profissionais.map((p, i) => (
            <Slide key={p.id} marca={marca} logoUrl={logoUrl} tpl="equipeProfissional" dados={dadosDe(p, fotos[p.id] ?? null)} rotulo={`Post ${i + 1}: ${p.nome || p.funcao || "profissional"}`} nomeArquivo={`equipe-${i + 1}`} />
          ))}
          <button type="button" className={botao} onClick={() => void baixarTodos()}>Salvar todos os posts do carrossel</button>
          <p className="text-[13px] font-medium leading-snug text-[#4A4F6B]">
            Se o seu celular salvar só o primeiro, use o botão &ldquo;Salvar este post&rdquo; de cada um. No Instagram, toque em + e escolha as imagens na ordem para montar o carrossel.
          </p>
          <button type="button" className={botao} onClick={() => void copiar()}>Copiar a legenda</button>
          <p className="whitespace-pre-line text-[14px] font-medium leading-snug text-[#4A4F6B]">{legenda}</p>
        </>
      )}
    </div>
  );
}
