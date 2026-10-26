-- Postei — cadastro da marca, registro de uso e custo
-- Rode este arquivo inteiro, de uma vez, no SQL Editor do Supabase (depois do 0001).

-- ========================================================
-- 1. MARCAS: campos do cadastro
--    A arte NÃO é guardada: ela é desenhada no celular a partir destes dados.
--    Só o logo (pequeno) vai para o Storage.
-- ========================================================
alter table public.marcas
  add column if not exists tipo_negocio text,
  add column if not exists instagram text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists posts_por_semana int,
  add column if not exists dias_semana int[] not null default '{}',
  add column if not exists concluida_em timestamptz;

-- uma marca por cliente (o cadastro faz upsert)
create unique index if not exists marcas_cliente_unico on public.marcas(cliente_id);

-- ========================================================
-- 2. CLIENTES: origem e preço de entrada
--    preco_entrada guarda o valor de lançamento que a cliente mantém
--    enquanto a assinatura estiver ativa.
-- ========================================================
alter table public.clientes
  add column if not exists origem text,
  add column if not exists preco_entrada numeric(8,2);

-- ========================================================
-- 3. EVENTOS_USO: base da lista de retenção e do controle semanal
--    tipo exemplos: 'cadastro_passo', 'marca_concluida', 'app_aberto',
--    'post_publicado', 'pedido', 'motivo_retencao'
-- ========================================================
create table if not exists public.eventos_uso (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null,
  meta jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists idx_eventos_cliente_data on public.eventos_uso(cliente_id, criado_em desc);
create index if not exists idx_eventos_tipo on public.eventos_uso(tipo, criado_em desc);

alter table public.eventos_uso enable row level security;
create policy "eventos_select_own" on public.eventos_uso
  for select to authenticated using ( (select auth.uid()) = cliente_id );
create policy "eventos_insert_own" on public.eventos_uso
  for insert to authenticated with check ( (select auth.uid()) = cliente_id );

-- ========================================================
-- 4. CUSTOS_API: custo de cada chamada paga, por cliente
--    (IA, busca na web). Escrita só pelo servidor (service role).
-- ========================================================
create table if not exists public.custos_api (
  id bigint generated always as identity primary key,
  cliente_id uuid references public.clientes(id) on delete set null,
  servico text not null,            -- 'anthropic', 'web_search', ...
  funcao text not null,             -- 'calendario', 'legenda', 'post_livre', 'radar', ...
  tokens_entrada int not null default 0,
  tokens_saida int not null default 0,
  custo_brl numeric(10,4) not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists idx_custos_cliente_data on public.custos_api(cliente_id, criado_em desc);
alter table public.custos_api enable row level security;
-- sem policy para authenticated: o cliente não lê nem escreve; o servidor usa a service role.

-- ========================================================
-- 5. STORAGE: logos (pequenos, redimensionados no celular antes do envio)
--    Cada cliente só escreve na própria pasta: <uid>/logo.webp
-- ========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 524288, array['image/webp','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "logos_leitura_publica" on storage.objects
  for select using ( bucket_id = 'logos' );
create policy "logos_insert_own" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text );
create policy "logos_update_own" on storage.objects
  for update to authenticated
  using ( bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text );
create policy "logos_delete_own" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text );
