"use client";

import { useState } from "react";

export const campo =
  "min-h-14 w-full rounded-[16px] border-2 border-[#B9B29C] bg-white px-4 text-base font-semibold text-[#0E1330] placeholder:font-medium placeholder:text-[#8A8FA8] focus:border-[#0E1330] focus:outline-none";
export const botao =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C]";
export const botaoSecundario =
  "flex min-h-12 w-full items-center justify-center rounded-[16px] border-2 border-[#0E1330] px-5 text-[15px] font-extrabold text-[#0E1330] active:scale-[0.99]";

export function Aviso({ tipo = "erro", children }: { tipo?: "erro" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-[14px] px-4 py-3 text-[15px] font-bold ${tipo === "erro" ? "bg-[#FFE3DD] text-[#8A1F0A]" : "bg-[#E6F6C8] text-[#2B4A00]"}`}
    >
      {children}
    </p>
  );
}

/** Campo de senha com "mostrar": a regra fica no próprio campo (placeholder), sem poluir a tela. */
export function CampoSenha({
  id = "password",
  name = "password",
  placeholder,
  autoComplete,
}: {
  id?: string;
  name?: string;
  placeholder: string;
  autoComplete: string;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={ver ? "text" : "password"}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${campo} pr-24`}
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        aria-pressed={ver}
        className="absolute inset-y-0 right-1 min-w-20 px-3 text-[15px] font-extrabold underline"
      >
        {ver ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
