-- Postei: fila de produção da biblioteca
-- Lista os serviços que as clientes cadastraram e que ainda NÃO têm assuntos próprios na biblioteca,
-- do mais pedido para o menos pedido. É o que orienta o que produzir primeiro.
-- Rode no SQL Editor do Supabase (depois do 0006). Pode rodar mais de uma vez.
-- Uso: select * from public.fila_biblioteca;

create or replace view public.fila_biblioteca as
select
  coalesce(m.tipo_negocio, 'salao') as nicho,
  s.nome as servico,
  count(distinct m.cliente_id) as clientes,
  count(distinct m.cliente_id) filter (where s.principal) as como_principal
from public.marcas m
cross join lateral (
  select
    trim(x ->> 'nome') as nome,
    coalesce((x ->> 'principal')::boolean, false) as principal
  from jsonb_array_elements(case when jsonb_typeof(m.servicos) = 'array' then m.servicos else '[]'::jsonb end) x
) s
where s.nome <> ''
  and not exists (
    select 1
    from public.biblioteca_assuntos b
    where b.nicho = coalesce(m.tipo_negocio, 'salao')
      and lower(b.servico) = lower(s.nome)
  )
group by 1, 2
order by clientes desc, como_principal desc, servico;

-- A visão só deve ser lida por quem administra (pelo SQL Editor); as clientes não têm acesso.
revoke all on public.fila_biblioteca from anon, authenticated;
