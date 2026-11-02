import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Painel de gestão (somente leitura). Só quem está em public.administradores entra.
// Custo: 4 consultas agregadas por abertura da página, sem chamada externa e sem IA.
export const dynamic = "force-dynamic";

type Resumo = {
  contas_total: number; contas_7d: number; contas_30d: number; marcas_concluidas: number;
  ativos_7d: number; posts_gerados: number; posts_publicados: number; publicados_7d: number;
  custo_mes_brl: number; chamadas_mes: number; testes_total: number; testes_usaram_geracao: number;
};
type Cliente = {
  id: string; nome_negocio: string | null; email: string | null; telefone: string | null;
  plano: string | null; status: string | null; trial_fim: string | null; criado_em: string;
  origem: string | null; tipo_negocio: string | null; cidade: string | null; bairro: string | null;
  instagram: string | null; marca_concluida: boolean; ultimo_uso: string | null;
  posts_gerados: number; publicados_30d: number; custo_mes_brl: number;
};
type Custos = {
  por_funcao: { funcao: string; servico: string; chamadas: number; custo_brl: number; tokens_entrada: number; tokens_saida: number }[];
  por_dia: { dia: string; custo_brl: number }[];
};
type Teste = Record<string, string | number | boolean | null>;

const DIAS_RISCO = 5; // sem uso há 5 dias entra na lista de retenção
const ORCAMENTO_IA_POR_CLIENTE = 1; // R$ por cliente por mês (regra do projeto)

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const data = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }) : "—";
const dataHora = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";
const diasDesde = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null);

function Cartao({ rotulo, valor, nota }: { rotulo: string; valor: string | number; nota?: string }) {
  return (
    <div className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
      <div className="text-[13px] font-semibold text-[#4A4F6B]">{rotulo}</div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight">{valor}</div>
      {nota && <div className="mt-1 text-xs text-[#4A4F6B]">{nota}</div>}
    </div>
  );
}

