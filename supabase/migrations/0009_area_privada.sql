-- Postei: área privada (administradora), nichos privados e voz pessoal
-- Rode no SQL Editor do Supabase (depois do 0008). Pode rodar mais de uma vez.
--
-- O que isto cria:
--  1. administradores: lista de quem pode ver a área privada. Ninguém além do SQL Editor escreve nela.
--  2. nichos_privados: nichos privados, cada um ligado a UMA conta (nome, serviços, sugestões). Ficam no banco,
--     e não no código, porque o repositório do app é público.
--  3. biblioteca_assuntos: assuntos de nichos "priv-..." só aparecem para a conta dona do nicho.
--  4. marcas.voz e biblioteca_convites.voz: "negocio" (nós) ou "pessoa" (eu).

-- 1. administradoras
create table if not exists public.administradores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.administradores enable row level security;
-- sem policy: o app não lê nem escreve; só o SQL Editor.

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.administradores where user_id = auth.uid());
$$;
grant execute on function public.eh_admin() to authenticated;

-- 2. nichos privados: cada nicho pertence a UMA conta (pelo e-mail) e só ela o enxerga
create table if not exists public.nichos_privados (
  id text primary key check (id like 'priv-%'),
  nome text not null,
  frase text not null,
  voz text not null default 'pessoa' check (voz in ('pessoa', 'negocio')),
  sugestao jsonb not null default '{}'::jsonb,   -- {"pal":"ameixa","fonte":"elegante","conjunto":"editorial","tom":"acolhedor"}
  catalogo jsonb not null default '{}'::jsonb,   -- {"Ofertas":["..."],"Temas":["..."]}
  dono_email text,                               -- e-mail da conta dona do nicho
  criado_em timestamptz not null default now()
);
alter table public.nichos_privados add column if not exists dono_email text;
alter table public.nichos_privados enable row level security;
drop policy if exists "nichos_privados_admin" on public.nichos_privados;
drop policy if exists "nichos_privados_dono" on public.nichos_privados;
create policy "nichos_privados_dono" on public.nichos_privados
  for select to authenticated
  using (public.eh_admin() and lower(dono_email) = lower(auth.jwt() ->> 'email'));

-- 3. biblioteca: assuntos de um nicho privado só aparecem para a conta dona dele.
--    A consulta a nichos_privados já respeita a regra acima, então basta "o nicho existe para mim".
drop policy if exists "assuntos_leitura" on public.biblioteca_assuntos;
create policy "assuntos_leitura" on public.biblioteca_assuntos
  for select to authenticated
  using (
    nicho not like 'priv-%'
    or exists (select 1 from public.nichos_privados n where n.id = biblioteca_assuntos.nicho)
  );

-- 4. voz
alter table public.marcas
  add column if not exists voz text not null default 'negocio' check (voz in ('negocio', 'pessoa'));
alter table public.biblioteca_convites
  add column if not exists voz text not null default 'negocio';

-- Para marcar uma conta como administradora (troque pelo e-mail da conta):
--   insert into public.administradores (user_id)
--   select id from auth.users where email = 'seu-email@exemplo.com'
--   on conflict do nothing;
