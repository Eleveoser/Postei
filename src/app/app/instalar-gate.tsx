"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

// Antes de seguir, a cliente instala o Postei na tela inicial do celular.
// Só vale para celular aberto no navegador: computador e app já instalado passam direto.
// Custo: nenhuma chamada externa, nenhum dado novo guardado (só um aviso local de "continuar hoje").

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Aparelho = "iphone" | "android" | "outro";

const CHAVE_PULAR = "postei_pular_instalacao";
const LIVRES = ["/app/gestao", "/auth", "/api", "/redefinir-senha", "/esqueci-senha", "/cadastro/confirmar"];
const UM_DIA = 24 * 60 * 60 * 1000;

function jaInstalado(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function aparelhoDe(): Aparelho {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iphone";
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "iphone"; // iPad novo se apresenta como Mac
  if (/Android/i.test(ua)) return "android";
  return "outro";
}

// Instagram, WhatsApp, Facebook e similares abrem o link num navegador interno que não instala apps.
const navegadorInterno = () => /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|Snapchat|WhatsApp/i.test(navigator.userAgent);
const safariIos = () => /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(navigator.userAgent);

// Lê o ambiente do aparelho uma vez, de forma estável (texto), sem estado em efeito.
function lerAmbiente(): string {
  if (typeof window === "undefined") return "ssr";
  return [aparelhoDe(), navegadorInterno() ? 1 : 0, safariIos() ? 1 : 0, jaInstalado() ? 1 : 0, pularHoje() ? 1 : 0].join("|");
}
const semAssinatura = () => () => {};

function pularHoje(): boolean {
  try {
    const t = Number(localStorage.getItem(CHAVE_PULAR) || 0);
    return t > 0 && Date.now() - t < UM_DIA;
  } catch {
    return false;
  }
}

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[36px_1fr] items-start gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E1330] text-sm font-extrabold text-[#F6F3EA]">{n}</span>
      <span className="pt-1 text-[15px] font-medium leading-snug">{children}</span>
    </li>
  );
}

const IconeCompartilhar = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-1 inline h-5 w-5 align-text-bottom" fill="none" stroke="#0E1330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
const IconeMais = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-1 inline h-5 w-5 align-text-bottom" fill="none" stroke="#0E1330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" />
  </svg>
);

