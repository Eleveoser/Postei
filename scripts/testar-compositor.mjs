// Teste do compositor: node scripts/testar-compositor.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planejar } from "../src/lib/planejador/planejador.ts";
import { comporPosts } from "../src/lib/compositor.ts";

const ler = (f) => JSON.parse(readFileSync(new URL(`../conhecimento/biblioteca/${f}`, import.meta.url), "utf8"));
const bib = [...ler("salao/escova.json"), ...ler("salao/coloracao.json")];
const convites = ler("convites.json").convites;
const mapa = new Map(bib.map((a) => [a.id, { ...a, veredito: a.veredito ?? null }]));

const plano = planejar({
  inicio: "2026-11-02", fim: "2026-11-29", dias: [0, 1, 2, 3, 4], nicho: "salao",
  servicos: [{ nome: "Escova", principal: true }, { nome: "Coloração", principal: false }, { nome: "Podologia", principal: false }],
  assuntos: bib, usadosPelaCliente: [], usadosNaRegiao: [], posicaoNaRegiao: 0, permitirRascunho: true,
  personalizadosDisponiveis: ["oferta"],
});
const marca = {
  nome: "Studio Bela", tom: "acolhedor", waBio: true, principais: ["Escova"], servicos: ["Escova", "Coloração", "Podologia"],
  diferenciais: [{ servico: "Coloração", texto: "só usamos tintas importadas" }],
};
const posts = comporPosts(plano, mapa, convites, marca);
let ok = 0;
const passou = (n) => { ok++; console.log("ok  ", n); };

assert.equal(posts.length, plano.length);
passou("um conteúdo para cada dia do plano");

assert.ok(!plano.some((p) => ["foto", "depoimento", "agenda"].includes(p.tipoPost)));
passou("sem foto, depoimento e agenda enquanto a cliente não pode alimentá-los");

for (const p of posts) {
  assert.ok(!/\{canal\}/.test(p.legenda), "marcador {canal} não substituído");
  assert.ok(!/R\$\s?\d/.test(p.legenda), "preço inventado");
  assert.ok(!/\(\d{2}\)\s?\d{4,5}-\d{4}/.test(p.legenda), "telefone inventado");
  assert.ok(!/\beu\b|\bminha\b|\bmeu\b/i.test(p.legenda), "voz deve ser do negócio");
}
passou("sem marcador sobrando, sem preço ou telefone inventado, voz do negócio");

const semConvite = posts.filter((p) => p.intensidade === 0);
for (const p of semConvite) assert.ok(!/agende|chama a gente|marque/i.test(p.legenda.split("\n").slice(-1)[0]));
passou("posts sem convite terminam sem chamada para agendar");

for (let i = 1; i < posts.length; i++) if (posts[i].convite_id) assert.notEqual(posts[i].convite_id, posts[i - 1].convite_id);
passou("o mesmo convite não aparece em posts seguidos");

const mitos = posts.filter((p) => p.arte.tpl === "mito");
for (const m of mitos) assert.ok(["mito", "verdade", "depende"].includes(m.arte.dados.resposta));
passou("mito ou verdade sempre com veredito da biblioteca");

const reels = posts.filter((p) => p.arte.tpl === "reels");
for (const r of reels) assert.equal(r.roteiro.length, 3);
passou("reels com roteiro de 3 tomadas, sem rosto");

const comDif = posts.filter((p) => p.legenda.includes("tintas importadas"));
assert.ok(comDif.length >= 1 && comDif.every((p) => p.servico === "Coloração"));
passou("diferencial aparece com as palavras da cliente, só no serviço dele");

const prov = posts.filter((p) => p.provisorio);
assert.ok(prov.every((p) => p.servico === "Podologia"));
passou("serviço sem biblioteca vira post provisório de apresentação");

assert.ok(posts.some((p) => p.legenda.includes("no WhatsApp (link na bio)")));
passou("canal do convite vem do cadastro (WhatsApp na bio)");

// tom de voz: o mesmo plano em tons diferentes muda a ponte, o registro e os convites
const comTom = (tom) => comporPosts(plano, mapa, convites, { ...marca, tom });
const soph = comTom("sofisticado");
assert.ok(soph.every((p) => !/!/.test(p.legenda) && !/\ba gente\b/i.test(p.legenda)));
passou("tom sofisticado: sem exclamação e sem \"a gente\"");
const desc = comTom("descontraido");
assert.ok(desc.some((p) => /O que a nossa equipe faz por aqui|Olha só o que acontece aqui|Bastidor da nossa equipe/.test(p.legenda)));
assert.notEqual(soph[0].legenda, desc[0].legenda);
passou("tons diferentes geram legendas diferentes para o mesmo post");
for (const tom of ["acolhedor", "sofisticado", "descontraido", "tecnico"]) {
  for (const p of comTom(tom)) {
    assert.ok(!/\bcabelo\b/i.test(p.convite_id ? (convites.find((c) => c.id === p.convite_id)?.texto ?? "") : ""), "convite fala de cabelo");
    assert.ok(!/esta semana|cadeira livre|café/i.test(convites.find((c) => c.id === p.convite_id)?.texto ?? ""), "convite afirma disponibilidade ou oferta inventada");
  }
}
passou("convites neutros: sem cabelo, sem disponibilidade inventada, sem oferta inventada");
for (const c of convites) assert.ok(!/\badoram\b.*(próximo|próxima)/i.test(c.texto), `tempo verbal: ${c.id}`);
passou("nenhum convite usa presente para fato futuro (adoram ... no próximo atendimento)");

// voz pessoal: ponte, reserva e foto falam em primeira pessoa; convites vêm do banco de voz "pessoa"
const convitesPessoa = ler("convites-pessoa.json").convites;
const pessoal = comporPosts(plano, mapa, convitesPessoa, { ...marca, voz: "pessoa" });
for (const p of pessoal.filter((x) => x.provisorio || x.arte.tpl === "fotoInteira" || x.arte.tpl === "oferta")) {
  assert.ok(!/nossa equipe|nossos profissionais|a gente|\bnós\b/i.test(p.legenda), `voz de negócio em perfil pessoal: ${p.legenda.slice(0, 80)}`);
}
assert.ok(pessoal.some((p) => /Na minha experiência|O que eu|Uma reflexão|Uma conversa|Bastidor do meu|Na prática, eu|O critério que eu/.test(p.legenda)));
passou("voz pessoal: reserva, foto e ponte em primeira pessoa, sem 'nossa equipe'");

console.log(`\n${ok} verificações passaram.\n`);
const ex = posts.find((p) => p.arte.tpl === "dica" && p.intensidade > 0) ?? posts[0];
console.log(`Exemplo (${ex.arte.tpl}, ${ex.servico}):\n---\n${ex.legenda}\n---`);
