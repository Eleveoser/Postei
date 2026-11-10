import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import { EMPRESA } from "@/lib/empresa";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export function Documento({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className={`${bricolage.className} min-h-screen bg-[#F6F3EA] text-[#0E1330]`}>
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight">Postei</Link>
        <nav aria-label="Documentos" className="flex gap-4 text-sm font-semibold text-[#4A4F6B]">
          <Link href="/termos" className="underline">Termos</Link>
          <Link href="/privacidade" className="underline">Privacidade</Link>
        </nav>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">{titulo}</h1>
          <p className="text-sm font-medium text-[#4A4F6B]">
            Versão {EMPRESA.versao} · atualizada em {EMPRESA.atualizadoEm}
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-extrabold leading-tight tracking-tight">{titulo}</h2>
      <div className="flex flex-col gap-2 text-[15px] font-medium leading-relaxed text-[#2D3150]">{children}</div>
    </section>
  );
}

export function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {itens.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