export default function InstalarGate({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const amb = useSyncExternalStore(semAssinatura, lerAmbiente, () => "ssr");
  const [dispensado, setDispensado] = useState(false);
  const [instalou, setInstalou] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const evento = useRef<EventoInstalar | null>(null);
  const [temBotao, setTemBotao] = useState(false);

  const [ap, ehInterno, ehSafari, instalado, pulou] = amb.split("|");
  const decidido = amb !== "ssr";
  const aparelho = ap as Aparelho;
  const interno = ehInterno === "1";
  const safari = ehSafari === "1";
  const mostrar = decidido && aparelho !== "outro" && instalado === "0" && pulou === "0" && !dispensado;

  useEffect(() => {
    const antes = (e: Event) => {
      e.preventDefault();
      evento.current = e as EventoInstalar;
      setTemBotao(true);
    };
    const depois = () => setInstalou(true);
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", depois);
    return () => {
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", depois);
    };
  }, []);

  // nunca bloqueia: painel da administradora, links de e-mail (confirmar cadastro, redefinir senha) e rotas internas
  const liberado = LIVRES.some((p) => caminho?.startsWith(p));

  async function instalarAgora() {
    const e = evento.current;
    if (!e) return;
    await e.prompt();
    const r = await e.userChoice;
    if (r.outcome === "accepted") setInstalou(true);
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/app");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem permissão: a pessoa copia na mão */
    }
  }

  function continuarHoje() {
    try {
      localStorage.setItem(CHAVE_PULAR, String(Date.now()));
    } catch {
      /* sem armazenamento: libera só nesta visita */
    }
    setDispensado(true);
  }

  return (
    <>
      <div className={decidido ? undefined : "invisible"}>{children}</div>
      {decidido && mostrar && !liberado && (
        <div role="dialog" aria-modal="true" aria-labelledby="instalar-titulo" className="fixed inset-0 z-50 overflow-y-auto bg-[#F6F3EA] text-[#0E1330]">
          <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-5 pb-10 pt-12">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icone-192.png" alt="" width={56} height={56} className="h-14 w-14 rounded-[14px]" />
              <span className="text-xs font-bold tracking-[0.14em] text-[#4A4F6B]">POSTEI</span>
            </div>
            <h1 id="instalar-titulo" className="text-3xl font-extrabold leading-[1.1] tracking-[-0.02em]">
              Instale o Postei no seu celular
            </h1>
            <p className="text-[15px] font-medium leading-snug text-[#4A4F6B]">
              É rápido e sem loja. Ele vira um ícone na tela inicial e abre como um app, sempre com a sua programação pronta.
            </p>

            {instalou ? (
              <div className="rounded-[18px] border-2 border-[#0E1330] bg-[#C8FF2E] p-4 text-[15px] font-bold leading-snug">
                Instalado. Agora abra o Postei pelo <u>ícone na tela inicial</u> e entre com o seu e-mail e a sua senha.
              </div>
            ) : interno ? (
              <div className="flex flex-col gap-3 rounded-[18px] border border-[#D9D3C0] bg-white p-4">
                <p className="text-[15px] font-bold leading-snug">
                  Você abriu o link dentro de outro aplicativo, e ele não deixa instalar.
                </p>
                <ol className="flex flex-col gap-3">
                  <Passo n={1}>Toque nos <b>três pontinhos</b> (ou no ícone de compartilhar) do canto.</Passo>
                  <Passo n={2}>Escolha <b>Abrir no navegador</b> ({aparelho === "iphone" ? "Safari" : "Chrome"}).</Passo>
                  <Passo n={3}>Lá, siga o passo a passo de instalação.</Passo>
                </ol>
                <button type="button" onClick={copiarLink} className="min-h-12 rounded-full bg-[#0E1330] text-[15px] font-extrabold text-[#F6F3EA]">
                  {copiado ? "Link copiado" : "Copiar o link e abrir no navegador"}
                </button>
              </div>
            ) : aparelho === "iphone" ? (
              <div className="flex flex-col gap-4 rounded-[18px] border border-[#D9D3C0] bg-white p-4">
                {!safari && (
                  <p className="rounded-[12px] bg-[#FFE9C7] px-3 py-2 text-sm font-semibold text-[#5A3200]">
                    Se não achar a opção abaixo, abra este endereço no <b>Safari</b>.
                  </p>
                )}
                <ol className="flex flex-col gap-4">
                  <Passo n={1}>Toque no botão de compartilhar <IconeCompartilhar /> (na barra de baixo ou no topo).</Passo>
                  <Passo n={2}>Role a lista e toque em <b>Adicionar à Tela de Início</b> <IconeMais />.</Passo>
                  <Passo n={3}>Toque em <b>Adicionar</b>, no canto de cima.</Passo>
                  <Passo n={4}>Feche o navegador e abra o <b>Postei pelo ícone</b>. Você entra de novo com e-mail e senha.</Passo>
                </ol>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-[18px] border border-[#D9D3C0] bg-white p-4">
                {temBotao && (
                  <button type="button" onClick={instalarAgora} className="min-h-14 rounded-full bg-[#C8FF2E] text-base font-extrabold shadow-[inset_0_0_0_2px_#0E1330]">
                    Instalar agora
                  </button>
                )}
                <p className="text-sm font-semibold text-[#4A4F6B]">{temBotao ? "Se o botão não funcionar, faça assim:" : "Faça assim:"}</p>
                <ol className="flex flex-col gap-4">
                  <Passo n={1}>Toque nos <b>três pontinhos</b> do canto do Chrome.</Passo>
                  <Passo n={2}>Toque em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</Passo>
                  <Passo n={3}>Confirme, depois abra o <b>Postei pelo ícone</b> e entre com e-mail e senha.</Passo>
                </ol>
              </div>
            )}

            <p className="rounded-[14px] bg-white px-3 py-2 text-sm font-medium text-[#4A4F6B]">
              <b>Já instalou?</b> Feche o navegador e abra o Postei pelo <b>ícone na tela inicial</b>.
            </p>

            <div className="mt-auto flex flex-col gap-2 pt-2">
              {!ajuda ? (
                <button type="button" onClick={() => setAjuda(true)} className="min-h-11 self-start text-sm font-semibold text-[#4A4F6B] underline">
                  Estou com dificuldade para instalar
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-[14px] bg-white p-3 text-sm">
                  <p className="font-medium text-[#4A4F6B]">
                    Sem problema. Você pode usar o Postei pelo navegador por hoje, e a gente te lembra de instalar depois.
                  </p>
                  <button type="button" onClick={continuarHoje} className="min-h-11 rounded-full border-2 border-[#0E1330] font-extrabold">
                    Continuar no navegador por hoje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
