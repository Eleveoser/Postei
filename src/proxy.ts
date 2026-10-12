import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Equivalente ao antigo middleware.ts nesta versão do Next.js (16+):
// o arquivo de convenção agora é proxy.ts com a função proxy().
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
