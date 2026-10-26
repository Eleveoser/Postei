"use client";

import { useState, useTransition } from "react";
import { refazerProgramacao } from "./actions";

/** Refaz os posts ainda não publicados (útil quando a biblioteca cresce ou a marca muda). */
export default function Refazer() {
  const [confirmando, setConfirmando] = useState(false);
  const [msg, setMsg] = useState("");
  const [pendente, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-12 rounded-full px-5 text-[15px] font-extrabold underline"
      >
        Refazer a programação
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] border-2 border-[#0E1330] bg-white p-4">
      <p className="text-[15px] font-bold leading-snug">
        Os posts das próximas semanas que você ainda não publicou serão montados de novo, inclusive os que você mudou. Os publicados ficam como estão.
      </p>
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={pendente}
          onClick={() =>
            startTransition(async () => {
              const r = await refazerProgramacao();
              setMsg(r.ok ? "Programação refeita." : r.erro);
              setConfirmando(false);
            })
          }
          className="min-h-12 flex-1 rounded-full bg-[#0E1330] px-4 text-[15px] font-extrabold text-[#C8FF2E] disabled:bg-[#B9B29C]"
        >
          {pendente ? "Refazendo..." : "Sim, refazer"}
        </button>
        <button type="button" onClick={() => setConfirmando(false)} className="min-h-12 flex-1 rounded-full px-4 text-[15px] font-extrabold shadow-[inset_0_0_0_2px_#0E1330]">
          Cancelar
        </button>
      </div>
      {msg && <p role="status" className="text-[14px] font-bold">{msg}</p>}
    </div>
  );
}
