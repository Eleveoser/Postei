import { Bricolage_Grotesque } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import InstalarGate from "./instalar-gate";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: ehAdmin } = user ? await supabase.rpc("eh_admin") : { data: false };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <span className="font-semibold">Postei</span>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          {ehAdmin && (
            <a href="/app/gestao" className="font-semibold text-neutral-900 underline">
              Gestão
            </a>
          )}
          <span>{user?.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline hover:text-neutral-900">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className={`${bricolage.className} flex-1 bg-[#F6F3EA]`}>
        <InstalarGate>{children}</InstalarGate>
      </main>
    </div>
  );
}