function Selo({ children, tom }: { children: React.ReactNode; tom: "verde" | "ambar" | "cinza" }) {
  const cor =
    tom === "verde" ? "bg-[#C8FF2E] text-[#0E1330]" : tom === "ambar" ? "bg-[#FFD9A8] text-[#5A3200]" : "bg-[#E7E3D6] text-[#4A4F6B]";
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${cor}`}>{children}</span>;
}

export default async function Gestao() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (!ehAdmin) notFound();

  const [rResumo, rClientes, rCustos, rTestes] = await Promise.all([
    supabase.rpc("gestao_resumo"),
    supabase.rpc("gestao_clientes"),
    supabase.rpc("gestao_custos"),
    supabase.rpc("gestao_testes"),
  ]);

  if (rResumo.error) {
    return (
      <div className="px-5 py-8">
        <h1 className="text-2xl font-extrabold">Painel de gestão</h1>
        <p className="mt-3 rounded-[14px] border border-dashed border-[#B9B29C] p-4 text-sm text-[#4A4F6B]">
          As consultas do painel ainda não existem no banco. Rode o SQL <b>0011_painel_gestao</b> no SQL Editor do Supabase e recarregue.
          <br />
          <span className="text-xs">({rResumo.error.message})</span>
        </p>
      </div>
    );
  }

  const resumo = rResumo.data as Resumo;
  const clientes = (rClientes.data ?? []) as Cliente[];
  const custos = (rCustos.data ?? { por_funcao: [], por_dia: [] }) as Custos;
  const testes = (rTestes.data ?? []) as Teste[];

  // funil: cada etapa conta quantas contas chegaram até ali
  const funil = [
    { etapa: "Criou a conta", n: clientes.length },
    { etapa: "Concluiu a marca", n: clientes.filter((c) => c.marca_concluida).length },
    { etapa: "Tem programação gerada", n: clientes.filter((c) => c.posts_gerados > 0).length },
    { etapa: "Usou nos últimos 7 dias", n: clientes.filter((c) => (diasDesde(c.ultimo_uso) ?? 99) <= 7).length },
    { etapa: "Publicou nos últimos 30 dias", n: clientes.filter((c) => c.publicados_30d > 0).length },
  ];

  const emRisco = clientes.filter((c) => c.marca_concluida && (diasDesde(c.ultimo_uso) ?? 999) >= DIAS_RISCO);
  const semMarca = clientes.filter((c) => !c.marca_concluida);
  const taxaPublicacao = resumo.posts_gerados ? Math.round((resumo.posts_publicados / resumo.posts_gerados) * 100) : 0;
  const custoPorCliente = resumo.ativos_7d ? resumo.custo_mes_brl / resumo.ativos_7d : 0;
  const maxDia = Math.max(0.0001, ...custos.por_dia.map((d) => Number(d.custo_brl)));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 pb-12 pt-7 text-[#0E1330]">
      <header className="flex flex-col gap-1">
        <div className="text-[13px] font-bold tracking-[0.14em] text-[#4A4F6B]">SOMENTE VOCÊ VÊ ESTA PÁGINA</div>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">Painel de gestão</h1>
        <p className="text-sm text-[#4A4F6B]">Os números atualizam quando você recarrega a página.</p>
      </header>

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cartao rotulo="Contas criadas" valor={resumo.contas_total} nota={`${resumo.contas_7d} nos últimos 7 dias · ${resumo.contas_30d} em 30`} />
        <Cartao rotulo="Marcas concluídas" valor={resumo.marcas_concluidas} nota={`${semMarca.length} ainda no cadastro`} />
        <Cartao rotulo="Ativas em 7 dias" valor={resumo.ativos_7d} nota={`${emRisco.length} em risco (${DIAS_RISCO}+ dias sem uso)`} />
        <Cartao rotulo="Posts publicados" valor={resumo.posts_publicados} nota={`${taxaPublicacao}% dos ${resumo.posts_gerados} gerados · ${resumo.publicados_7d} em 7 dias`} />
        <Cartao rotulo="Custo de IA no mês" valor={brl(Number(resumo.custo_mes_brl))} nota={`${resumo.chamadas_mes} chamadas`} />
        <Cartao
          rotulo="Custo por cliente ativa"
          valor={resumo.ativos_7d ? brl(custoPorCliente) : "—"}
          nota={`meta: até ${brl(ORCAMENTO_IA_POR_CLIENTE)} por cliente por mês`}
        />
        <Cartao rotulo="Passaram pelo Teste" valor={resumo.testes_total} nota={`${resumo.testes_usaram_geracao} usaram a geração grátis`} />
      </section>

      <section aria-label="Funil" className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
        <h2 className="text-lg font-extrabold">Funil</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {funil.map((f) => (
            <li key={f.etapa} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <div>
                <div className="font-semibold">{f.etapa}</div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E7E3D6]">
                  <div className="h-full rounded-full bg-[#0E1330]" style={{ width: `${funil[0].n ? Math.round((f.n / funil[0].n) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="font-extrabold tabular-nums">{f.n}</div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Retenção" className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
        <h2 className="text-lg font-extrabold">Retenção: quem precisa de atenção</h2>
        {emRisco.length === 0 && semMarca.length === 0 ? (
          <p className="mt-2 text-sm text-[#4A4F6B]">Ninguém em risco agora.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {emRisco.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#F6F3EA] px-3 py-2">
                <span><b>{c.nome_negocio ?? "Sem nome"}</b> · {c.email ?? "sem e-mail"}</span>
                <span className="flex items-center gap-2">
                  <Selo tom="ambar">{c.ultimo_uso ? `${diasDesde(c.ultimo_uso)} dias sem uso` : "nunca usou"}</Selo>
                  {c.telefone && <span className="text-xs text-[#4A4F6B]">{c.telefone}</span>}
                </span>
              </li>
            ))}
            {semMarca.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#F6F3EA] px-3 py-2">
                <span><b>{c.nome_negocio ?? "Sem nome"}</b> · {c.email ?? "sem e-mail"}</span>
                <Selo tom="cinza">parou no cadastro · criou em {data(c.criado_em)}</Selo>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Clientes" className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
        <h2 className="text-lg font-extrabold">Clientes ({clientes.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#4A4F6B]">
              <tr>
                <th className="py-2 pr-3">Negócio</th><th className="pr-3">Contato</th><th className="pr-3">Plano</th>
                <th className="pr-3">Cadastro</th><th className="pr-3">Último uso</th><th className="pr-3 text-right">Posts</th>
                <th className="pr-3 text-right">Publicou 30d</th><th className="text-right">Custo IA</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-[#EFEBDD] align-top">
                  <td className="py-2 pr-3">
                    <div className="font-bold">{c.nome_negocio ?? "—"}</div>
                    <div className="text-xs text-[#4A4F6B]">{[c.tipo_negocio, c.bairro, c.cidade].filter(Boolean).join(" · ") || "marca incompleta"}</div>
                  </td>
                  <td className="pr-3">
                    <div>{c.email ?? "—"}</div>
                    <div className="text-xs text-[#4A4F6B]">{[c.telefone, c.instagram && `@${c.instagram.replace(/^@/, "")}`].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="pr-3">
                    <Selo tom={c.status === "ativo" ? "verde" : "cinza"}>{c.plano ?? "—"} · {c.status ?? "—"}</Selo>
                    {c.trial_fim && <div className="mt-1 text-xs text-[#4A4F6B]">teste até {data(c.trial_fim)}</div>}
                  </td>
                  <td className="pr-3">{data(c.criado_em)}{c.marca_concluida ? "" : " (sem marca)"}</td>
                  <td className="pr-3">{dataHora(c.ultimo_uso)}</td>
                  <td className="pr-3 text-right tabular-nums">{c.posts_gerados}</td>
                  <td className="pr-3 text-right tabular-nums">{c.publicados_30d}</td>
                  <td className="text-right tabular-nums">{brl(Number(c.custo_mes_brl))}</td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr><td colSpan={8} className="py-4 text-[#4A4F6B]">Ninguém criou conta ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Custos" className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
        <h2 className="text-lg font-extrabold">Custos do mês</h2>
        {custos.por_funcao.length === 0 ? (
          <p className="mt-2 text-sm text-[#4A4F6B]">Nenhuma chamada paga registrada neste mês.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[#4A4F6B]">
                <tr><th className="py-2 pr-3">Função</th><th className="pr-3">Serviço</th><th className="pr-3 text-right">Chamadas</th><th className="pr-3 text-right">Tokens (ent./saída)</th><th className="text-right">Custo</th></tr>
              </thead>
              <tbody>
                {custos.por_funcao.map((f) => (
                  <tr key={`${f.servico}-${f.funcao}`} className="border-t border-[#EFEBDD]">
                    <td className="py-2 pr-3 font-semibold">{f.funcao}</td>
                    <td className="pr-3">{f.servico}</td>
                    <td className="pr-3 text-right tabular-nums">{f.chamadas}</td>
                    <td className="pr-3 text-right tabular-nums">{f.tokens_entrada} / {f.tokens_saida}</td>
                    <td className="text-right tabular-nums">{brl(Number(f.custo_brl))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {custos.por_dia.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-[#4A4F6B]">Custo por dia (últimos 30 dias)</div>
            <div className="mt-2 flex h-24 items-end gap-1" role="img" aria-label="Gráfico de custo por dia">
              {custos.por_dia.map((d) => (
                <div key={d.dia} title={`${d.dia}: ${brl(Number(d.custo_brl))}`} className="flex-1 rounded-t bg-[#0E1330]" style={{ height: `${Math.max(4, (Number(d.custo_brl) / maxDia) * 100)}%` }} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section aria-label="Teste independente" className="rounded-[18px] border border-[#D9D3C0] bg-white p-4">
        <h2 className="text-lg font-extrabold">Quem passou pelo Teste ({testes.length})</h2>
        {testes.length === 0 ? (
          <p className="mt-2 text-sm text-[#4A4F6B]">Ninguém usou o Teste ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[#4A4F6B]">
                <tr><th className="py-2 pr-3">Estúdio</th><th className="pr-3">Nome</th><th className="pr-3">WhatsApp</th><th className="pr-3">Instagram</th><th className="pr-3">Entrou</th><th>Geração grátis</th></tr>
              </thead>
              <tbody>
                {testes.map((t, i) => (
                  <tr key={String(t.id ?? i)} className="border-t border-[#EFEBDD]">
                    <td className="py-2 pr-3 font-semibold">{String(t.estudio ?? "—")}</td>
                    <td className="pr-3">{String(t.nome ?? "—")}</td>
                    <td className="pr-3">{String(t.whatsapp ?? "—")}</td>
                    <td className="pr-3">{t.instagram ? `@${String(t.instagram).replace(/^@/, "")}` : "—"}</td>
                    <td className="pr-3">{data(String(t.criado_em ?? ""))}</td>
                    <td>{t.primeira_geracao_em ? <Selo tom="verde">usada em {data(String(t.primeira_geracao_em))}</Selo> : <Selo tom="cinza">não usou</Selo>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
