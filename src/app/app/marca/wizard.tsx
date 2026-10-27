"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CATALOGO,
  CONJUNTOS,
  DIAS_SEMANA,
  DIAS_SUGERIDOS,
  FONTS,
  MAX_SERVICOS,
  PALETTES,
  SUGESTAO,
  TERMO_MARCA,
  TIPOS_NEGOCIO,
  TOM_SUGERIDO,
  TONS,
  planoDoRitmo,
  previaSemana,
} from "@/lib/marca-data";
import { salvarMarca } from "./actions";
import { formataWhatsapp, normalizaWhatsapp } from "@/lib/whatsapp";
import type { DadosMarca, NichoPrivado } from "./tipos";
import { PassoCores, PassoFeed, PassoLetra, PassoTom } from "./passos-marca";
import { Chip, PreviaFeed, Titulo, botaoPrimario, botaoSecundario, campo, type SetDados } from "./ui";

export type { DadosMarca } from "./tipos";

type Props = {
  userId: string;
  inicial: DadosMarca;
  concluida: boolean;
  identidadeTravada: boolean;
  travaAte: string | null;
  nichosPrivados: NichoPrivado[];
};

const MAX_PRINCIPAIS = 3;

const PASSOS = ["Negócio", "Dados", "Serviços", "Cores", "Feed", "Letra", "Tom", "Ritmo", "Confirmar"] as const;
const ULTIMO = PASSOS.length - 1;

