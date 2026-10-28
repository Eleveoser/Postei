"use client";

import { useState } from "react";
import { coresFinais, ehHex, logoPalette, type CoresCustom } from "@/lib/marca-cores";
import { formataWhatsapp, normalizaWhatsapp } from "@/lib/whatsapp";
import { CONJUNTOS, FONTS, PALETTES, PAL_GROUPS, TONS } from "@/lib/marca-data";
import type { DadosMarca, FundoTipo } from "./tipos";
import {
  FaixaFeed,
  PreviaFeed,
  Titulo,
  botaoSecundario,
  campo,
  carregarBlob,
  enviarImagem,
  reduzirImagem,
  tratarLogo,
  type SetDados,
} from "./ui";

const cartao = (sel: boolean) =>
  `flex w-full flex-col items-start gap-1 rounded-[18px] border-2 px-4 py-3 text-left transition active:scale-[0.99] ${
    sel ? "border-[#0E1330] bg-[#C8FF2E]" : "border-[#B9B29C] bg-white"
  }`;

function AvisoTrava({ travaAte }: { travaAte: string | null }) {
  return (
    <p className="rounded-[16px] bg-white px-4 py-3 text-[15px] font-semibold text-[#4A4F6B]">
      Sua identidade visual está confirmada até {travaAte ? new Date(travaAte + "T12:00:00").toLocaleDateString("pt-BR") : "o fim do prazo"}. Depois dessa data você pode mudar.
    </p>
  );
}

/* ---------------- Cores, logo e detalhe de fundo ---------------- */

const FUNDOS: { id: FundoTipo; nome: string }[] = [
  { id: "nenhum", nome: "Só a cor" },
  { id: "icone", nome: "Marca d'água do seu negócio" },
  { id: "foto", nome: "Sua foto de fundo" },
];

