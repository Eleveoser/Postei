import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe o link do e-mail (confirmação de conta ou redefinição de senha),
// troca o código por uma sessão e leva a cliente para a tela certa.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }
  const volta = destino.startsWith("/redefinir-senha") ? "/esqueci-senha" : "/login";
  return NextResponse.redirect(
    `${origin}${volta}?erro=${encodeURIComponent("O link venceu ou já foi usado. Peça um novo.")}`,
  );
}
