"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fontsReady, render, type Brand } from "@/lib/art-engine";
import { salvarApresentacao, type Profissional } from "./actions";
import EquipeEditor from "./equipe";

type Props = {
  userId: string;
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  nome: string;
  canal: string;
  servicos: { nome: string; principal: boolean }[];
  inicial: { horarios: [string, string][]; historia: string; equipe: Profissional[] };
};

const botao =
  "flex min-h-12 w-full items-center justify-center rounded-[16px] bg-[#0E1330] px-4 text-[15px] font-extrabold text-[#C8FF2E] active:scale-[0.99] disabled:bg-[#B9B29C]";
const campo =
  "min-h-12 w-full rounded-[14px] border-2 border-[#B9B29C] bg-white px-3.5 text-[15px] font-semibold focus:border-[#0E1330] focus:outline-none";

function carregar(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((ok) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = url;
  });
}

function Arte({ marca, logoUrl, tpl, dados }: { marca: Props["marca"]; logoUrl: string | null; tpl: string; dados: Record<string, unknown> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(() => {
      Promise.all([fontsReady, carregar(logoUrl)]).then(([, logo]) => {
        if (vivo && ref.current) render(ref.current, tpl, { ...marca, logo, fundo: null }, dados);
      });
    }, 120);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [marca, logoUrl, tpl, dados]);
  return <canvas ref={ref} width={1080} height={1350} role="img" aria-label="Prévia do post" className="aspect-[4/5] w-full rounded-[14px] border border-[#D9D3C0] bg-white" />;
}

function Acoes({ canvasId, legenda, ok }: { canvasId: string; legenda: string; ok: boolean }) {
  const [aviso, setAviso] = useState("");
  const baixar = () => {
    const c = document.getElementById(canvasId)?.querySelector("canvas") as HTMLCanvasElement | null;
    c?.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${canvasId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
      setAviso("Legenda copiada.");
    } catch {
      setAviso("Toque e segure no texto para copiar.");
    }
    window.setTimeout(() => setAviso(""), 2200);
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={botao} onClick={baixar} disabled={!ok}>Salvar a arte</button>
        <button type="button" className={botao} onClick={() => void copiar()}>Copiar a legenda</button>
      </div>
      <p className="whitespace-pre-line text-[14px] font-medium leading-snug text-[#4A4F6B]">{legenda}</p>
      {aviso && <p role="status" className="text-[14px] font-bold text-[#2B4A00]">{aviso}</p>}
    </>
  );
}

const Bloco = ({ id, titulo, sub, children }: { id: string; titulo: string; sub: string; children: React.ReactNode }) => (
  <section aria-labelledby={`h-${id}`} id={id} className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
    <div>
      <h2 id={`h-${id}`} className="text-xl font-extrabold leading-tight">{titulo}</h2>
      <p className="text-[14px] font-medium leading-snug text-[#4A4F6B]">{sub}</p>
    </div>
    {children}
  </section>
);

