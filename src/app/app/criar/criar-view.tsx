"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fontsReady, H, render, W, type Brand } from "@/lib/art-engine";
import { registrarPostProprio } from "../actions";

type Props = {
  marca: Omit<Brand, "logo" | "fundo">;
  logoUrl: string | null;
  fundoUrl: string | null;
  servicos: string[];
};

type Modelo = "oferta" | "pacote" | "fotoInteira" | "fotoPremium" | "antesDepois" | "meuPost";
type Item = { nome: string; valor: string };

const MODELOS: { id: Modelo; nome: string; desc: string }[] = [
  { id: "oferta", nome: "Promoção", desc: "Um serviço com preço normal, preço promocional e validade" },
  { id: "pacote", nome: "Pacote ou combo", desc: "Vários serviços ou sessões com o valor do pacote em destaque" },
  { id: "fotoInteira", nome: "Foto inteira", desc: "A sua foto ocupa o post e o título vai embaixo" },
  { id: "fotoPremium", nome: "Foto com moldura", desc: "Foto grande com moldura discreta" },
  { id: "antesDepois", nome: "Antes e depois", desc: "Duas fotos lado a lado" },
  { id: "meuPost", nome: "Só texto", desc: "Título e texto, com foto no alto se quiser" },
];

const botao =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#0E1330] px-6 text-base font-extrabold text-[#C8FF2E] transition active:scale-[0.99] disabled:bg-[#B9B29C] disabled:text-white";
const botaoSec =
  "flex min-h-14 w-full items-center justify-center rounded-[18px] border-2 border-[#0E1330] bg-white px-6 text-base font-extrabold text-[#0E1330] active:scale-[0.99] disabled:border-[#B9B29C] disabled:text-[#B9B29C]";
const campo =
  "min-h-12 w-full rounded-[14px] border border-[#B9B29C] bg-white px-3.5 text-[15px] font-semibold text-[#0E1330] focus:border-2 focus:border-[#0E1330] focus:outline-none";
const rotuloCampo = "text-sm font-medium text-[#4A4F6B]";

// valores em reais: "145", "145,50" ou "R$ 145,50" viram número; o inverso devolve "R$ 145" ou "R$ 145,50"
const num = (t: string) => parseFloat(t.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
const moeda = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const hojeISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const dataCurta = (iso: string) => (iso ? iso.split("-").reverse().slice(0, 2).join("/") : "");

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

/** Foto escolhida no celular: vira imagem para a arte sem sair do aparelho (nada é enviado). */
function lerFoto(file: File): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = erro;
    i.src = URL.createObjectURL(file);
  });
}

