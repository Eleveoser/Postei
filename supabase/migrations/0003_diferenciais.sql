-- Postei: diferenciais de cada servico (pergunta feita depois do cadastro da marca)
-- Rode no SQL Editor do Supabase (depois do 0002).

alter table public.marcas
  add column if not exists diferenciais jsonb not null default '[]'::jsonb;

comment on column public.marcas.diferenciais is
  'Lista de {servico, texto}: o que a cliente faz de diferente da concorrencia em cada servico.';
