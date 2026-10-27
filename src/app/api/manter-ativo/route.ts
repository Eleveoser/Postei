import { NextResponse, type NextRequest } from "next/server";

// Mantém o projeto do Supabase ativo: o plano gratuito pausa depois de 7 dias sem uso.
// A Vercel chama este endereço uma vez por dia (ver vercel.json). Faz uma leitura leve na API do banco.
// Se a variável CRON_SECRET existir, só aceita a chamada que traz esse segredo (a Vercel envia sozinha).
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return NextResponse.json({ ok: false, erro: "sem configuração" }, { status: 500 });

  try {
    // leitura de uma linha da biblioteca (a tabela é de leitura pública para quem está logado; sem login
    // a resposta vem vazia, mas a chamada já conta como atividade do projeto)
    const r = await fetch(`${url}/rest/v1/biblioteca_convites?select=id&limit=1`, {
      headers: { apikey: chave, Authorization: `Bearer ${chave}` },
      cache: "no-store",
    });
    return NextResponse.json({ ok: r.ok || r.status === 401 || r.status === 404, status: r.status, em: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
