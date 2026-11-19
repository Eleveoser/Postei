import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addDias,
  agruparPorSemana,
  descreverDias,
  diaDoMes,
  fimSemana,
  hojeSaoPaulo,
  inicioSemana,
  listarServicos,
  mesNome,
  rotuloPeriodo,
  resumirPeriodos,
  rotuloSemana,
  type PostCalendario,
  type PostResumo,
} from "@/lib/calendario";
import { assinaturaAtiva } from "@/lib/assinatura";
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
  const { semana: semanaParam, cores: coresParam, periodo: periodoParam } = await searchParams;

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

  // Programação por períodos, em semanas cheias (seg a dom). Se faltar, monta agora (planejador + biblioteca, sem custo de IA).
  const geracao = await gerarCalendarioSeFaltar(supabase, user!.id);

  if (!(await assinaturaAtiva(supabase, user!.id))) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-6 pt-7 text-[#0E1330]">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">Programação do mês</h1>
        <div className="rounded-[22px] border border-dashed border-[#B9B29C] p-6 text-[15px] font-medium text-[#4A4F6B]">
          Sua assinatura precisa ser renovada para liberar os posts deste período.
        </div>
      </div>
    );
  }

  const hoje = hojeSaoPaulo();
  const semanaHoje = inicioSemana(hoje);

  // da semana atual em diante: posts completos (para ver e usar)
  const { data: postsDb } = await supabase
    .from("posts")
    .select("id, data_publicacao, tipo, status, conteudo, calendario_id")
    .eq("cliente_id", user!.id)
    .gte("data_publicacao", semanaHoje)
    .order("data_publicacao");
  // semanas que já passaram: só o essencial para o resumo (não abrem mais)
  const { data: passadosDb } = await supabase
    .from("posts")
    .select("id, data_publicacao, status, calendario_id, tema:conteudo->>tema")
    .eq("cliente_id", user!.id)
    .lt("data_publicacao", semanaHoje);

  const posts = (postsDb ?? []) as PostCalendario[];
  const passados = (passadosDb ?? []) as unknown as PostResumo[];

  const grupos = new Map<string, PostCalendario[]>();
  for (const p of posts) grupos.set(p.calendario_id ?? "", [...(grupos.get(p.calendario_id ?? "") ?? []), p]);
  const periodos = [...grupos.entries()]
    .map(([id, ps]) => ({ id, posts: ps, inicio: inicioSemana(ps[0].data_publicacao), fim: fimSemana(ps[ps.length - 1].data_publicacao) }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const ativo = periodos.find((p) => p.inicio <= hoje && hoje <= p.fim) ?? periodos[0];
  const proximo = ativo ? periodos.find((p) => p.id !== ativo.id && p.inicio > ativo.fim) : undefined;
  const verProximo = periodoParam === "proximo" && !!proximo;
  const exibido = verProximo ? proximo! : ativo;
  const servicos = listarServicos(marca?.servicos);
  const privado = (marca?.tipo_negocio ?? "").startsWith("priv-");
  const { data: ehAdmin } = await supabase.rpc("eh_admin"); // só administradoras veem o atalho do painel

  if (!exibido) {
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

  const semanas = agruparPorSemana(exibido.posts);
  const padrao =
    semanas.find((s) => s.chave === semanaHoje)?.chave ??
    semanas.find((s) => s.fim >= hoje)?.chave ??
    semanas[0].chave;
  const atual = semanas.find((s) => s.chave === semanaParam) ?? semanas.find((s) => s.chave === padrao)!;

  // semanas já passadas deste período: ficam na tela, desabilitadas
  const passadosDoPeriodo = verProximo ? [] : passados.filter((p) => p.calendario_id === exibido.id);
  const semanasPassadas = [...new Set(passadosDoPeriodo.map((p) => inicioSemana(p.data_publicacao)))].sort();
  const geradosPeriodo = exibido.posts.length + passadosDoPeriodo.length;
  const postadosPeriodo =
    exibido.posts.filter((p) => p.status === "publicado").length + passadosDoPeriodo.filter((p) => p.status === "publicado").length;
  const anteriores = resumirPeriodos(passados.filter((p) => p.calendario_id !== ativo?.id)).reverse();

  const periodoInicio = exibido.inicio;
  const periodoFim = exibido.fim;
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
          semana, sempre às {descreverDias(exibido.posts)}.
        </p>
        {!verProximo && (
          <p className="text-[14px] font-bold text-[#4A4F6B]">
            Neste período: {geradosPeriodo} {geradosPeriodo === 1 ? "post gerado" : "posts gerados"} · {postadosPeriodo} {postadosPeriodo === 1 ? "postado" : "postados"}
          </p>
        )}
      </div>

      {verProximo && (
        <div role="status" className="flex flex-col gap-1.5 rounded-[20px] border-2 border-[#0E1330] bg-white px-4 py-3">
          <span className="text-base font-extrabold">Você está vendo o próximo período</span>
          <span className="text-[14px] font-medium leading-snug text-[#4A4F6B]">
            Ele começa em {diaDoMes(exibido.inicio)} de {mesNome(exibido.inicio)}. O período atual continua valendo até lá.
          </span>
          <Link href="/app" className="min-h-11 text-[15px] font-extrabold underline">Voltar ao período atual</Link>
        </div>
      )}

      {!verProximo && proximo && (
        <Link href="/app?periodo=proximo" className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-[#0E1330] bg-white px-4 py-3">
          <span className="flex flex-1 flex-col">
            <span className="text-base font-extrabold">Próximo período já está pronto</span>
            <span className="text-[14px] font-medium text-[#4A4F6B]">{rotuloPeriodo(proximo.inicio, proximo.fim)}. Dá para olhar o que vem aí.</span>
          </span>
          <span aria-hidden="true" className="text-xl font-extrabold">→</span>
        </Link>
      )}

      {!privado && (
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
      )}

      <Link href="/app/fundos" className="flex items-center gap-3 rounded-[20px] border-2 border-[#0E1330] bg-white px-4 py-3">
        <span className="flex flex-1 flex-col">
          <span className="text-base font-extrabold">Imagens de fundo</span>
          <span className="text-[14px] font-medium text-[#4A4F6B]">Suas fotos ou artes como fundo dos posts de dica e de mito.</span>
        </span>
        <span aria-hidden="true" className="text-xl font-extrabold">→</span>
      </Link>

      {coresParam === "1" && (
        <div role="status" className="flex flex-col gap-1 rounded-[20px] border-2 border-[#0E1330] bg-[#C8FF2E] px-4 py-3">
          <span className="text-base font-extrabold">Cores atualizadas</span>
          <span className="text-[14px] font-medium leading-snug">
            Os posts que você ainda não publicou passam a aparecer com as novas cores, e os já publicados ficam como estão. Se algum continuar com a cor antiga, use &ldquo;Refazer a programação&rdquo; no fim desta página.
          </span>
        </div>
      )}

      {ehAdmin && (
        <Link href="/app/gestao" className="flex items-center gap-3 rounded-[20px] border-2 border-[#0E1330] bg-[#0E1330] px-4 py-3 text-[#F6F3EA]">
          <span className="flex flex-1 flex-col">
            <span className="text-base font-extrabold">Painel de gestão</span>
            <span className="text-[14px] font-medium">Contas, uso, retenção e custos do Postei. Só para você.</span>
          </span>
          <span aria-hidden="true" className="text-xl font-extrabold">→</span>
        </Link>
      )}

      <nav aria-label="Semanas" className="flex gap-2 overflow-x-auto pb-0.5">
        {semanasPassadas.map((chave) => (
          <span
            key={chave}
            aria-disabled="true"
            title="Semana encerrada"
            className="flex min-h-11 flex-none items-center rounded-full bg-[#ECE8DA] px-4 text-sm font-medium text-[#8A8672] line-through shadow-[inset_0_0_0_1px_#D9D3C0]"
          >
            {rotuloSemana(chave, addDias(chave, 6))}
          </span>
        ))}
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
            semFoto={privado}
          />
        ))}
      </div>

      <Link
        href="/app/criar"
        className="flex flex-col gap-0.5 rounded-[22px] border-2 border-dashed border-[#0E1330] bg-white px-4 py-3 active:scale-[0.99]"
      >
        <span className="text-base font-extrabold">Faça o post do seu jeito</span>
        <span className="text-sm font-medium leading-snug text-[#4A4F6B]">
          Escolha o assunto e a foto, escreva a legenda e a arte sai pronta com a sua marca.
        </span>
      </Link>

      {anteriores.length > 0 && (
        <section aria-label="Períodos anteriores" className="flex flex-col gap-2.5">
          <h2 className="text-lg font-extrabold leading-tight tracking-tight">Períodos anteriores</h2>
          {anteriores.map((r) => (
            <div key={r.id} className="flex flex-col gap-1 rounded-[20px] border border-[#D9D3C0] bg-white px-4 py-3">
              <span className="text-[13px] font-bold tracking-[0.1em] text-[#4A4F6B]">{rotuloPeriodo(r.inicio, r.fim)}</span>
              <span className="text-[15px] font-extrabold">
                {r.gerados} {r.gerados === 1 ? "gerado" : "gerados"} · {r.postados} {r.postados === 1 ? "postado" : "postados"}
              </span>
              <span className="text-[14px] font-medium leading-snug text-[#4A4F6B]">
                {r.temasPostados.length ? `Postados: ${r.temasPostados.join(", ")}.` : "Nenhum post marcado como postado."}
              </span>
            </div>
          ))}
        </section>
      )}

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
