"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pularDiferenciais, salvarDiferenciais, type Diferencial } from "./actions";

const campo =
  "min-h-14 w-full rounded-[16px] border-2 border-[#B9B29C] bg-white px-4 py-3 text-base font-semibold text-[#0E1330] placeholder:font-medium placeholder:text-[#8A8FA8] focus:border-[#0E1330] focus:outline-none";
const botaoPrimario =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C] disabled:text-[#F6F3EA]";
const botaoSecundario =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] border-2 border-[#0E1330] px-6 text-base font-extrabold text-[#0E1330] active:scale-[0.99]";

const MAX = 10;

const norm = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** O exemplo só aparece dentro da caixa do serviço escolhido, nunca na pergunta. */
const EXEMPLOS: [string, string][] = [
  ["coloracao", "Ex.: só uso tintas importadas. Escreva só o que é verdade."],
  ["tintura", "Ex.: só uso tintas importadas. Escreva só o que é verdade."],
  ["corte", "Ex.: corte pensado para o formato do rosto de cada cliente."],
  ["escova", "Ex.: produtos profissionais de uma marca específica."],
  ["progressiva", "Ex.: fórmula sem formol (só se for verdade e comprovado)."],
  ["manicure", "Ex.: esterilização do material a cada atendimento."],
  ["pedicure", "Ex.: esterilização do material a cada atendimento."],
  ["alongamento", "Ex.: material importado e manutenção no prazo combinado."],
  ["cilios", "Ex.: fios de qualidade profissional e mapeamento para cada olhar."],
  ["extensao", "Ex.: fios de qualidade profissional e mapeamento para cada olhar."],
  ["sobrancelha", "Ex.: design pensado para o formato do rosto."],
  ["maquiagem", "Ex.: produtos de longa duração e teste de maquiagem incluso."],
  ["barba", "Ex.: toalha quente e produtos próprios para a pele."],
  ["pilates", "Ex.: turmas pequenas e acompanhamento de perto."],
  ["limpeza", "Ex.: avaliação da pele antes de cada atendimento."],
];
function exemploDo(servico: string): string {
  const n = norm(servico);
  return EXEMPLOS.find(([chave]) => n.includes(chave))?.[1] ?? "Ex.: o que você faz de diferente neste serviço. Escreva só o que é verdade.";
}

export default function DiferenciaisForm({
  servicos,
  principais,
  inicial,
}: {
  servicos: string[];
  principais: string[];
  inicial: Diferencial[];
}) {
  const router = useRouter();
  const [quer, setQuer] = useState(inicial.length > 0);
  const [lista, setLista] = useState<Diferencial[]>(inicial);
  const [servico, setServico] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const adicionar = () => {
    if (!servico || !texto.trim() || lista.length >= MAX) return;
    setLista([...lista, { servico, texto: texto.trim().slice(0, 240) }]);
    setTexto("");
    setServico("");
  };

  const concluir = async () => {
    setSalvando(true);
    setErro("");
    // Se ela escreveu um diferencial e esqueceu de tocar em Adicionar, entra junto.
    const final = servico && texto.trim() ? [...lista, { servico, texto: texto.trim().slice(0, 240) }] : lista;
    const r = await salvarDiferenciais(final);
    if (r.ok) {
      router.push("/app");
      router.refresh();
    } else {
      setErro(r.erro);
      setSalvando(false);
    }
  };

  const pular = async () => {
    setSalvando(true);
    await pularDiferenciais();
    router.push("/app");
    router.refresh();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-10 pt-6 text-[#0E1330]">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4A4F6B]">Marca pronta · última pergunta</p>
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Você tem diferenciais em relação às concorrentes?</h1>
        <p className="text-base font-medium leading-snug text-[#4A4F6B]">
          Pensando nos serviços que você oferece, é importante contar o que você faz de diferente. Se tiver, toque em &ldquo;Sim&rdquo; e complete todos os diferenciais que você possui. Se não tiver, ou não lembrar agora, pode contar em outro momento, sem problema.
        </p>
      </div>

      {!quer ? (
        <div className="flex flex-col gap-3">
          <button type="button" className={botaoPrimario} onClick={() => setQuer(true)}>Sim, quero contar meus diferenciais</button>
          <button type="button" className={botaoSecundario} onClick={pular} disabled={salvando}>
            {salvando ? "Um instante..." : "Não tenho, ou conto depois"}
          </button>
          <p className="text-center text-[14px] font-medium text-[#4A4F6B]">Você pode voltar e completar quando quiser.</p>
        </div>
      ) : (
        <>
          {lista.length > 0 && (
            <ul className="flex flex-col gap-2.5" aria-label="Diferenciais adicionados">
              {lista.map((d, i) => (
                <li key={`${d.servico}-${i}`} className="flex items-start gap-3 rounded-[18px] border-2 border-[#0E1330] bg-white p-3.5">
                  <div className="flex-1">
                    <p className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#4A4F6B]">{d.servico}</p>
                    <p className="text-base font-bold leading-snug">{d.texto}</p>
                  </div>
                  <button type="button" onClick={() => setLista(lista.filter((_, j) => j !== i))} className="min-h-11 px-2 text-[15px] font-extrabold underline" aria-label={`Tirar o diferencial de ${d.servico}`}>
                    Tirar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {lista.length < MAX && (
            <section aria-labelledby="h-novo" className="flex flex-col gap-3 rounded-[22px] bg-white p-4">
              <h2 id="h-novo" className="text-xl font-extrabold leading-tight">{lista.length === 0 ? "Escolha o serviço e conte o diferencial" : "Adicionar mais um"}</h2>
              <div className="flex flex-wrap gap-2.5" role="group" aria-label="Serviço do diferencial">
                {servicos.map((s) => {
                  const sel = servico === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setServico(sel ? "" : s)}
                      className={`min-h-12 rounded-full border-2 px-4 text-[15px] font-bold active:scale-[0.98] ${sel ? "border-[#0E1330] bg-[#0E1330] text-white" : "border-[#B9B29C] bg-[#F6F3EA]"}`}
                    >
                      {principais.includes(s) ? "★ " : ""}{s}
                    </button>
                  );
                })}
              </div>
              <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="dif-texto">
                O seu diferencial
                <textarea
                  id="dif-texto"
                  rows={3}
                  maxLength={240}
                  className={campo}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={servico ? exemploDo(servico) : "Toque em um serviço acima para ver um exemplo."}
                />
              </label>
              <button type="button" className={botaoSecundario} onClick={adicionar} disabled={!servico || !texto.trim()}>
                Adicionar este diferencial
              </button>
            </section>
          )}

          {erro && <p role="alert" className="rounded-[14px] bg-[#FFE3DD] px-4 py-3 text-[15px] font-bold text-[#8A1F0A]">{erro}</p>}

          <button type="button" className={botaoPrimario} onClick={concluir} disabled={salvando || (lista.length === 0 && !(servico && texto.trim()))}>
            {salvando ? "Salvando..." : "Salvar e ir para os meus posts"}
          </button>
          <button type="button" className="min-h-12 text-center text-[15px] font-extrabold underline" onClick={pular} disabled={salvando}>
            Pular esta etapa
          </button>
        </>
      )}
    </div>
  );
}
