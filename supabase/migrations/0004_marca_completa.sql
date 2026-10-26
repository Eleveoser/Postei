-- Postei: cadastro completo da marca
-- (cores proprias, fundo, cor do texto, tom de voz, WhatsApp de agendamento)
-- Rode no SQL Editor do Supabase (depois do 0003). Pode rodar mais de uma vez.

alter table public.marcas
  add column if not exists tom_voz text,
  add column if not exists wa_bio boolean not null default false,
  add column if not exists whatsapp text,
  add column if not exists fundo text not null default 'icone',
  add column if not exists fundo_url text,
  add column if not exists texto_cores jsonb not null default '{"l":"ink","d":"white"}'::jsonb;

comment on column public.marcas.whatsapp is
  'WhatsApp de agendamento (digitos com 55 na frente). Usado para montar o link wa.me nos posts. O Postei nao usa a API do WhatsApp.';
comment on column public.marcas.paleta is
  'Cores da marca: {id, inv, deLogo, custom:{c1,c2,c3}|null, final:{c1,c2,c3,bg}}. Registros antigos guardam so {id,c1,c2,c3,bg}.';