export function PassoCores({ userId, d, set, travada, travaAte }: { userId: string; d: DadosMarca; set: SetDados; travada: boolean; travaAte: string | null }) {
  const [msg, setMsg] = useState("");
  const [enviando, setEnviando] = useState("");
  const [doLogo, setDoLogo] = useState<CoresCustom | null>(null);
  const pal = PALETTES.find((p) => p.id === d.palId);
  const atuais = coresFinais(pal, d.custom, false);

  const escolherLogo = async (file: File | undefined) => {
    if (!file) return;
    setMsg("");
    setEnviando("logo");
    try {
      const blob = await tratarLogo(file, 512);
      const img = await carregarBlob(blob);
      setDoLogo(logoPalette(img));
      set("logoUrl", await enviarImagem(userId, "logo", blob));
    } catch {
      setMsg("Não consegui usar essa imagem. Tente outra foto do logo.");
    }
    setEnviando("");
  };

  const escolherFundo = async (file: File | undefined) => {
    if (!file) return;
    setMsg("");
    setEnviando("fundo");
    try {
      const blob = await reduzirImagem(file, 1080);
      set("fundoUrl", await enviarImagem(userId, "fundo", blob));
    } catch {
      setMsg("Não consegui usar essa foto. Tente outra.");
    }
    setEnviando("");
  };

  const mudarCor = (k: keyof CoresCustom, v: string) => {
    if (!ehHex(v)) return;
    set("custom", { c1: atuais.c1, c2: atuais.c2, c3: atuais.c3, bg: atuais.bg, ...(d.custom ?? {}), [k]: v });
    set("deLogo", false);
  };

  return (
    <>
      <Titulo sub={travada ? undefined : "Já tem logo ou cores da marca? Comece por elas. Se não tem, escolha uma paleta pronta mais abaixo."}>
        Logo e cores da sua marca
      </Titulo>
      <PreviaFeed d={d} />
      {travada ? (
        <AvisoTrava travaAte={travaAte} />
      ) : (
        <div className="flex flex-col gap-7">
          <section aria-labelledby="h-logo" className="flex flex-col gap-3 rounded-[22px] bg-white p-4">
            <h2 id="h-logo" className="text-xl font-extrabold leading-tight">1. Seu logo e suas cores</h2>
            <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
              Opcional. Sem logo, a arte usa as iniciais. O melhor é um PNG com fundo transparente ou branco, quadrado ou redondo.
            </p>
            {d.logoUrl && (
              <div className="flex items-center justify-center rounded-[16px] border-2 border-dashed border-[#B9B29C] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.logoUrl} alt="Seu logo" className="max-h-32 max-w-full object-contain" />
              </div>
            )}
            <label className={`${botaoSecundario} cursor-pointer`}>
              {enviando === "logo" ? "Enviando..." : d.logoUrl ? "Trocar o logo" : "Escolher imagem do logo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherLogo(e.target.files?.[0])} />
            </label>
            {d.logoUrl && (
              <button type="button" className="min-h-11 text-[15px] font-extrabold underline" onClick={() => { set("logoUrl", null); setDoLogo(null); }}>
                Tirar o logo
              </button>
            )}
            {doLogo && (
              <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[#F6F3EA] p-3">
                <span className="text-[15px] font-bold">Cores do seu logo:</span>
                {[doLogo.c1, doLogo.c2, doLogo.c3, ...(doLogo.bg ? [doLogo.bg] : [])].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full border-2 border-[#B9B29C]" style={{ background: c }} aria-hidden="true" />
                ))}
                <button type="button" className={`${botaoSecundario} min-h-11`} onClick={() => { set("custom", doLogo); set("deLogo", true); }}>
                  Usar estas cores
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <p className="text-[15px] font-extrabold">Já tem cores de marca? Escolha as quatro:</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {([
                  ["c1", "Principal", "Fundos fortes"],
                  ["c2", "Secundária", "Destaques e fundos claros"],
                  ["c3", "Detalhe", "Linhas e acabamento"],
                  ["bg", "Fundo claro", "Fundo dos posts"],
                ] as const).map(([k, nome, dica]) => (
                  <label key={k} className="flex flex-col items-center gap-1 text-center text-[13px] font-bold leading-tight">
                    <input
                      type="color"
                      value={(d.custom ?? atuais)[k] ?? atuais.bg}
                      onChange={(e) => mudarCor(k, e.target.value)}
                      aria-label={`Cor ${nome.toLowerCase()}`}
                      className="h-14 w-full cursor-pointer rounded-[12px] border-2 border-[#B9B29C] bg-white p-1"
                    />
                    {nome}
                    <span className="font-medium text-[#4A4F6B]">{dica}</span>
                  </label>
                ))}
              </div>
              {d.custom && (
                <button type="button" className="min-h-11 text-[15px] font-extrabold underline" onClick={() => { set("custom", null); set("deLogo", false); }}>
                  Voltar à paleta pronta
                </button>
              )}
              {d.custom && <p className="text-[14px] font-bold text-[#4A4F6B]">{d.deLogo ? "Usando as cores do seu logo." : "Usando as suas cores."}</p>}
            </div>
          </section>

          <section aria-labelledby="h-paleta" className="flex flex-col gap-3">
            <h2 id="h-paleta" className="text-xl font-extrabold leading-tight">2. Ou escolha uma paleta</h2>
            <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
              Agrupadas pelo que comunicam. Cada uma tem três cores e um fundo claro.
            </p>
            {PAL_GROUPS.map((g) => (
              <div key={g.id} className="flex flex-col gap-2">
                <p className="text-[14px] font-extrabold text-[#4A4F6B]">{g.nome}</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {PALETTES.filter((p) => p.grupo === g.id).map((p) => {
                    const sel = !d.custom && d.palId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => { set("palId", p.id); set("custom", null); set("deLogo", false); }}
                        className={`flex min-h-[84px] flex-col gap-2 rounded-[16px] border-2 p-2.5 text-left active:scale-[0.99] ${sel ? "border-[#0E1330] bg-[#C8FF2E]" : "border-[#B9B29C] bg-white"}`}
                      >
                        <span className="flex h-8 overflow-hidden rounded-[10px]" aria-hidden="true">
                          {[p.c1, p.c2, p.c3, p.bg].map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                        </span>
                        <span className="text-[13px] font-bold leading-tight">{p.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <label className="flex min-h-12 items-center gap-3 rounded-[16px] bg-white px-4 py-2 text-[15px] font-bold">
              <input type="checkbox" checked={d.inv} onChange={(e) => set("inv", e.target.checked)} className="h-6 w-6 flex-none accent-[#0E1330]" />
              Inverter: a cor secundária vira a principal
            </label>
          </section>

          <section aria-labelledby="h-fundo" className="flex flex-col gap-3">
            <h2 id="h-fundo" className="text-xl font-extrabold leading-tight">3. Detalhe de fundo nos posts</h2>
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Detalhe de fundo">
              {FUNDOS.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={d.fundo === f.id} onClick={() => set("fundo", f.id)} className={cartao(d.fundo === f.id)}>
                  <span className="text-base font-extrabold">{f.nome}</span>
                </button>
              ))}
            </div>
            {d.fundo === "foto" && (
              <div className="flex flex-col gap-2 rounded-[18px] bg-white p-3.5">
                <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
                  Uma foto do seu espaço ou dos seus produtos, sem pessoas. Ela entra clarinha, como marca d&apos;água, na cor da sua marca.
                </p>
                <label className={`${botaoSecundario} cursor-pointer`}>
                  {enviando === "fundo" ? "Enviando..." : d.fundoUrl ? "Trocar a foto de fundo" : "Escolher a foto de fundo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherFundo(e.target.files?.[0])} />
                </label>
              </div>
            )}
          </section>

          <details className="rounded-[18px] bg-white px-4 py-3">
            <summary className="min-h-11 cursor-pointer text-[17px] font-extrabold">4. Cor do texto (opcional)</summary>
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
                O app já escolhe a cor mais legível em cada fundo. Se mudar, olhe a prévia no alto. Se alguma cor ficar difícil de ler, o app usa a automática ali.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-[14px] font-extrabold">Em fundos claros</p>
                <div className="flex flex-wrap gap-2.5">
                  {([["ink", "Preto suave"], ["main", "Cor principal da marca"]] as const).map(([v, nome]) => (
                    <button key={v} type="button" aria-pressed={d.txtL === v} onClick={() => set("txtL", v)} className={`min-h-12 rounded-full border-2 px-4 text-[15px] font-bold ${d.txtL === v ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}>{nome}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[14px] font-extrabold">Em fundos de cor</p>
                <div className="flex flex-wrap gap-2.5">
                  {([["white", "Branco"], ["off", "Off-white"], ["accent", "Cor secundária"]] as const).map(([v, nome]) => (
                    <button key={v} type="button" aria-pressed={d.txtD === v} onClick={() => set("txtD", v)} className={`min-h-12 rounded-full border-2 px-4 text-[15px] font-bold ${d.txtD === v ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}>{nome}</button>
                  ))}
                </div>
              </div>
            </div>
          </details>
          {msg && <p role="alert" className="rounded-[14px] bg-[#FFE3DD] px-4 py-3 text-[15px] font-bold text-[#8A1F0A]">{msg}</p>}
        </div>
      )}
    </>
  );
}

/* ---------------- Estilo do feed (conjunto) ---------------- */

export function PassoFeed({ d, set, travada, travaAte }: { d: DadosMarca; set: SetDados; travada: boolean; travaAte: string | null }) {
  return (
    <>
      <Titulo sub={travada ? undefined : "Cada tipo de post tem o seu visual dentro do conjunto. O feed alterna sem perder a identidade. Veja como fica com as suas cores."}>
        Como fica o seu feed
      </Titulo>
      {travada ? (
        <>
          <PreviaFeed d={d} />
          <AvisoTrava travaAte={travaAte} />
        </>
      ) : (
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Estilo do feed">
          {CONJUNTOS.map((c) => {
            const sel = d.conjunto === c.id;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={sel} onClick={() => set("conjunto", c.id)} className={cartao(sel)}>
                <span className="text-lg font-extrabold">{c.nome}</span>
                <span className="text-[14px] font-medium leading-snug text-[#4A4F6B]">{c.mean}</span>
                <span className="mt-1.5 w-full"><FaixaFeed d={d} conjuntoId={c.id} /></span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------------- Estilo de letra ---------------- */

export function PassoLetra({ d, set, travada, travaAte }: { d: DadosMarca; set: SetDados; travada: boolean; travaAte: string | null }) {
  return (
    <>
      <Titulo sub={travada ? undefined : "É a letra dos títulos nas suas artes. Escolha a que mais combina com o seu negócio."}>Qual letra combina com você?</Titulo>
      <PreviaFeed d={d} />
      {travada ? (
        <AvisoTrava travaAte={travaAte} />
      ) : (
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Estilo de letra">
          {FONTS.map((f) => {
            const sel = d.fonte === f.id;
            return (
              <button key={f.id} type="button" role="radio" aria-checked={sel} onClick={() => set("fonte", f.id)} className={cartao(sel)}>
                <span className="text-[28px] leading-tight" style={{ font: f.css, fontSize: "1.9rem" }}>{d.nome.trim() || "Seu negócio"}</span>
                <span className="text-[14px] font-medium leading-snug text-[#4A4F6B]">{f.nome}: {f.mean}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------------- Tom de voz e WhatsApp na bio ---------------- */

export function PassoTom({ d, set }: { d: DadosMarca; set: SetDados }) {
  return (
    <>
      <Titulo sub="É o jeito como as legendas dos seus posts falam com as suas clientes. Leia o exemplo e toque no que mais parece com você.">
        Como você fala com as suas clientes?
      </Titulo>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Tom de voz">
        {TONS.map((t) => {
          const sel = d.tom === t.id;
          return (
            <button key={t.id} type="button" role="radio" aria-checked={sel} onClick={() => set("tom", t.id)} className={cartao(sel)}>
              <span className="text-lg font-extrabold">{t.nome}</span>
              <span className="text-[14px] font-medium leading-snug text-[#4A4F6B]">{t.desc}</span>
              <span className="mt-1 rounded-[12px] bg-white/80 px-3 py-2 text-[14px] font-semibold italic leading-snug">&ldquo;{d.tipo === "barbearia" ? t.exemploBarb : t.exemplo}&rdquo;</span>
            </button>
          );
        })}
      </div>

      <section aria-labelledby="h-wa" className="flex flex-col gap-2.5 rounded-[22px] bg-white p-4">
        <h2 id="h-wa" className="text-xl font-extrabold leading-tight">Tem link do WhatsApp na bio do Instagram?</h2>
        <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
          Se tiver, os posts chamam a cliente para tocar no link da bio e falar com você no WhatsApp. Se não tiver, chamam para o direct.
        </p>
        <div className="flex gap-2.5">
          {([[true, "Sim, tenho"], [false, "Não tenho"]] as const).map(([v, nome]) => (
            <button key={nome} type="button" aria-pressed={d.waBio === v} onClick={() => set("waBio", v)} className={`min-h-12 flex-1 rounded-full border-2 px-4 text-[15px] font-bold ${d.waBio === v ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}>
              {nome}
            </button>
          ))}
        </div>
        {d.waBio && <CampoWhatsapp d={d} set={set} />}
      </section>
    </>
  );
}

function CampoWhatsapp({ d, set }: { d: DadosMarca; set: SetDados }) {
  const valido = normalizaWhatsapp(d.whatsapp);
  const pessoal = normalizaWhatsapp(d.telefone);
  const mesmo = !!pessoal && valido === pessoal;
  return (
    <div className="flex flex-col gap-2 pt-1">
      <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="m-whatsapp">
        Qual é o WhatsApp para agendamentos?
        <input
          id="m-whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          className={campo}
          value={d.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="DDD + número. Aparece nos posts de promoção"
          maxLength={40}
        />
      </label>
      {pessoal && (
        <label className="flex min-h-12 items-center gap-3 rounded-[14px] bg-[#F6F3EA] px-3 py-2 text-[15px] font-bold">
          <input
            type="checkbox"
            checked={mesmo}
            onChange={(e) => set("whatsapp", e.target.checked ? d.telefone : "")}
            className="h-6 w-6 flex-none accent-[#0E1330]"
          />
          É o mesmo número do meu telefone pessoal
        </label>
      )}
      {d.whatsapp.trim() === "" ? null : valido ? (
        <p className="text-[14px] font-bold text-[#2B4A00]">Número: {formataWhatsapp(valido)}. Está certo?</p>
      ) : (
        <p role="alert" className="text-[14px] font-bold text-[#8A1F0A]">Confira o número: use DDD e o telefone, por exemplo (11) 91234-5678.</p>
      )}
    </div>
  );
}
