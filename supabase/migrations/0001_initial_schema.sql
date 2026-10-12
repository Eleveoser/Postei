-- Postei — schema inicial
-- Rode este arquivo inteiro, de uma vez, no SQL Editor do Supabase
-- (Supabase -> seu projeto -> SQL Editor -> New query -> colar -> Run)

-- ========================================================
-- 1. CLIENTES (perfil de negócio de cada assinante)
--    id = auth.uid() do Supabase Auth — 1 linha por conta logada
-- ========================================================
create table public.clientes (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_negocio text not null,
  telefone text,
  plano text not null default 'trial' check (plano in ('trial','essencial','constante','presenca')),
  status_assinatura text not null default 'trial' check (status_assinatura in ('trial','ativo','inadimplente','cancelado')),
  trial_fim date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.clientes is 'Perfil de negócio de cada assinante do Postei. 1 linha por usuário autenticado.';

-- ========================================================
-- 2. MARCAS (identidade visual / monte-sua-marca)
-- ========================================================
create table public.marcas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome_exibicao text,
  logo_url text,
  paleta jsonb not null default '{}'::jsonb,
  fonte text,
  conjunto_visual text,
  ritmo_postagem text,
  servicos jsonb not null default '[]'::jsonb,
  trava_30_dias_fim date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_marcas_cliente on public.marcas(cliente_id);

-- ========================================================
-- 3. CALENDARIOS (calendário mensal gerado pela IA)
-- ========================================================
create table public.calendarios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  mes_referencia date not null,
  status text not null default 'gerando' check (status in ('gerando','pronto','erro')),
  criado_em timestamptz not null default now(),
  unique (cliente_id, mes_referencia)
);

create index idx_calendarios_cliente on public.calendarios(cliente_id);

-- ========================================================
-- 4. POSTS (cada post dentro de um calendário)
-- ========================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  calendario_id uuid not null references public.calendarios(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  data_publicacao date not null,
  tipo text not null,
  conteudo jsonb not null default '{}'::jsonb,
  status text not null default 'pendente' check (status in ('pendente','pronto','publicado')),
  criado_em timestamptz not null default now()
);

create index idx_posts_cliente on public.posts(cliente_id);
create index idx_posts_calendario on public.posts(calendario_id);
create index idx_posts_data on public.posts(cliente_id, data_publicacao);

-- ========================================================
-- 5. PEDIDOS (extras avulsos — post avulso, pacote 5, campanha)
-- ========================================================
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null check (tipo in ('avulso','pacote5','campanha')),
  quantidade int not null default 1,
  usados int not null default 0,
  comprado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  status text not null default 'ativo' check (status in ('ativo','expirado','consumido'))
);

create index idx_pedidos_cliente on public.pedidos(cliente_id);

-- ========================================================
-- 6. PAINEIS (painel da semana — escolhas de mix de conteúdo)
-- ========================================================
create table public.paineis (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  semana_inicio date not null,
  eixo1 text,
  eixo2 text,
  mix jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique (cliente_id, semana_inicio)
);

create index idx_paineis_cliente on public.paineis(cliente_id);

-- ========================================================
-- 7. ACEITES (assinatura digital — marca, termos, autorização de rosto)
-- ========================================================
create table public.aceites (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null,
  conteudo_aceito text,
  aceito_em timestamptz not null default now()
);

create index idx_aceites_cliente on public.aceites(cliente_id);

-- ========================================================
-- RLS — cada cliente só vê e altera os próprios dados
-- ========================================================
alter table public.clientes enable row level security;
alter table public.marcas enable row level security;
alter table public.calendarios enable row level security;
alter table public.posts enable row level security;
alter table public.pedidos enable row level security;
alter table public.paineis enable row level security;
alter table public.aceites enable row level security;

-- clientes: a linha É o próprio usuário (id = auth.uid())
create policy "clientes_select_own" on public.clientes
  for select to authenticated
  using ( (select auth.uid()) = id );

create policy "clientes_insert_own" on public.clientes
  for insert to authenticated
  with check ( (select auth.uid()) = id );

create policy "clientes_update_own" on public.clientes
  for update to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- tabelas filhas: cliente_id tem que ser o próprio usuário logado
create policy "marcas_select_own" on public.marcas
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "marcas_insert_own" on public.marcas
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );
create policy "marcas_update_own" on public.marcas
  for update to authenticated using ( (select auth.uid()) = cliente_id ) with check ( (select auth.uid()) = cliente_id );

create policy "calendarios_select_own" on public.calendarios
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "calendarios_insert_own" on public.calendarios
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );
create policy "calendarios_update_own" on public.calendarios
  for update to authenticated using ( (select auth.uid()) = cliente_id ) with check ( (select auth.uid()) = cliente_id );

create policy "posts_select_own" on public.posts
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );
create policy "posts_update_own" on public.posts
  for update to authenticated using ( (select auth.uid()) = cliente_id ) with check ( (select auth.uid()) = cliente_id );

create policy "pedidos_select_own" on public.pedidos
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "pedidos_insert_own" on public.pedidos
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );
create policy "pedidos_update_own" on public.pedidos
  for update to authenticated using ( (select auth.uid()) = cliente_id ) with check ( (select auth.uid()) = cliente_id );

create policy "paineis_select_own" on public.paineis
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "paineis_insert_own" on public.paineis
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );
create policy "paineis_update_own" on public.paineis
  for update to authenticated using ( (select auth.uid()) = cliente_id ) with check ( (select auth.uid()) = cliente_id );

create policy "aceites_select_own" on public.aceites
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "aceites_insert_own" on public.aceites
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );

-- ========================================================
-- Trigger: cria a linha em "clientes" automaticamente quando
-- alguém se cadastra pelo Supabase Auth (signup)
-- ========================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clientes (id, nome_negocio, status_assinatura, trial_fim)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_negocio', 'Meu negócio'),
    'trial',
    (now() + interval '7 days')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
