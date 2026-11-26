-- Usuários: acesso ativo/inativo, senha temporária (troca obrigatória no 1º acesso) e cada um edita o próprio nome.
-- Papel e situação só mudam pelo administrador, e ninguém altera o próprio acesso.

alter table public.perfis
  add column ativo boolean not null default true,
  add column trocar_senha boolean not null default false;

-- Conta inativa perde o acesso a tudo: os helpers do RLS passam a ignorá-la.
create or replace function private.minha_empresa_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select empresa_id from public.perfis where id = (select auth.uid()) and ativo
$$;

create or replace function private.sou_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select papel = 'admin' and ativo from public.perfis where id = (select auth.uid())), false)
$$;

create or replace function private.sou_steto_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select p.papel = 'admin' and p.ativo and e.is_steto
    from public.perfis p join public.empresas e on e.id = p.empresa_id
    where p.id = (select auth.uid())
  ), false)
$$;

create policy "perfis: cada um edita o próprio" on public.perfis
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function private.proteger_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.papel, new.ativo) is distinct from (old.papel, old.ativo) then
    if new.id = (select auth.uid()) then
      raise exception 'Você não pode mudar o seu próprio acesso.' using errcode = '42501';
    end if;
    if not private.sou_admin() then
      raise exception 'Só o administrador muda papel e situação.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger proteger_perfil before update on public.perfis for each row execute function private.proteger_perfil();
revoke all on function private.proteger_perfil() from public, anon, authenticated;

revoke update on public.perfis from authenticated;
grant update (nome, papel, ativo, trocar_senha) on public.perfis to authenticated;
