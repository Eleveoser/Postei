import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bricolage.className} flex min-h-screen flex-1 flex-col bg-[#F6F3EA] text-[#0E1330]`}>
      <header className="px-5 pt-6">
        <span className="text-xl font-extrabold tracking-tight">Postei</span>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">{children}</main>
    </div>
  );
}
