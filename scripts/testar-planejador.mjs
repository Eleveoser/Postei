// Teste do planejador, sem dependências: node scripts/testar-planejador.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planejar } from "../src/lib/planejador/planejador.ts";

const ler = (f) => JSON.parse(readFileSync(new URL(`../conhecimento/biblioteca/salao/${f}`, import.meta.url), "utf8"));
const assuntos = [...ler("escova.json"), ...ler("coloracao.json")].map((a) => ({
  id: a.id, servico: a.servico, tipo: a.tipo, formatos: a.formatos, sazonal: a.sazonal, status: a.status,
  intensidade_convite: a.intensidade_convite,
}));

const base = {
  inicio: "2026-11-02", fim: "2026-11-29", dias: [0, 2, 4], nicho: "salao",
  servicos: [{ nome: "Escova", principal: true }, { nome: "Coloração", principal: false }],
  assuntos, usadosPelaCliente: [], usadosNaRegiao: [], posicaoNaRegiao: 0, permitirRascunho: true,
};
let ok = 0;
const passou = (nome) => { ok++; console.log("ok  ", nome); };

// 1. plano de 4 semanas, 3 dias por semana
const p1 = planejar(base);
assert.equal(p1.length, 12);
passou("12 posts em 4 semanas com 3 dias");

// 2. sem assunto repetido e só da biblioteca do serviço escolhido
const ids = p1.filter((p) => p.assuntoId).map((p) => p.assuntoId);
assert.equal(new Set(ids).size, ids.length);
for (const p of p1.filter((x) => x.assuntoId)) assert.equal(assuntos.find((a) => a.id === p.assuntoId).servico, p.servico);
passou("nenhum assunto repetido e cada assunto é do serviço do post");

// 3. nunca o mesmo serviço em dois posts automáticos seguidos
const auto = p1.filter((p) => p.origem !== "personalizado");
for (let i = 1; i < auto.length; i++) assert.notEqual(auto[i].servico, auto[i - 1].servico);
passou("serviço nunca se repete em posts automáticos seguidos");

// 4. o principal aparece mais
const conta = (l, s) => l.filter((p) => p.servico === s).length;
assert.ok(conta(auto, "Escova") >= conta(auto, "Coloração"));
console.log("      Escova:", conta(auto, "Escova"), " Coloração:", conta(auto, "Coloração"));
passou("serviço principal aparece pelo menos tanto quanto os demais");

// 5. posts personalizados ficam sem assunto e fora da rotação
for (const p of p1.filter((x) => ["foto", "depoimento", "oferta", "agenda"].includes(x.tipoPost))) {
  assert.equal(p.origem, "personalizado");
  assert.equal(p.assuntoId, null);
}
passou("foto, depoimento, oferta e agenda são personalizados");

// 6. mix de convites perto de 40/35/25 em um plano maior (5 dias por semana, 4 semanas)
const p6 = planejar({ ...base, dias: [0, 1, 2, 3, 4] });
const mix = [0, 1, 2].map((i) => p6.filter((p) => p.intensidadeConvite === i).length / p6.length);
console.log("      mix 0/1/2:", mix.map((x) => (x * 100).toFixed(0) + "%").join(" / "));
assert.ok(Math.abs(mix[0] - 0.4) <= 0.1 && Math.abs(mix[1] - 0.35) <= 0.1 && Math.abs(mix[2] - 0.25) <= 0.1);
for (const p of p6.filter((x) => ["oferta", "agenda"].includes(x.tipoPost))) assert.equal(p.intensidadeConvite, 2);
passou("convites perto de 40/35/25; oferta e agenda sempre diretas");

// 7. posição na região muda a primeira escolha (duas clientes do mesmo bairro não começam iguais)
const a0 = planejar({ ...base, posicaoNaRegiao: 0 }).find((p) => p.assuntoId);
const a1 = planejar({ ...base, posicaoNaRegiao: 1 }).find((p) => p.assuntoId);
assert.notEqual(a0.assuntoId, a1.assuntoId);
passou("clientes em posições diferentes da região começam por assuntos diferentes");

// 8. assunto usado por outra cliente da região dentro da janela é evitado
const usadoRegiao = ids[0];
const p8 = planejar({ ...base, usadosNaRegiao: [{ assuntoId: usadoRegiao, data: "2026-11-01" }] });
assert.ok(!p8.some((p) => p.assuntoId === usadoRegiao && p.data < "2026-11-15"));
passou("assunto usado na região dentro da janela não sai de novo");

// 9. o que a cliente já usou não volta enquanto houver estoque
const p9 = planejar({ ...base, usadosPelaCliente: ids.slice(0, 5).map((assuntoId) => ({ assuntoId, data: "2026-10-01" })) });
for (const p of p9) if (p.assuntoId) assert.ok(!ids.slice(0, 5).includes(p.assuntoId));
passou("assuntos já usados pela cliente não voltam enquanto há estoque");

// 10. estoque esgotado: recicla o mais antigo e avisa (reciclado)
const pequeno = assuntos.filter((a) => a.servico === "Escova").slice(0, 2);
const p10 = planejar({
  ...base, servicos: [{ nome: "Escova", principal: true }], assuntos: pequeno,
  usadosPelaCliente: pequeno.map((a, i) => ({ assuntoId: a.id, data: `2026-09-0${i + 1}` })),
});
assert.ok(p10.some((p) => p.reciclado));
passou("estoque esgotado: recicla o mais antigo e sinaliza para o gerador criar um ângulo novo");

// 11. serviço sem assunto na biblioteca cai no gerador
const p11 = planejar({ ...base, servicos: [{ nome: "Podologia", principal: true }] });
assert.ok(p11.filter((p) => p.origem !== "personalizado").every((p) => p.origem === "gerar"));
passou("serviço sem biblioteca cai no gerador (origem gerar)");

// 11b. com vários serviços, o principal aparece mais do que a média dos demais
const muitos = ["Escova", "Coloração", "Luzes", "Hidratação", "Corte feminino", "Progressiva"].map((nome, i) => ({ nome, principal: i === 0 }));
const pm = planejar({ ...base, dias: [0, 1, 2, 3, 4], servicos: muitos }).filter((p) => p.origem !== "personalizado");
const contagem = Object.fromEntries(muitos.map((m) => [m.nome, pm.filter((p) => p.servico === m.nome).length]));
const mediaOutros = Object.entries(contagem).filter(([n]) => n !== "Escova").reduce((t, [, v]) => t + v, 0) / (muitos.length - 1);
console.log("      contagem por serviço:", JSON.stringify(contagem));
assert.ok(contagem["Escova"] > mediaOutros);
passou("com vários serviços, o principal aparece mais do que a média dos demais");

// 12. pilates usa a sequência própria, sem agenda de horários
const p12 = planejar({ ...base, nicho: "pilates", dias: [0, 1, 2, 3, 4] });
assert.ok(!p12.some((p) => p.tipoPost === "agenda"));
passou("pilates não gera post de agenda de horários");

console.log(`\n${ok} verificações passaram.`);
console.log("\nExemplo (Escova principal + Coloração, seg/qua/sex, novembro de 2026):");
for (const p of p1.slice(0, 8)) {
  console.log(`  ${p.data}  ${p.tipoPost.padEnd(10)} ${String(p.servico ?? "-").padEnd(10)} ${String(p.assuntoId ?? "-").padEnd(8)} convite ${p.intensidadeConvite}  ${p.origem}`);
}
