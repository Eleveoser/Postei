"use client";

import Link from "next/link";
import { useState } from "react";
import type { Brand } from "@/lib/art-engine";
import MiniArte from "./mini-arte";
import { mudarPost } from "./actions";
import { TIPOS, diaDoMes, diaSemanaAbrev, rotuloDia, rotuloTipo } from "@/lib/calendario";

type Props = {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: string;
  tema: string;
  origem: "sugestao" | "cliente";
  editavel: boolean;
  publicado: boolean;
  servicos: string[];
  arte: { tpl: string; dados: Record<string, unknown> } | null;
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  semFoto?: boolean; // perfis privados: sem foto do trabalho
};

const campo =
  "min-h-12 w-full rounded-[14px] border border-[#B9B29C] bg-[#F6F3EA] px-3.5 text-[15px] font-bold text-[#0E1330] focus:border-2 focus:border-[#0E1330] focus:outline-none";

export default function PostCard({ id, data, tipo, tema, origem, editavel, publicado, servicos, arte, marca, logoUrl, semFoto }: Props) {
  const [aberto, setAberto] = useState(false);

  const base = semFoto ? TIPOS.filter((t) => t.valor !== "foto") : TIPOS;
  const tipos = base.some((t) => t.valor === tipo) ? base : [...base, { valor: tipo, rotulo: rotuloTipo(tipo) }];
  const temas = tema && !servicos.includes(tema) ? [tema, ...servicos] : servicos;

  const diaBox = (
    <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-[14px] bg-[#0E1330] text-[#F6F3EA]">
      <span className="text-xs font-bold tracking-[0.1em]">{diaSemanaAbrev(data)}</span>
      <span className="text-[22px] font-extrabold leading-none">{diaDoMes(data)}</span>
    </div>
  );

  if (aberto) {
    return (
      <form
        action={async (fd) => {
          await mudarPost(fd);
          setAberto(false);
        }}
        className="flex flex-col gap-1.5 rounded-[22px] border-2 border-[#0E1330] bg-white p-3.5 pb-4"
      >
        <input type="hidden" name="id" value={id} />
        <div className="mb-1.5 flex items-center gap-3">
          {diaBox}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg font-extrabold tracking-tight">{rotuloDia(data)}</span>
            <span className="text-[13px] font-medium text-[#4A4F6B]">Mudando este dia</span>
          </div>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="min-h-11 px-3.5 text-sm font-extrabold underline"
          >
            Fechar
          </button>
        </div>

        <label htmlFor={`tipo-${id}`} className="text-sm font-medium text-[#4A4F6B]">
          Como
        </label>
        <select id={`tipo-${id}`} name="tipo" defaultValue={tipo} className={campo}>
          {tipos.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>

        <label htmlFor={`tema-${id}`} className="mt-1.5 text-sm font-medium text-[#4A4F6B]">
          Sobre o quê
        </label>
        <select id={`tema-${id}`} name="tema" defaultValue={tema} className={campo}>
          {temas.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="mt-3 min-h-12 rounded-full bg-[#C8FF2E] text-[15px] font-extrabold text-[#0E1330] shadow-[inset_0_0_0_2px_#0E1330]"
        >
          Salvar
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[#D9D3C0] bg-white py-3 pl-3 pr-4">
      {diaBox}
      <MiniArte marca={marca} logoUrl={logoUrl} arte={arte} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-base font-extrabold tracking-tight">{rotuloTipo(tipo)}</span>
        {tema && <span className="text-[15px] font-medium text-[#2D3150]">{tema}</span>}
        <span
          className={`flex items-center gap-1.5 text-[13px] ${
            origem === "cliente" ? "font-bold text-[#0E1330]" : "font-medium text-[#4A4F6B]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              origem === "cliente" ? "bg-[#0E1330]" : "bg-[#C8FF2E] ring-1 ring-[#0E1330]"
            }`}
          />
          {publicado ? "Publicado" : origem === "cliente" ? "Você escolheu" : "Sugestão do Postei"}
        </span>
      </div>
      <div className="flex flex-none flex-col gap-1.5">
        <Link
          href={`/app/post/${id}`}
          className="flex min-h-11 items-center justify-center rounded-full bg-[#C8FF2E] px-[18px] text-sm font-extrabold text-[#0E1330] shadow-[inset_0_0_0_2px_#0E1330]"
        >
          Ver post
        </Link>
        {editavel && (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="min-h-11 rounded-full px-[18px] text-sm font-extrabold shadow-[inset_0_0_0_2px_#0E1330]"
          >
            Mudar
          </button>
        )}
      </div>
    </div>
  );
}
