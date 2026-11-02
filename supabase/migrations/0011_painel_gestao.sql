-- Postei: painel de gestão (somente leitura, só para administradoras)
-- Rode no SQL Editor do Supabase (depois do 0009). Pode rodar mais de uma vez.
--
-- O que isto cria: 4 funções que devolvem os números do painel /app/gestao.
-- Todas conferem public.eh_admin() antes de qualquer coisa: quem não está na tabela
-- "administradores" recebe "sem permissão". Não há chave de administrador no app.

-- 1. Resumo (cartões do topo)
create or replace function public.gestao_resumo()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r jsonb;
  t_total int := 0;
  t_usaram int := 0;
  inicio_mes timestamptz := date_trunc('month', now());
begin
  if not public.eh_admin() then raise exception 'sem permissão'; end if;

  begin
    select count(*), count(*) filter (where primeira_geracao_em is not null)
      into t_total, t_usaram from public.teste_clientes;
  exception when undefined_table then null;
  end;

  select jsonb_build_object(
    'contas_total',      (select count(*) from public.clientes),
    'contas_7d',         (select count(*) from public.clientes where criado_em > now() - interval '7 days'),
    'contas_30d',        (select count(*) from public.clientes where criado_em > now() - interval '30 days'),
    'marcas_concluidas', (select count(*) from public.marcas where concluida_em is not null),
    'ativos_7d',         (select count(distinct cliente_id) from public.eventos_uso
                           where criado_em > now() - interval '7 days' and tipo <> 'cadastro_passo'),
    'posts_gerados',     (select count(*) from public.posts),
    'posts_publicados',  (select count(*) from public.posts where status = 'publicado'),
    'publicados_7d',     (select count(*) from public.eventos_uso
                           where tipo = 'post_publicado' and criado_em > now() - interval '7 days'),
    'custo_mes_brl',     (select coalesce(sum(custo_brl), 0) from public.custos_api where criado_em >= inicio_mes),
    'chamadas_mes',      (select count(*) from public.custos_api where criado_em >= inicio_mes),
    'testes_total',      t_total,
    'testes_usaram_geracao', t_usaram
  ) into r;
  return r;
end;
$$;

-- 2. Uma linha por cliente
create or replace function public.gestao_clientes()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then raise exception 'sem permissão'; end if;
  return query
  select jsonb_build_object(
    'id', c.id,
    'nome_negocio', c.nome_negocio,
    'email', u.email,
    'telefone', c.telefone,
    'plano', c.plano,
    'status', c.status_assinatura,
    'trial_fim', c.trial_fim,
    'criado_em', c.criado_em,
    'origem', c.origem,
    'tipo_negocio', m.tipo_negocio,
    'cidade', m.cidade,
    'bairro', m.bairro,
    'instagram', m.instagram,
    'marca_concluida', (m.concluida_em is not null),
    'ultimo_uso', (select max(e.criado_em) from public.eventos_uso e
                    where e.cliente_id = c.id and e.tipo <> 'cadastro_passo'),
    'posts_gerados', (select count(*) from public.posts p where p.cliente_id = c.id),
    'publicados_30d', (select count(*) from public.eventos_uso e
                        where e.cliente_id = c.id and e.tipo = 'post_publicado'
                          and e.criado_em > now() - interval '30 days'),
    'custo_mes_brl', (select coalesce(sum(k.custo_brl), 0) from public.custos_api k
                       where k.cliente_id = c.id and k.criado_em >= date_trunc('month', now()))
  )
  from public.clientes c
  left join auth.users u on u.id = c.id
  left join public.marcas m on m.cliente_id = c.id
  order by c.criado_em desc;
end;
$$;

-- 3. Custos do mês por função e dia a dia (últimos 30 dias)
create or replace function public.gestao_custos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then raise exception 'sem permissão'; end if;
  return jsonb_build_object(
    'por_funcao', coalesce((
      select jsonb_agg(jsonb_build_object(
               'funcao', funcao, 'servico', servico, 'chamadas', n,
               'custo_brl', custo, 'tokens_entrada', te, 'tokens_saida', ts) order by custo desc)
        from (select funcao, servico, count(*) as n, sum(custo_brl) as custo,
                     sum(tokens_entrada) as te, sum(tokens_saida) as ts
                from public.custos_api
               where criado_em >= date_trunc('month', now())
               group by funcao, servico) t
    ), '[]'::jsonb),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'custo_brl', custo) order by dia)
        from (select (criado_em at time zone 'America/Sao_Paulo')::date as dia, sum(custo_brl) as custo
                from public.custos_api
               where criado_em > now() - interval '30 days'
               group by 1) t
    ), '[]'::jsonb)
  );
end;
$$;

-- 4. Quem passou pelo Teste independente (tolerante: se a tabela não existir, devolve vazio)
create or replace function public.gestao_testes()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then raise exception 'sem permissão'; end if;
  begin
    return query select to_jsonb(t) from public.teste_clientes t order by t.criado_em desc limit 200;
  exception when undefined_table then
    return;
  end;
end;
$$;

revoke all on function public.gestao_resumo() from public, anon;
revoke all on function public.gestao_clientes() from public, anon;
revoke all on function public.gestao_custos() from public, anon;
revoke all on function public.gestao_testes() from public, anon;
grant execute on function public.gestao_resumo() to authenticated;
grant execute on function public.gestao_clientes() to authenticated;
grant execute on function public.gestao_custos() to authenticated;
grant execute on function public.gestao_testes() to authenticated;

-- Para você ver o painel, a sua conta precisa estar em "administradores" (se ainda não está):
--   insert into public.administradores (user_id)
--   select id from auth.users where email = 'SEU-EMAIL-DE-LOGIN-NO-APP'
--   on conflict do nothing;
