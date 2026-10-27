-- Postei: banco de imagens de fundo (fotos ou artes que a cliente sobe uma vez e o app alterna nos posts)
-- Rode no SQL Editor do Supabase (depois do 0009). Pode rodar mais de uma vez.

alter table public.marcas
  add column if not exists fundos jsonb not null default '[]'::jsonb;

comment on column public.marcas.fundos is
  'Lista de {url, categoria} das imagens de fundo da cliente (Storage, bucket logos).';