export default function MarcaWizard({ userId, inicial, concluida, identidadeTravada, travaAte, nichosPrivados }: Props) {
  const router = useRouter();
  const tipos = useMemo(
    () => [...TIPOS_NEGOCIO, ...nichosPrivados.map((n) => ({ id: n.id, nome: n.nome, frase: n.frase }))],
    [nichosPrivados],
  );
  const sugestaoDe = (id: string) => {
    const n = nichosPrivados.find((x) => x.id === id);
    if (n) {
      const base = SUGESTAO.outro;
      return { pal: n.sugestao.pal ?? base.pal, fonte: (n.sugestao.fonte ?? base.fonte) as typeof base.fonte, conjunto: n.sugestao.conjunto ?? base.conjunto, tom: n.sugestao.tom ?? TOM_SUGERIDO.outro };
    }
    const sg = SUGESTAO[id] ?? SUGESTAO.outro;
    return { ...sg, tom: TOM_SUGERIDO[id] ?? TOM_SUGERIDO.outro };
  };
  const catalogoDe = (id: string) => nichosPrivados.find((x) => x.id === id)?.catalogo ?? CATALOGO[id] ?? CATALOGO.outro;
  const [passo, setPasso] = useState(concluida ? ULTIMO : inicial.tipo ? 1 : 0);
  const [d, setD] = useState<DadosMarca>(() => {
    const sug = inicial.tipo ? sugestaoDe(inicial.tipo) : null;
    return {
      ...inicial,
      palId: inicial.palId || sug?.pal || "",
      fonte: inicial.fonte || sug?.fonte || "",
      conjunto: inicial.conjunto || sug?.conjunto || "",
      tom: inicial.tom || sug?.tom || "",
      dias: inicial.dias.length ? inicial.dias : DIAS_SUGERIDOS[3],
    };
  });
  const [aceite, setAceite] = useState(concluida);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [, startTransition] = useTransition();
  const topo = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof DadosMarca>(k: K, v: DadosMarca[K]) => setD((x) => ({ ...x, [k]: v })), []);

  const irPara = (n: number) => {
    setErro("");
    setPasso(n);
    topo.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0 });
  };

  // Salva o que já foi preenchido a cada passo (sem travar a tela): ela pode sair e voltar.
  const salvarRascunho = (n: number) => {
    startTransition(() => {
      void salvarMarca({ ...payload(d), passo: n, finalizar: false, aceite: false });
    });
  };

  const avancar = () => {
    salvarRascunho(passo);
    irPara(passo + 1);
  };

  const escolherTipo = (id: string) => {
    const sug = sugestaoDe(id);
    setD((x) => ({
      ...x,
      tipo: id,
      servicos: x.tipo === id ? x.servicos : [],
      principais: x.tipo === id ? x.principais : [],
      palId: identidadeTravada ? x.palId : sug.pal,
      fonte: identidadeTravada ? x.fonte : sug.fonte,
      conjunto: identidadeTravada ? x.conjunto : sug.conjunto,
      tom: x.tipo === id && x.tom ? x.tom : sug.tom,
    }));
    window.setTimeout(() => irPara(1), 220);
  };

  const finalizar = async () => {
    setSalvando(true);
    setErro("");
    const r = await salvarMarca({ ...payload(d), passo: ULTIMO, finalizar: true, aceite });
    if (r.ok) {
      // Primeira vez: ainda falta uma pergunta (diferenciais). Edição volta direto ao calendário.
      router.push(concluida ? "/app" : "/app/marca/diferenciais");
      router.refresh();
    } else {
      setErro(r.erro);
      setSalvando(false);
    }
  };

  const ritmo = planoDoRitmo(d.dias.length || 1);
  const podeAvancar =
    (passo === 0 && !!d.tipo) ||
    (passo === 1 && d.nome.trim().length > 1 && !!normalizaWhatsapp(d.telefone)) ||
    (passo === 2 && d.servicos.length > 0) ||
    (passo === 3 && (!!d.palId || !!d.custom)) ||
    (passo === 4 && !!d.conjunto) ||
    (passo === 5 && !!d.fonte) ||
    (passo === 6 && !!d.tom && (!d.waBio || !!normalizaWhatsapp(d.whatsapp))) ||
    (passo === 7 && d.dias.length > 0);

  return (
    <div ref={topo} className="mx-auto flex w-full max-w-md flex-1 flex-col text-[#0E1330]">
      {/* Cabeçalho com progresso */}
      <div className="sticky top-0 z-10 bg-[#F6F3EA]/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {passo > 0 ? (
            <button
              type="button"
              onClick={() => irPara(passo - 1)}
              aria-label="Voltar"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 border-[#0E1330]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
          ) : (
            <span className="h-11 w-11 flex-none" aria-hidden="true" />
          )}
          <div className="flex-1">
            <div className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4A4F6B]">
              Passo {passo + 1} de {PASSOS.length} · {PASSOS[passo]}
            </div>
            <div className="mt-1.5 flex gap-1" aria-hidden="true">
              {PASSOS.map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? "bg-[#0E1330]" : "bg-[#D9D3C0]"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-32 pt-3">
        {passo === 0 && <PassoTipo tipo={d.tipo} tipos={tipos} onEscolher={escolherTipo} />}
        {passo === 1 && <PassoDados d={d} set={set} />}
        {passo === 2 && <PassoServicos d={d} set={set} catalogoDe={catalogoDe} />}
        {passo === 3 && <PassoCores userId={userId} d={d} set={set} travada={identidadeTravada} travaAte={travaAte} />}
        {passo === 4 && <PassoFeed d={d} set={set} travada={identidadeTravada} travaAte={travaAte} />}
        {passo === 5 && <PassoLetra d={d} set={set} travada={identidadeTravada} travaAte={travaAte} />}
        {passo === 6 && <PassoTom d={d} set={set} />}
        {passo === 7 && <PassoRitmo d={d} set={set} plano={ritmo.nome} />}
        {passo === 8 && (
          <PassoConfirmar d={d} tipos={tipos} irPara={irPara} aceite={aceite} setAceite={setAceite} jaConcluida={concluida} plano={ritmo.nome} />
        )}
        {erro && (
          <p role="alert" className="rounded-[14px] bg-[#FFE3DD] px-4 py-3 text-[15px] font-bold text-[#8A1F0A]">
            {erro}
          </p>
        )}
      </div>

      {/* Botão sempre à mão, no polegar */}
      {passo > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#D9D3C0] bg-[#F6F3EA]/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            {passo < ULTIMO ? (
              <button type="button" className={botaoPrimario} disabled={!podeAvancar} onClick={avancar}>
                Continuar
              </button>
            ) : (
              <button type="button" className={botaoPrimario} disabled={salvando || !aceite} onClick={finalizar}>
                {salvando ? "Salvando..." : concluida ? "Salvar alterações" : "Salvar minha marca"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function payload(d: DadosMarca) {
  return { ...d, logoUrl: d.logoUrl };
}

/* ---------------- 1. Tipo de negócio ---------------- */
function PassoTipo({ tipo, tipos, onEscolher }: { tipo: string; tipos: { id: string; nome: string; frase: string }[]; onEscolher: (id: string) => void }) {
  return (
    <>
      <Titulo sub="Toque no que mais combina. Assim eu já deixo tudo pronto para você.">O que você faz?</Titulo>
      <div className="flex flex-col gap-3">
        {tipos.map((t) => {
          const sel = tipo === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={sel}
              onClick={() => onEscolher(t.id)}
              className={`flex min-h-[72px] items-center gap-3 rounded-[20px] border-2 px-4 py-3 text-left transition active:scale-[0.99] ${
                sel ? "border-[#0E1330] bg-[#C8FF2E]" : "border-[#B9B29C] bg-white"
              }`}
            >
              <span className="flex flex-1 flex-col">
                <span className="text-lg font-extrabold leading-tight">{t.nome}</span>
                <span className="text-[14px] font-medium text-[#4A4F6B]">{t.frase}</span>
              </span>
              {sel && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0E1330" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- 2. Dados ---------------- */
function PassoDados({ d, set }: { d: DadosMarca; set: SetDados }) {
  return (
    <>
      <Titulo sub="É o que aparece nas suas artes e nas legendas.">Como se chama o seu negócio?</Titulo>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-nome">
          Nome do negócio
          <input id="m-nome" className={campo} value={d.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Studio Bela" autoComplete="organization" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-insta">
          <span>Seu Instagram <span className="font-medium text-[#4A4F6B]">(se quiser)</span></span>
          <div className="flex items-center rounded-[16px] border-2 border-[#B9B29C] bg-white focus-within:border-[#0E1330]">
            <span className="pl-4 text-base font-extrabold text-[#4A4F6B]">@</span>
            <input id="m-insta" className="min-h-14 w-full rounded-[16px] bg-transparent px-2 text-base font-semibold focus:outline-none" value={d.instagram} onChange={(e) => set("instagram", e.target.value.replace(/^@+/, ""))} placeholder="seunegocio" autoCapitalize="none" autoCorrect="off" maxLength={40} />
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-bairro">
            Bairro
            <input id="m-bairro" className={campo} value={d.bairro} onChange={(e) => set("bairro", e.target.value)} placeholder="Ex: Jabaquara" maxLength={60} />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-cidade">
            Cidade
            <input id="m-cidade" className={campo} value={d.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="Ex: São Paulo" maxLength={60} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-telefone">
          Seu telefone pessoal
          <input
            id="m-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={campo}
            value={d.telefone}
            onChange={(e) => {
              const novo = e.target.value;
              const mesmoAntes = !!normalizaWhatsapp(d.telefone) && normalizaWhatsapp(d.whatsapp) === normalizaWhatsapp(d.telefone);
              set("telefone", novo);
              if (mesmoAntes || d.whatsapp.trim() === "") set("whatsapp", novo);
            }}
            placeholder="DDD + número. Só para o Postei falar com você"
            maxLength={40}
          />
          {d.telefone.trim() !== "" && !normalizaWhatsapp(d.telefone) && (
            <span role="alert" className="text-[14px] font-bold text-[#8A1F0A]">Confira o número: use DDD e o telefone, por exemplo (11) 91234-5678.</span>
          )}
          {d.telefone.trim() !== "" && normalizaWhatsapp(d.telefone) && (
            <span className="text-[14px] font-bold text-[#2B4A00]">Número: {formataWhatsapp(normalizaWhatsapp(d.telefone)!)}. Não aparece nos seus posts.</span>
          )}
        </label>
        {normalizaWhatsapp(d.telefone) && (
          <label className="flex min-h-12 items-center gap-3 rounded-[16px] bg-white px-4 py-2 text-[15px] font-bold">
            <input
              type="checkbox"
              checked={normalizaWhatsapp(d.whatsapp) === normalizaWhatsapp(d.telefone)}
              onChange={(e) => set("whatsapp", e.target.checked ? d.telefone : "")}
              className="h-6 w-6 flex-none accent-[#0E1330]"
            />
            Este número também é o WhatsApp para agendamentos
          </label>
        )}
      </div>
    </>
  );
}

/* ---------------- 3. Serviços ---------------- */
const normaliza = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function PassoServicos({ d, set, catalogoDe }: { d: DadosMarca; set: SetDados; catalogoDe: (id: string) => Record<string, string[]> }) {
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState<string[]>([]);
  const [verEscolhidos, setVerEscolhidos] = useState(false);
  const [escolhendoPrincipais, setEscolhendoPrincipais] = useState(false);

  const catalogo = catalogoDe(d.tipo);
  const categorias = Object.entries(catalogo);
  const conhecidos = new Set(categorias.flatMap(([, l]) => l));
  const proprios = d.servicos.filter((x) => !conhecidos.has(x));
  const aberta = (c: string) => abertas.includes(c) || (abertas.length === 0 && c === categorias[0]?.[0]);
  const alternarCategoria = (c: string) =>
    setAbertas((a) => {
      const base = a.length === 0 ? [categorias[0]?.[0] ?? ""] : a;
      return base.includes(c) ? base.filter((x) => x !== c) : [...base, c];
    });

  const alternar = (x: string) => {
    if (d.servicos.includes(x)) {
      set("servicos", d.servicos.filter((y) => y !== x));
      set("principais", d.principais.filter((y) => y !== x));
    } else if (d.servicos.length < MAX_SERVICOS) {
      set("servicos", [...d.servicos, x]);
    }
  };
  const adicionar = (texto: string) => {
    const v = texto.trim().slice(0, 60);
    if (v && !d.servicos.includes(v) && d.servicos.length < MAX_SERVICOS) set("servicos", [...d.servicos, v]);
    setBusca("");
  };
  const alternarPrincipal = (x: string) =>
    set(
      "principais",
      d.principais.includes(x) ? d.principais.filter((y) => y !== x) : d.principais.length >= MAX_PRINCIPAIS ? d.principais : [...d.principais, x],
    );

  const q = normaliza(busca);
  const todosOsNomes = [...new Set([...categorias.flatMap(([, l]) => l), ...proprios])];
  const resultados = q ? todosOsNomes.filter((x) => normaliza(x).includes(q)) : [];
  const existeExato = q ? todosOsNomes.some((x) => normaliza(x) === q) : false;
  const escolhidosVisiveis = verEscolhidos ? d.servicos : d.servicos.slice(0, 8);

  return (
    <>
      <Titulo sub="Procure ou abra um grupo e toque em todos os que você oferece. Quanto mais completo, melhores ficam os posts.">O que você oferece?</Titulo>

      <div className="sticky top-[76px] z-[5] -mx-5 bg-[#F6F3EA]/95 px-5 pb-2 pt-1 backdrop-blur">
        <label className="sr-only" htmlFor="m-busca">Buscar serviço</label>
        <input
          id="m-busca"
          type="search"
          className={campo}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (q && !existeExato) adicionar(busca); } }}
          placeholder="Buscar ou adicionar um serviço"
          maxLength={60}
          autoComplete="off"
        />
      </div>

      {d.servicos.length > 0 && !q && (
        <section aria-label="Serviços escolhidos" className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Meus serviços ({d.servicos.length})</h2>
            {d.servicos.length > 8 && (
              <button type="button" onClick={() => setVerEscolhidos((v) => !v)} className="min-h-11 px-2 text-[15px] font-extrabold underline">
                {verEscolhidos ? "Ver menos" : "Ver todos"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {escolhidosVisiveis.map((x) => (
              <Chip key={x} rotulo={x} sel principal={d.principais.includes(x)} onClick={() => alternar(x)} />
            ))}
          </div>
        </section>
      )}

      {q ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          {resultados.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {resultados.map((x) => (
                <Chip key={x} rotulo={x} sel={d.servicos.includes(x)} onClick={() => alternar(x)} />
              ))}
            </div>
          ) : (
            <p className="text-[15px] font-semibold text-[#4A4F6B]">Nenhum serviço com esse nome.</p>
          )}
          {!existeExato && (
            <button type="button" onClick={() => adicionar(busca)} className={botaoSecundario}>
              Adicionar &ldquo;{busca.trim()}&rdquo; como serviço
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {categorias.map(([cat, lista]) => {
            const abertaAgora = aberta(cat);
            const marcados = lista.filter((x) => d.servicos.includes(x)).length;
            return (
              <section key={cat} className="rounded-[20px] border-2 border-[#B9B29C] bg-white">
                <h2>
                  <button
                    type="button"
                    aria-expanded={abertaAgora}
                    onClick={() => alternarCategoria(cat)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
                  >
                    <span className="flex-1 text-lg font-extrabold">{cat}</span>
                    {marcados > 0 && <span className="rounded-full bg-[#0E1330] px-2.5 py-0.5 text-[13px] font-extrabold text-[#C8FF2E]">{marcados}</span>}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition ${abertaAgora ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </h2>
                {abertaAgora && (
                  <div className="flex flex-wrap gap-2.5 px-4 pb-4">
                    {lista.map((x) => (
                      <Chip key={x} rotulo={x} sel={d.servicos.includes(x)} onClick={() => alternar(x)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {proprios.length > 0 && (
            <p className="px-1 text-[14px] font-bold text-[#4A4F6B]">Serviços que você adicionou aparecem em &ldquo;Meus serviços&rdquo;.</p>
          )}
        </div>
      )}

      {d.servicos.length > 0 && !q && (
        <section aria-labelledby="h-principais" className="flex flex-col gap-3 rounded-[22px] border-2 border-[#0E1330] bg-white p-4">
          <div className="flex flex-col gap-1">
            <h2 id="h-principais" className="text-xl font-extrabold leading-tight">Quais são os seus principais?</h2>
            <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
              Marque até {MAX_PRINCIPAIS}: os que trazem mais faturamento e mais vendem. Eles aparecerão mais nos seus posts.
            </p>
          </div>
          {d.principais.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {d.principais.map((x) => (
                <Chip key={x} rotulo={x} sel principal onClick={() => alternarPrincipal(x)} />
              ))}
            </div>
          )}
          <button type="button" onClick={() => setEscolhendoPrincipais((v) => !v)} aria-expanded={escolhendoPrincipais} className={botaoSecundario}>
            {escolhendoPrincipais ? "Fechar a lista" : d.principais.length ? "Trocar os principais" : "Escolher os principais"}
          </button>
          {escolhendoPrincipais && (
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Escolha os principais">
              {d.servicos.filter((x) => !d.principais.includes(x)).map((x) => {
                const cheio = d.principais.length >= MAX_PRINCIPAIS;
                return (
                  <button key={x} type="button" disabled={cheio} onClick={() => alternarPrincipal(x)} className="min-h-12 rounded-full border-2 border-[#B9B29C] bg-[#F6F3EA] px-4 text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-40">
                    {x}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-[14px] font-bold text-[#4A4F6B]">{d.principais.length} de {MAX_PRINCIPAIS} principais</p>
        </section>
      )}
    </>
  );
}

/* ---------------- 4. Visual ---------------- */
function PassoRitmo({ d, set, plano }: { d: DadosMarca; set: SetDados; plano: string }) {
  const alternar = (i: number) =>
    set("dias", d.dias.includes(i) ? d.dias.filter((x) => x !== i) : [...d.dias, i].sort((a, b) => a - b));
  const atalhos = [2, 3, 5, 7];
  const semana = useMemo(() => previaSemana(d.dias, d.tipo, d.servicos, d.principais), [d.dias, d.tipo, d.servicos, d.principais]);
  return (
    <>
      <Titulo sub="Toque nos dias da semana em que quer postar. Você muda isso a cada mês.">Quando você quer postar?</Titulo>
      <div className="grid grid-cols-4 gap-2.5" role="group" aria-label="Dias da semana">
        {DIAS_SEMANA.map((nome, i) => {
          const sel = d.dias.includes(i);
          return (
            <button key={nome} type="button" aria-pressed={sel} onClick={() => alternar(i)} className={`flex min-h-16 items-center justify-center rounded-[16px] border-2 text-lg font-extrabold active:scale-[0.97] ${sel ? "border-[#0E1330] bg-[#0E1330] text-[#C8FF2E]" : "border-[#B9B29C] bg-white"}`}>
              {nome}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos">
        {atalhos.map((n) => {
          const sel = d.dias.length === n;
          return (
            <button key={n} type="button" aria-pressed={sel} onClick={() => set("dias", DIAS_SUGERIDOS[n])} className={`min-h-11 rounded-full border-2 px-4 text-[14px] font-bold active:scale-[0.97] ${sel ? "border-[#0E1330] bg-[#0E1330] text-[#C8FF2E]" : "border-[#B9B29C] bg-white"}`}>
              {n === 7 ? "Todos os dias" : `${n} por semana`}
            </button>
          );
        })}
      </div>

      {d.dias.length > 0 ? (
        <>
          <div className="rounded-[18px] bg-white px-4 py-3.5">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4A4F6B]">Seu plano</p>
            <p className="text-xl font-extrabold">{plano}</p>
            <p className="text-[14px] font-medium text-[#4A4F6B]">{d.dias.length} {d.dias.length === 1 ? "post" : "posts"} por semana.</p>
          </div>

          <section aria-labelledby="h-semana" className="flex flex-col gap-3">
            <h2 id="h-semana" className="text-xl font-extrabold leading-tight">O que você recebe em cada dia</h2>
            <ul className="flex flex-col gap-2.5">
              {semana.map((p) => (
                <li key={p.dia} className="flex items-center gap-3 rounded-[18px] border-2 border-[#B9B29C] bg-white p-3">
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-[14px] bg-[#0E1330] text-base font-extrabold text-[#C8FF2E]">{p.dia}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#4A4F6B]">{p.objetivo}</span>
                    <span className="text-base font-extrabold leading-tight">{p.tipo}</span>
                    {p.detalhe && <span className="text-[15px] font-medium leading-snug text-[#4A4F6B]">{p.detalhe}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[14px] font-medium text-[#4A4F6B]">Esta é a primeira semana de exemplo. O calendário do mês varia os serviços e os tipos de post.</p>
          </section>
        </>
      ) : (
        <div className="rounded-[18px] bg-white px-4 py-3.5">
          <p className="text-xl font-extrabold">Escolha ao menos um dia</p>
        </div>
      )}
    </>
  );
}

/* ---------------- 7. Confirmar ---------------- */
function PassoConfirmar({ d, tipos, irPara, aceite, setAceite, jaConcluida, plano }: { d: DadosMarca; tipos: { id: string; nome: string; frase: string }[]; irPara: (n: number) => void; aceite: boolean; setAceite: (v: boolean) => void; jaConcluida: boolean; plano: string }) {
  const pal = PALETTES.find((p) => p.id === d.palId);
  const tipo = tipos.find((t) => t.id === d.tipo);
  const nomeCores = d.custom ? (d.deLogo ? "Cores do seu logo" : "Cores próprias") : (pal?.nome ?? "");
  const tom = TONS.find((t) => t.id === d.tom);
  const linhas: { r: string; v: string; passo: number }[] = [
    { r: "Negócio", v: `${d.nome}${d.instagram ? ` · @${d.instagram}` : ""}`, passo: 1 },
    { r: "Telefone pessoal", v: formataWhatsapp(normalizaWhatsapp(d.telefone) ?? d.telefone), passo: 1 },
    { r: "Tipo", v: tipo?.nome ?? "", passo: 0 },
    { r: "Serviços", v: d.servicos.map((x) => (d.principais.includes(x) ? `★ ${x}` : x)).join(", "), passo: 2 },
    { r: "Cores e logo", v: `${nomeCores}${d.inv ? " (invertida)" : ""} · ${d.logoUrl ? "com logo" : "sem logo, uso o ícone do negócio"}`, passo: 3 },
    { r: "Feed", v: CONJUNTOS.find((c) => c.id === d.conjunto)?.nome ?? "", passo: 4 },
    { r: "Letra", v: FONTS.find((f) => f.id === d.fonte)?.nome ?? "", passo: 5 },
    { r: "Tom de voz", v: `${tom?.nome ?? ""} · ${d.waBio ? `chama para o link da bio (WhatsApp de agendamento ${formataWhatsapp(normalizaWhatsapp(d.whatsapp) ?? d.whatsapp)})` : "chama para o direct"}`, passo: 6 },
    { r: "Dias", v: `${d.dias.map((i) => DIAS_SEMANA[i]).join(", ")} · ${plano}`, passo: 7 },
  ];
  return (
    <>
      <Titulo sub="Confira se está tudo certo. Dá para mudar qualquer item tocando em Mudar.">Quase pronto!</Titulo>
      <PreviaFeed d={d} />
      <dl className="flex flex-col divide-y divide-[#D9D3C0] rounded-[20px] bg-white px-4">
        {linhas.map((l) => (
          <div key={l.r} className="flex items-start gap-3 py-3">
            <div className="flex-1">
              <dt className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4A4F6B]">{l.r}</dt>
              <dd className="text-base font-bold leading-snug">{l.v}</dd>
            </div>
            <button type="button" onClick={() => irPara(l.passo)} className="min-h-11 px-2 text-[15px] font-extrabold underline">Mudar</button>
          </div>
        ))}
      </dl>
      {!jaConcluida && (
        <>
          <div role="note" className="rounded-[18px] border-2 border-[#0E1330] bg-[#C8FF2E] p-4 text-[15px] font-extrabold leading-snug text-[#0E1330]">
            Antes de salvar, tenha certeza: o logo, as cores da marca, a letra e o estilo do feed só poderão ser alterados depois de 30 dias.
          </div>
          <label className="flex items-start gap-3 rounded-[18px] border-2 border-[#0E1330] bg-white p-4">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-[#0E1330]" />
            <span className="flex flex-col gap-2 text-[15px] font-semibold leading-snug">
              <span>Revisei as escolhas e confirmo que tudo está correto.</span>
              <span>Tenho ciência de que as publicações realizadas no meu perfil são de minha responsabilidade.</span>
            </span>
          </label>
          <details className="rounded-[16px] bg-white px-4 py-3 text-[14px] font-medium text-[#4A4F6B]">
            <summary className="min-h-11 cursor-pointer text-[15px] font-extrabold text-[#0E1330]">Ler o termo completo</summary>
            <p className="pt-2 leading-relaxed">{TERMO_MARCA}</p>
          </details>
        </>
      )}
    </>
  );
}
