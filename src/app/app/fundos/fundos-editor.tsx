"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { enviarImagem, reduzirImagem } from "../marca/ui";
import { salvarFundos, type Fundo } from "./actions";

const CATEGORIAS = ["Geral", "Palestra", "Mentoria 1:1", "Reunião", "Equipe e celebração"];
const MAX = 40;

const botao =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] active:scale-[0.99] disabled:bg-[#B9B29C]";

export default function FundosEditor({ userId, inicial }: { userId: string; inicial: Fundo[] }) {
  const [lista, setLista] = useState<Fundo[]>(inicial);
  const [enviando, setEnviando] = useState("");
  const [aviso, setAviso] = useState("");
  const [, startTransition] = useTransition();

  const guardar = (nova: Fundo[]) =>
    startTransition(async () => {
      const r = await salvarFundos(nova);
      setAviso(r.ok ? "Salvo." : "Não consegui salvar agora. Confira se o SQL 0010 foi rodado no Supabase.");
      window.setTimeout(() => setAviso(""), 2500);
    });

  const adicionar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    let atual = lista;
    const total = Math.min(arquivos.length, MAX - lista.length);
    for (let i = 0; i < total; i++) {
      setEnviando(`Enviando ${i + 1} de ${total}...`);
      try {
        const blob = await reduzirImagem(arquivos[i], 1350);
        const id = `f${Date.now().toString(36)}${i}`;
        const url = await enviarImagem(userId, `fundo-${id}`, blob);
        atual = [...atual, { id, url, categoria: "Geral" }];
        setLista(atual);
      } catch {
        setAviso(`Não consegui usar a imagem ${i + 1}. Tente outra.`);
      }
    }
    setEnviando("");
    guardar(atual);
  };

  const remover = async (f: Fundo) => {
    const nova = lista.filter((x) => x.id !== f.id);
    setLista(nova);
    try {
      await createClient().storage.from("logos").remove([`${userId}/fundo-${f.id}.webp`]);
    } catch {
      // arquivo órfão pequeno: não impede a remoção da lista
    }
    guardar(nova);
  };

  const mudarCategoria = (f: Fundo, categoria: string) => {
    const nova = lista.map((x) => (x.id === f.id ? { ...x, categoria } : x));
    setLista(nova);
    guardar(nova);
  };

  return (
    <div className="flex flex-col gap-4">
      <label className={`${botao} cursor-pointer`}>
        {enviando || (lista.length ? "Adicionar mais imagens" : "Escolher as imagens")}
        <input type="file" accept="image/*" multiple className="sr-only" disabled={!!enviando || lista.length >= MAX} onChange={(e) => void adicionar(e.target.files)} />
      </label>
      <p className="text-[14px] font-medium leading-snug text-[#4A4F6B]">
        Você pode escolher várias de uma vez (até {MAX}). As imagens são reduzidas no seu celular antes de enviar. Use imagens suas ou de banco de imagens que permita uso comercial.
      </p>
      {aviso && <p role="status" className="rounded-[14px] bg-[#E6F6C8] px-4 py-3 text-[15px] font-bold text-[#2B4A00]">{aviso}</p>}

      {lista.length > 0 && (
        <>
          <p className="text-[15px] font-extrabold">{lista.length} {lista.length === 1 ? "imagem" : "imagens"}</p>
          <div className="grid grid-cols-2 gap-3">
            {lista.map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5 rounded-[16px] bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="Imagem de fundo" className="aspect-[4/5] w-full rounded-[10px] object-cover" />
                <label className="sr-only" htmlFor={`cat-${f.id}`}>Categoria</label>
                <select id={`cat-${f.id}`} value={f.categoria} onChange={(e) => mudarCategoria(f, e.target.value)} className="min-h-11 rounded-[12px] border-2 border-[#B9B29C] bg-white px-2 text-[14px] font-semibold">
                  {CATEGORIAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button type="button" onClick={() => void remover(f)} className="min-h-11 text-[14px] font-extrabold underline">
                  Remover
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