export default function PostsBase({ userId, marca, logoUrl, nome, canal, servicos, inicial }: Props) {
  const [equipe, setEquipe] = useState<Profissional[]>(inicial.equipe);
  const [horarios, setHorarios] = useState<[string, string][]>(
    inicial.horarios.length ? inicial.horarios : [["Seg a Sex", "9h às 19h"], ["Sábado", "9h às 17h"], ["Domingo", "Fechado"]],
  );
  const [historia, setHistoria] = useState(inicial.historia);
  const [salvo, setSalvo] = useState("");
  const [, startTransition] = useTransition();

  const itensServ = useMemo(
    () => [...servicos].sort((a, b) => Number(b.principal) - Number(a.principal)).slice(0, 6).map((s) => ({ nome: s.nome })),
    [servicos],
  );
  const dadosServ = useMemo(() => ({ titulo: "Nossos serviços", itens: itensServ }), [itensServ]);
  const dadosHor = useMemo(() => ({ titulo: "Horário de atendimento", linhas: horarios.filter(([d, h]) => d.trim() && h.trim()), extra: canal }), [horarios, canal]);
  const dadosHist = useMemo(() => ({ titulo: "Nossa história", texto: historia || "Conte aqui como o seu negócio começou." }), [historia]);

  const salvar = () =>
    startTransition(async () => {
      const r = await salvarApresentacao({ horarios, historia, equipe });
      setSalvo(r.ok ? "Salvo. Da próxima vez a equipe, os horários e a história já ficam aqui." : "Não consegui salvar agora. Confira se o SQL 0008 foi rodado.");
      window.setTimeout(() => setSalvo(""), 3000);
    });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Posts de apresentação</h2>
      <p className="-mt-2 text-[15px] font-medium leading-snug text-[#4A4F6B]">Quatro posts que todo perfil precisa ter. Poste uma vez e deixe no feed.</p>

      <Bloco id="base-servicos" titulo="Nossos serviços" sub="Montado sozinho com os serviços do seu cadastro, os principais primeiro.">
        <div id="base-servicos-arte"><Arte marca={marca} logoUrl={logoUrl} tpl="servicos" dados={dadosServ} /></div>
        <Acoes canvasId="base-servicos-arte" ok={itensServ.length > 0} legenda={`Conheça os nossos serviços na ${nome || "nossa casa"}.\n\n${itensServ.map((s) => `• ${s.nome}`).join("\n")}\n\nChama a gente ${canal} para agendar.`} />
      </Bloco>

      <Bloco id="base-equipe" titulo="Nossa equipe" sub="Um carrossel que apresenta cada profissional: foto e as informações que você escolher mostrar.">
        <EquipeEditor
          userId={userId}
          marca={marca}
          logoUrl={logoUrl}
          nomeNegocio={nome}
          servicosNegocio={servicos.map((x) => x.nome)}
          profissionais={equipe}
          onChange={setEquipe}
        />
      </Bloco>

      <Bloco id="base-horarios" titulo="Horário de atendimento" sub="Preencha os seus horários. Eles ficam salvos.">
        <div className="flex flex-col gap-2">
          {horarios.map(([d, h], i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input aria-label={`Dia ${i + 1}`} className={campo} value={d} maxLength={24} placeholder="Ex.: Seg a Sex" onChange={(e) => setHorarios((l) => l.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
              <input aria-label={`Horário ${i + 1}`} className={campo} value={h} maxLength={28} placeholder="Ex.: 9h às 19h" onChange={(e) => setHorarios((l) => l.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} />
            </div>
          ))}
          {horarios.length < 7 && (
            <button type="button" onClick={() => setHorarios((l) => [...l, ["", ""]])} className="min-h-11 text-[15px] font-extrabold underline">
              Adicionar uma linha
            </button>
          )}
        </div>
        <div id="base-horarios-arte"><Arte marca={marca} logoUrl={logoUrl} tpl="horarios" dados={dadosHor} /></div>
        <Acoes canvasId="base-horarios-arte" ok legenda={`Nossos horários de atendimento:\n\n${horarios.filter(([d, h]) => d.trim() && h.trim()).map(([d, h]) => `${d}: ${h}`).join("\n")}\n\nAgende ${canal}.`} />
      </Bloco>

      <Bloco id="base-historia" titulo="Nossa história" sub="Conte em poucas linhas como tudo começou (até 420 letras). Escreva só o que é verdade.">
        <textarea aria-label="Nossa história" rows={5} maxLength={420} value={historia} onChange={(e) => setHistoria(e.target.value)} className="w-full rounded-[14px] border-2 border-[#B9B29C] bg-white px-3.5 py-3 text-[15px] font-medium leading-relaxed focus:border-[#0E1330] focus:outline-none" placeholder="Ex.: Nascemos em 2018, com a vontade de cuidar das pessoas do bairro..." />
        <div id="base-historia-arte"><Arte marca={marca} logoUrl={logoUrl} tpl="historia" dados={dadosHist} /></div>
        <Acoes canvasId="base-historia-arte" ok={historia.trim().length > 0} legenda={`${historia.trim() || "Conte aqui a história do seu negócio."}\n\nObrigado por fazer parte dela.`} />
      </Bloco>

      <button type="button" onClick={salvar} className={botao}>Salvar equipe, horários e história</button>
      {salvo && <p role="status" className="rounded-[14px] bg-[#E6F6C8] px-4 py-3 text-[15px] font-bold text-[#2B4A00]">{salvo}</p>}
    </div>
  );
}
