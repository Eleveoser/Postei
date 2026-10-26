-- Postei: biblioteca de assuntos e convites, e registro de uso por região
-- Rode no SQL Editor do Supabase (depois do 0004). Pode rodar mais de uma vez.
-- O conteúdo da biblioteca é carregado por outro arquivo (conhecimento/carga-biblioteca.sql, fora do GitHub).

-- 1. Assuntos (o estoque de conteúdo)
create table if not exists public.biblioteca_assuntos (
  id text primary key,
  nicho text not null,
  servico text not null,
  tipo text not null,
  angulo text not null,
  gancho text not null,
  titulo text not null,
  pontos jsonb not null default '[]'::jsonb,
  olhar_profissional text not null,
  exemplo text not null,
  veredito text,
  intensidade_convite int not null default 1 check (intensidade_convite in (0, 1, 2)),
  risco text not null default 'baixo',
  fonte text not null default '',
  formatos text[] not null default '{}',
  sazonal int[] not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho', 'revisado', 'aprovado')),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_assuntos_nicho_servico on public.biblioteca_assuntos(nicho, servico);

-- 2. Convites de fim de post
create table if not exists public.biblioteca_convites (
  id text primary key,
  tom text not null,
  intensidade int not null check (intensidade in (1, 2)),
  texto text not null
);

-- Leitura para quem está logado; escrita só pelo SQL Editor (sem policy de escrita).
alter table public.biblioteca_assuntos enable row level security;
alter table public.biblioteca_convites enable row level security;
drop policy if exists "assuntos_leitura" on public.biblioteca_assuntos;
create policy "assuntos_leitura" on public.biblioteca_assuntos for select to authenticated using (true);
drop policy if exists "convites_leitura" on public.biblioteca_convites;
create policy "convites_leitura" on public.biblioteca_convites for select to authenticated using (true);

-- 3. Uso de assuntos por região (para não repetir assunto no mesmo bairro)
create table if not exists public.uso_assuntos (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  assunto_id text not null,
  nicho text not null,
  regiao text not null,           -- "cidade|bairro", em minúsculas e sem acento
  data date not null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_uso_regiao on public.uso_assuntos(nicho, regiao, data);
create index if not exists idx_uso_cliente on public.uso_assuntos(cliente_id, data);
alter table public.uso_assuntos enable row level security;
drop policy if exists "uso_select_own" on public.uso_assuntos;
create policy "uso_select_own" on public.uso_assuntos for select to authenticated using ((select auth.uid()) = cliente_id);
drop policy if exists "uso_insert_own" on public.uso_assuntos;
create policy "uso_insert_own" on public.uso_assuntos for insert to authenticated with check ((select auth.uid()) = cliente_id);

-- 4. Funções que olham a região sem expor quem são as outras clientes
create or replace function public.assuntos_usados_na_regiao(p_nicho text, p_regiao text, p_desde date)
returns table (assunto_id text, data date)
language sql
security definer
set search_path = public
as $$
  select u.assunto_id, u.data
  from public.uso_assuntos u
  where u.nicho = p_nicho
    and u.regiao = p_regiao
    and u.data >= p_desde
    and u.cliente_id <> auth.uid();
$$;

create or replace function public.posicao_na_regiao(p_nicho text, p_regiao text)
returns int
language sql
security definer
set search_path = public
as $$
  -- quantas clientes do mesmo nicho e região se cadastraram antes desta
  select count(distinct u.cliente_id)::int
  from public.uso_assuntos u
  where u.nicho = p_nicho
    and u.regiao = p_regiao
    and u.cliente_id <> auth.uid()
    and u.criado_em < coalesce(
      (select min(criado_em) from public.uso_assuntos where cliente_id = auth.uid()),
      now()
    );
$$;

grant execute on function public.assuntos_usados_na_regiao(text, text, date) to authenticated;
grant execute on function public.posicao_na_regiao(text, text) to authenticated;
