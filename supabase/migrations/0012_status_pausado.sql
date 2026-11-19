-- Assuntos pausados não entram na programação (o código já filtra status = 'pausado').
-- A regra original só aceitava rascunho, revisado e aprovado.
alter table public.biblioteca_assuntos drop constraint if exists biblioteca_assuntos_status_check;
alter table public.biblioteca_assuntos
  add constraint biblioteca_assuntos_status_check check (status in ('rascunho', 'revisado', 'aprovado', 'pausado'));
