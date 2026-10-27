import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  agruparPorSemana,
  descreverDias,
  diaDoMes,
  hojeSaoPaulo,
  inicioSemana,
  listarServicos,
  mesNome,
  rotuloPeriodo,
  rotuloSemana,
  type PostCalendario,
} from "@/lib/calendario";
import PostCard from "./post-card";
import Refazer from "./refazer";
import { marcaParaArte, type MarcaBanco } from "@/lib/marca-arte";
import { gerarCalendarioSeFaltar } from "@/lib/gerar-calendario";

const PLANOS: Record<string, string> = {
  trial: "Teste",
  essencial: "Essencial",
  constante: "Constante",
  presenca: "Presença",
};

export default async function AppHome({ searchParams }: PageProps<"/app">) {
  const { semana: semanaParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nome_negocio, plano")
    .eq("id", user!.id)
    .single();

  const { data: marca } = await supabase
    .from("marcas")
    .select("servicos, concluida_em, nome_exibicao, tipo_negocio, paleta, fonte, conjunto_visual, fundo, texto_cores, logo_url, fundo_url")
    .eq("cliente_id", user!.id)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Primeiro acesso: monta a marca antes de ver o calendário.
  if (!marca?.concluida_em) redirect("/app/marca");

  // Programação do mês: se ainda não existe, monta agora (planejador + biblioteca, sem custo de IA).
  const geracao = await gerarCalendarioSeFaltar(supabase, user!.id);

  const { data: calendario } = await supabase
    .from("calendarios")
    .select("id")
    .eq("cliente_id", user!.id)
    .order("mes_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: postsDb } = calendario
    ? await supabase
        .from("posts")
        .select("id, data_publicacao, tipo, status, conteudo")
        .eq("calendario_id", calendario.id)
        .order("data_publicacao")
    : { data: [] };

  const posts = (postsDb ?? []) as PostCalendario[];
  const semanas = agruparPorSemana(posts);
  const servicos = listarServicos(marca?.servicos);

  if (semanas.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-6 pt-7 text-[#0E1330]">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">
          Programação do mês
        </h1>
        <div className="rounded-[22px] border border-dashed border-[#B9B29C] p-6 text-[15px] font-medium text-[#4A4F6B]">
          {geracao.ok ? "Sua programação do mês aparece aqui assim que estiver pronta." : geracao.erro}
        </div>
      </div>
    );
  }

  const hoje = hojeSaoPaulo();
  const padrao =
    semanas.find((s) => s.chave === inicioSemana(hoje))?.chave ??
    semanas.find((s) => s.fim >= hoje)?.chave ??
    semanas[0].chave;
  const atual = semanas.find((s) => s.chave === semanaParam) ?? semanas.find((s) => s.chave === padrao)!;

  const periodoInicio = semanas[0].inicio;
  const periodoFim = semanas[semanas.length - 1].fim;
  const porSemana = Math.max(...semanas.map((s) => s.posts.length));

  const tituloSemana =
    mesNome(atual.inicio) === mesNome(atual.fim)
      ? `${diaDoMes(atual.inicio)} a ${diaDoMes(atual.fim)} de ${mesNome(atual.fim)}`
      : `${diaDoMes(atual.inicio)} de ${mesNome(atual.inicio)} a ${diaDoMes(atual.fim)} de ${mesNome(atual.fim)}`;

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-7 text-[#0E1330]">
      <div className="flex flex-col gap-1.5">
        <div className="text-[13px] font-bold tracking-[0.14em] text-[#4A4F6B]">
          {rotuloPeriodo(periodoInicio, periodoFim)}
        </div>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">
          Programação do mês
        </h1>
        <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
          Plano {PLANOS[cliente?.plano ?? ""] ?? cliente?.plano} · {porSemana} posts por
          semana, sempre às {descreverDias(posts)}.
        </p>
      </div>

      <Link
        href="/app/kit"
        className="flex items-center gap-3 rounded-[20px] border-2 border-[#0E1330] bg-[#C8FF2E] px-4 py-3"
      >
        <span className="flex flex-1 flex-col">
          <span className="text-base font-extrabold">O kit do seu perfil</span>
          <span className="text-[14px] font-medium">3 posts para fixar no topo, mais serviços, equipe, horários e história.</span>
        </span>
        <span aria-hidden="true" className="text-xl font-extrabold">→</span>
      </Link>

      <nav aria-label="Semanas" className="flex gap-2 overflow-x-auto pb-0.5">
        {semanas.map((s) => {
          const ativa = s.chave === atual.chave;
          return (
            <Link
              key={s.chave}
              href={`/app?semana=${s.chave}`}
              aria-current={ativa ? "page" : undefined}
              className={`flex min-h-11 flex-none items-center rounded-full px-4 text-sm ${
                ativa
                  ? "bg-[#C8FF2E] font-extrabold shadow-[inset_0_0_0_2px_#0E1330]"
                  : "bg-white font-medium shadow-[inset_0_0_0_1px_#B9B29C]"
              }`}
            >
              {rotuloSemana(s.inicio, s.fim)}
            </Link>
          );
        })}
      </nav>

      <h2 className="text-lg font-extrabold leading-tight tracking-tight">
        Procedimentos para a semana de {tituloSemana}
      </h2>

      <div className="flex flex-col gap-3">
        {atual.posts.map((p) => (
          <PostCard
            key={p.id}
            id={p.id}
            data={p.data_publicacao}
            tipo={p.tipo}
            tema={p.conteudo?.tema ?? ""}
            publicado={p.status === "publicado"}
            arte={(p.conteudo as { arte?: { tpl: string; dados: Record<string, unknown> } } | null)?.arte ?? null}
            marca={marcaParaArte(marca as unknown as MarcaBanco)}
            logoUrl={marca?.logo_url ?? null}
            origem={p.conteudo?.escolhaCliente ? "cliente" : "sugestao"}
            editavel={p.status !== "publicado"}
            servicos={servicos}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <p className="text-[15px] font-bold leading-snug">
          O Postei já deixou tudo pronto. Se você não mexer, a gente segue esta programação.
        </p>
        <p className="text-sm font-medium leading-snug text-[#4A4F6B]">
          Sem promoção cadastrada, o post de oferta sai como convite para agendar.
        </p>
        <Refazer />
      </div>
    </div>
  );
}
