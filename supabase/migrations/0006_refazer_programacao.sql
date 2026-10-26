-- Postei: permite à cliente refazer a programação (apagar os próprios posts ainda não publicados)
-- Rode no SQL Editor do Supabase (depois do 0005). Pode rodar mais de uma vez.

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated
  using ((select auth.uid()) = cliente_id and status <> 'publicado');

drop policy if exists "uso_delete_own" on public.uso_assuntos;
create policy "uso_delete_own" on public.uso_assuntos
  for delete to authenticated
  using ((select auth.uid()) = cliente_id);
