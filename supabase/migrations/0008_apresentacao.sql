-- Postei: posts de apresentação do perfil (horários e história do negócio)
-- Rode no SQL Editor do Supabase (depois do 0007). Pode rodar mais de uma vez.

alter table public.marcas
  add column if not exists apresentacao jsonb not null default '{}'::jsonb;

comment on column public.marcas.apresentacao is
  'Dados dos posts de apresentação: {"horarios":[["Seg a Sex","9h às 19h"]], "historia":"texto curto"}.';
