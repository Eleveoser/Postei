# Postei

Repositório: https://github.com/Eleveoser/Postei (conta Eleveoser, branch `main`).
Pasta local de trabalho: `C:\Users\Dell\Projetos\Postei`.

## Como trabalhar
- Todo o trabalho acontece nesta pasta local (via Claude Code), não direto no claude.ai.
- Fluxo: editar aqui → `git add` → `git commit` → `git push` para o GitHub.
- Idioma: português do Brasil.
- Antes de qualquer `git push`, confirmar com o usuário.

## Design aprovado
- Calendário do mês: formato aprovado em 12/10/2026, artefato "Programação do mês" (https://claude.ai/artifact/FSj1e4KPVkBPnW6gQPmvCf). Seguir esse layout ao construir a tela em `src/app/app/`.

## Segurança
- Chaves e tokens ficam em `C:\Users\Dell\Chaves_APIs\` (fora deste repositório). Nunca colocar chaves aqui nem commitá-las.
- O repositório é **público**: não commitar nada confidencial.

## Origem do material
- Materiais da Eleve o Ser (Lucia Oliveira): `nao-promova-ainda`, `promovido-sem-manual`, `saida-anunciada`.
- Fonte local: `C:\Users\Dell\OneDrive\Documentos\Liderança_digital\lideranca-coorporativo\Linkedin_conteudo\Materiais\` e `C:\Users\Dell\Downloads\materiais\`.


## Custo desde o desenvolvimento (regra da usuária, 21/10/2026)
- Todo endpoint, função agendada e fluxo novo passa por uma revisão de custo antes de ser dado como pronto, junto com experiência do cliente, qualidade e facilidade. A decisão é um equilíbrio, não "o mais barato" nem "o mais top".
- Para cada chamada à API da Anthropic, busca na web, banco ou armazenamento, registrar na hora do desenvolvimento: quantas chamadas por cliente por mês, tamanho aproximado (tokens ou MB) e custo estimado em reais. Comparar com o orçamento por cliente (cerca de R$ 1 por cliente por mês de IA).
- Procurar ativamente: chamadas em loop ou repetidas, chamadas dentro de renderização/refresh, gerar de novo o que já foi gerado (guardar o texto e reaproveitar), prompts longos demais, modelo maior do que o necessário, busca na web por cliente em vez de uma vez por nicho, dados pesados no banco (a arte é desenhada no celular, não guardada).
- Se um caminho tiver custo alto ou chamadas excessivas, parar e levar a alternativa e o custo à usuária antes de seguir.
- Cada geração e cada chamada paga grava seu custo por cliente (base do controle semanal de custos).