export default function CriarView({ marca, logoUrl, fundoUrl, servicos }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [modelo, setModelo] = useState<Modelo>("oferta");
  const [titulo, setTitulo] = useState("");
  const [tag, setTag] = useState("");
  const [texto, setTexto] = useState("");
  const [legenda, setLegenda] = useState("");
  const [img1, setImg1] = useState<HTMLImageElement | null>(null);
  const [img2, setImg2] = useState<HTMLImageElement | null>(null);
  // promoção e pacote
  const [precoNormal, setPrecoNormal] = useState("");
  const [precoPromo, setPrecoPromo] = useState("");
  const [validade, setValidade] = useState("");
  const [chamada, setChamada] = useState("");
  const [rotulo, setRotulo] = useState<"PACOTE" | "COMBO">("PACOTE");
  const [itens, setItens] = useState<Item[]>([{ nome: "", valor: "" }]);
  const [cabe, setCabe] = useState(true);
  const [aviso, setAviso] = useState("");
  const [feito, setFeito] = useState(false);
  const [, startTransition] = useTransition();

  const ehOferta = modelo === "oferta";
  const ehPacote = modelo === "pacote";
  const ehTexto = modelo === "meuPost";
  const ehFoto = !ehOferta && !ehPacote && !ehTexto;
  const duasFotos = modelo === "antesDepois";

  const itensValidos = itens.filter((i) => i.nome.trim() && num(i.valor) > 0);
  const soma = itensValidos.reduce((a, i) => a + num(i.valor), 0);
  const normal = ehPacote ? soma : num(precoNormal);
  const promo = num(precoPromo);
  const hoje = hojeISO();

  // o que falta para liberar a arte (vazio = pronto)
  const motivo = (() => {
    if (titulo.trim() === "") return ehPacote ? "Escreva o nome do pacote." : ehOferta ? "Escolha ou escreva o serviço." : "Escreva o título.";
    if (ehFoto && !(duasFotos ? img1 && img2 : img1)) return "Escolha a foto para liberar a arte.";
    if (ehOferta || ehPacote) {
      if (ehPacote && itensValidos.length === 0) return "Coloque pelo menos um item com o valor.";
      if (ehOferta && !(normal > 0)) return "Coloque o preço normal.";
      if (!(promo > 0)) return ehPacote ? "Coloque o valor do pacote." : "Coloque o preço promocional.";
      if (promo >= normal) return ehPacote ? "O valor do pacote precisa ser menor que o total dos itens." : "O preço promocional precisa ser menor que o preço normal.";
      if (!validade) return "Coloque até quando a promoção vale.";
      if (validade < hoje) return "A data de validade já passou.";
    }
    if (!cabe) return ehPacote ? "Tem coisa demais para caber na arte. Tire um item ou encurte o texto livre." : "Encurte o texto para a arte caber.";
    return "";
  })();
  const pronto = motivo === "";

  // desenha a arte no próprio aparelho sempre que algo muda
  useEffect(() => {
    let vivo = true;
    Promise.all([fontsReady, carregar(logoUrl), carregar(fundoUrl)]).then(([, logo, fundo]) => {
      if (!vivo || !canvas.current) return;
      const dados: Record<string, unknown> =
        modelo === "oferta"
          ? {
              servico: titulo.trim() || "O serviço aparece aqui",
              rotulo: "PROMOÇÃO",
              precoDe: normal > 0 ? moeda(normal) : "",
              preco: promo > 0 ? moeda(promo) : "",
              prazo: dataCurta(validade),
              chamada,
            }
          : modelo === "pacote"
            ? {
                titulo: titulo.trim() || "O nome do pacote aparece aqui",
                rotulo,
                itens: itensValidos.map((i) => ({ nome: i.nome.trim(), valor: moeda(num(i.valor)) })),
                precoDe: soma > 0 ? moeda(soma) : "",
                preco: promo > 0 ? moeda(promo) : "",
                prazo: dataCurta(validade),
                chamada,
              }
            : { titulo: titulo.trim() || "O seu título aparece aqui", tag, texto, img1, img2 };
      render(canvas.current, modelo, { ...marca, logo, fundo }, dados);
      setCabe(dados.cabe !== false);
    });
    return () => {
      vivo = false;
    };
    // itensValidos é recalculado a cada passada; as dependências abaixo cobrem tudo o que muda a arte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo, titulo, tag, texto, img1, img2, marca, logoUrl, fundoUrl, precoNormal, precoPromo, validade, chamada, rotulo, JSON.stringify(itens)]);

  const mostrar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(""), 2600);
  };

  const escolherServico = (s: string) => {
    if (ehPacote) {
      // no pacote, tocar num serviço acrescenta uma linha com o nome dele
      setItens((l) => {
        const vazia = l.findIndex((i) => !i.nome.trim());
        if (vazia >= 0) return l.map((i, k) => (k === vazia ? { ...i, nome: s } : i));
        return l.length < 4 ? [...l, { nome: s, valor: "" }] : l;
      });
      return;
    }
    setTitulo(s);
  };

  const mudarItem = (k: number, campoItem: keyof Item, v: string) =>
    setItens((l) => l.map((i, n) => (n === k ? { ...i, [campoItem]: v } : i)));

  const escolherFoto = async (qual: 1 | 2, file: File | undefined) => {
    if (!file) return;
    try {
      const img = await lerFoto(file);
      if (qual === 1) setImg1(img);
      else setImg2(img);
    } catch {
      mostrar("Não consegui abrir essa foto. Tente outra.");
    }
  };

  const baixar = () => {
    canvas.current?.toBlob(async (b) => {
      if (!b) return;
      const arquivo = new File([b], "meu-post.png", { type: "image/png" });
      startTransition(() => void registrarPostProprio("baixou_arte", modelo));
      try {
        if (navigator.canShare?.({ files: [arquivo] })) {
          await navigator.share({ files: [arquivo] });
          mostrar("Arte pronta. Escolha o Instagram ou salve na galeria.");
          return;
        }
      } catch {
        // cancelou ou não suportado: segue para o download simples
      }
      const url = URL.createObjectURL(arquivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.name;
      a.click();
      URL.revokeObjectURL(url);
      mostrar("Arte salva no seu aparelho.");
    }, "image/png");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
      mostrar("Legenda copiada. Agora é só colar no Instagram.");
    } catch {
      mostrar("Não consegui copiar sozinho: toque e segure no texto para copiar.");
    }
    startTransition(() => void registrarPostProprio("copiou_legenda", modelo));
  };

  const jaPostei = () => {
    setFeito(true);
    startTransition(() => void registrarPostProprio("post_publicado", modelo));
    mostrar("Anotado. Bom post!");
  };

  const seletorFoto = (qual: 1 | 2, rotuloBotao: string, img: HTMLImageElement | null) => (
    <label className={`${img ? botaoSec : botao} cursor-pointer`}>
      {img ? `Trocar ${rotuloBotao.toLowerCase()}` : rotuloBotao}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => void escolherFoto(qual, e.target.files?.[0])} />
    </label>
  );

  const percentual = normal > 0 && promo > 0 && promo < normal ? Math.round((1 - promo / normal) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="c-modelo" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-modelo" className="text-lg font-extrabold">1. O que você quer criar?</h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Modelo do post">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={modelo === m.id}
              onClick={() => setModelo(m.id)}
              className={`flex min-h-[88px] flex-col items-start gap-1 rounded-[14px] p-3 text-left ${
                modelo === m.id ? "bg-[#C8FF2E] shadow-[inset_0_0_0_2px_#0E1330]" : "bg-[#F6F3EA] shadow-[inset_0_0_0_1px_#B9B29C]"
              }`}
            >
              <span className="text-[15px] font-extrabold">{m.nome}</span>
              <span className="text-xs font-medium leading-snug text-[#4A4F6B]">{m.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="c-assunto" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-assunto" className="text-lg font-extrabold">2. {ehPacote ? "Que serviços entram?" : "Sobre o quê?"}</h2>
        {servicos.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Seus serviços">
            {servicos.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => escolherServico(s)}
                aria-pressed={!ehPacote && titulo === s}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                  !ehPacote && titulo === s ? "bg-[#C8FF2E] shadow-[inset_0_0_0_2px_#0E1330]" : "bg-[#F6F3EA] shadow-[inset_0_0_0_1px_#B9B29C]"
                }`}
              >
                {ehPacote ? `+ ${s}` : s}
              </button>
            ))}
          </div>
        )}
        <label htmlFor="c-titulo" className={`mt-1 ${rotuloCampo}`}>
          {ehPacote ? "Nome do pacote" : ehOferta ? "Serviço em promoção" : "Título do post (é o que aparece na arte)"}
        </label>
        <input
          id="c-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={90}
          className={campo}
          placeholder={ehPacote ? "Ex.: Pacote de manicure mensal" : ehOferta ? "Ex.: Design com henna" : "Ex.: Lash lifting"}
        />
      </section>

      <section aria-labelledby="c-conteudo" className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
        <h2 id="c-conteudo" className="text-lg font-extrabold">
          3. {ehOferta ? "Preços e validade" : ehPacote ? "Itens, valores e validade" : ehTexto ? "O seu texto" : duasFotos ? "As suas fotos" : "A sua foto"}
        </h2>

        {ehPacote && (
          <>
            <div className="flex gap-2" role="radiogroup" aria-label="Pacote ou combo">
              {(["PACOTE", "COMBO"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={rotulo === r}
                  onClick={() => setRotulo(r)}
                  className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold ${
                    rotulo === r ? "bg-[#C8FF2E] shadow-[inset_0_0_0_2px_#0E1330]" : "bg-[#F6F3EA] shadow-[inset_0_0_0_1px_#B9B29C]"
                  }`}
                >
                  {r === "PACOTE" ? "Pacote (várias sessões)" : "Combo (serviços juntos)"}
                </button>
              ))}
            </div>
            <p className={rotuloCampo}>Cada item com o seu valor individual (ex.: 4 manicures = R$ 160)</p>
            {itens.map((it, k) => (
              <div key={k} className="grid grid-cols-[1fr_110px_44px] items-center gap-2">
                <input
                  value={it.nome}
                  onChange={(e) => mudarItem(k, "nome", e.target.value)}
                  maxLength={40}
                  aria-label={`Item ${k + 1}`}
                  className={campo}
                  placeholder={k === 0 ? "Ex.: Manicure (4 sessões)" : "Item"}
                />
                <input
                  value={it.valor}
                  onChange={(e) => mudarItem(k, "valor", e.target.value)}
                  inputMode="decimal"
                  aria-label={`Valor do item ${k + 1}, em reais`}
                  className={campo}
                  placeholder="R$ 0"
                />
                <button
                  type="button"
                  onClick={() => setItens((l) => (l.length > 1 ? l.filter((_, n) => n !== k) : [{ nome: "", valor: "" }]))}
                  aria-label={`Tirar o item ${k + 1}`}
                  className="flex h-12 w-11 items-center justify-center rounded-[14px] border border-[#B9B29C] text-lg font-bold"
                >
                  ×
                </button>
              </div>
            ))}
            {itens.length < 4 && (
              <button type="button" onClick={() => setItens((l) => [...l, { nome: "", valor: "" }])} className="min-h-11 self-start text-sm font-extrabold underline">
                Adicionar item
              </button>
            )}
            <div className="flex items-center justify-between rounded-[14px] bg-[#F6F3EA] px-3.5 py-3 text-[15px] font-bold">
              <span>Valor total dos itens</span>
              <span>{soma > 0 ? moeda(soma) : "R$ 0"}</span>
            </div>
          </>
        )}

        {ehOferta && (
          <>
            <label htmlFor="c-normal" className={rotuloCampo}>Preço normal (em reais)</label>
            <input id="c-normal" value={precoNormal} onChange={(e) => setPrecoNormal(e.target.value)} inputMode="decimal" className={campo} placeholder="Ex.: 60" />
          </>
        )}

        {(ehOferta || ehPacote) && (
          <>
            <label htmlFor="c-promo" className={rotuloCampo}>{ehPacote ? "Valor do pacote (em destaque)" : "Preço promocional (em destaque)"}</label>
            <input id="c-promo" value={precoPromo} onChange={(e) => setPrecoPromo(e.target.value)} inputMode="decimal" className={campo} placeholder={ehPacote ? "Ex.: 145" : "Ex.: 45"} />
            {percentual > 0 && <p className="text-sm font-bold">Desconto de {percentual}%, que aparece na arte.</p>}
            <label htmlFor="c-validade" className={rotuloCampo}>Válida até</label>
            <input id="c-validade" type="date" min={hoje} value={validade} onChange={(e) => setValidade(e.target.value)} className={campo} />
            <label htmlFor="c-chamada" className={rotuloCampo}>Texto livre (opcional)</label>
            <textarea
              id="c-chamada"
              value={chamada}
              onChange={(e) => setChamada(e.target.value)}
              maxLength={200}
              rows={3}
              className={`${campo} py-3`}
              placeholder="Escreva o que quiser que apareça na arte. Ex.: Agende pelo direct. Vagas limitadas."
            />
          </>
        )}

        {ehTexto && (
          <>
            <label htmlFor="c-tag" className={rotuloCampo}>Etiqueta (opcional)</label>
            <input id="c-tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={22} className={campo} placeholder="Ex.: AVISO, NOVIDADE, DICA" />
            <label htmlFor="c-texto" className={rotuloCampo}>Texto da arte</label>
            <textarea id="c-texto" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={700} rows={6} className={`${campo} py-3`} placeholder="Escreva o texto do post. Use Enter para separar os parágrafos." />
            {seletorFoto(1, "Adicionar uma foto (opcional)", img1)}
          </>
        )}

        {ehFoto && (
          <>
            {seletorFoto(1, duasFotos ? "Foto do antes" : "Escolher a foto", img1)}
            {duasFotos && seletorFoto(2, "Foto do depois", img2)}
            <p className="text-xs font-medium text-[#4A4F6B]">Toque e escolha: tirar a foto agora ou pegar da galeria. A foto não sai do seu celular.</p>
          </>
        )}

        {!cabe && !ehFoto && (
          <p className="rounded-[12px] bg-[#FFE9C7] px-3 py-2 text-sm font-semibold text-[#5A3200]">
            Não coube tudo na arte. Nada é cortado sozinho: encurte o texto livre ou tire um item.
          </p>
        )}
      </section>

      <section aria-labelledby="c-previa" className="flex flex-col gap-3">
        <h2 id="c-previa" className="text-lg font-extrabold">A sua arte</h2>
        <canvas
          ref={canvas}
          width={W}
          height={H}
          role="img"
          aria-label="Prévia da arte do seu post"
          className="h-auto w-full rounded-[18px] border border-[#D9D3C0] bg-white"
        />
        <button type="button" onClick={baixar} disabled={!pronto} className={botao}>
          Baixar a arte
        </button>
        {!pronto && <p className="text-xs font-medium text-[#4A4F6B]">{motivo}</p>}
      </section>

      <section aria-labelledby="c-legenda" className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
        <h2 id="c-legenda" className="text-lg font-extrabold">Legenda</h2>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          maxLength={2200}
          rows={7}
          aria-label="Legenda do post"
          className={`${campo} py-3`}
          placeholder="Escreva aqui a legenda do seu post. Pode deixar em branco e escrever direto no Instagram."
        />
        <button type="button" onClick={copiar} disabled={legenda.trim() === ""} className={botaoSec}>
          Copiar a legenda
        </button>
      </section>

      <button type="button" onClick={jaPostei} disabled={feito || !pronto} className={botaoSec}>
        {feito ? "Anotado como postado" : "Já postei"}
      </button>

      {aviso && (
        <div role="status" className="fixed inset-x-5 bottom-6 z-40 mx-auto max-w-md rounded-[16px] bg-[#0E1330] px-4 py-3 text-center text-sm font-bold text-[#C8FF2E]">
          {aviso}
        </div>
      )}
    </div>
  );
}
