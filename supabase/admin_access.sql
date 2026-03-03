-- Run this in Supabase SQL editor to enable trainer/admin features.
-- It extends profiles + workout_sessions policies for role-based access.

alter table if exists public.profiles
  add column if not exists role text default 'client'
  check (role in ('client', 'trainer', 'admin'));

alter table if exists public.profiles
  add column if not exists trainer_id uuid references auth.users(id) on delete set null;

update public.profiles
set role = 'client'
where role is null;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_trainer_idx on public.profiles(trainer_id);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'client'
  );
$$;

-- ---------- Profiles RLS ----------
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;

drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_select_trainer_clients" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_update_trainer_clients" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;
drop policy if exists "profiles_delete_trainer_clients" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_select_trainer_clients"
on public.profiles
for select
to authenticated
using (
  public.current_user_role() = 'trainer'
  and role = 'client'
  and trainer_id = auth.uid()
);

create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.current_user_role() = 'admin');

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and coalesce(role, 'client') = 'client'
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_update_trainer_clients"
on public.profiles
for update
to authenticated
using (
  public.current_user_role() = 'trainer'
  and role = 'client'
  and trainer_id = auth.uid()
)
with check (
  role = 'client'
  and trainer_id = auth.uid()
);

create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "profiles_delete_self"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

create policy "profiles_delete_trainer_clients"
on public.profiles
for delete
to authenticated
using (
  public.current_user_role() = 'trainer'
  and role = 'client'
  and trainer_id = auth.uid()
);

create policy "profiles_delete_admin"
on public.profiles
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ---------- workout_sessions RLS ----------
alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;

drop policy if exists "workout_sessions_select_self" on public.workout_sessions;
drop policy if exists "workout_sessions_select_trainer_clients" on public.workout_sessions;
drop policy if exists "workout_sessions_select_admin" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_self" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_trainer_clients" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_admin" on public.workout_sessions;
drop policy if exists "workout_sessions_update_self" on public.workout_sessions;
drop policy if exists "workout_sessions_update_trainer_clients" on public.workout_sessions;
drop policy if exists "workout_sessions_update_admin" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_self" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_trainer_clients" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_admin" on public.workout_sessions;

create policy "workout_sessions_select_self"
on public.workout_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "workout_sessions_select_trainer_clients"
on public.workout_sessions
for select
to authenticated
using (
  public.current_user_role() = 'trainer'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.workout_sessions.user_id
      and p.role = 'client'
      and p.trainer_id = auth.uid()
  )
);

create policy "workout_sessions_select_admin"
on public.workout_sessions
for select
to authenticated
using (public.current_user_role() = 'admin');

create policy "workout_sessions_insert_self"
on public.workout_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workout_sessions_insert_trainer_clients"
on public.workout_sessions
for insert
to authenticated
with check (
  public.current_user_role() = 'trainer'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.workout_sessions.user_id
      and p.role = 'client'
      and p.trainer_id = auth.uid()
  )
);

create policy "workout_sessions_insert_admin"
on public.workout_sessions
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "workout_sessions_update_self"
on public.workout_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout_sessions_update_trainer_clients"
on public.workout_sessions
for update
to authenticated
using (
  public.current_user_role() = 'trainer'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.workout_sessions.user_id
      and p.role = 'client'
      and p.trainer_id = auth.uid()
  )
)
with check (
  public.current_user_role() = 'trainer'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.workout_sessions.user_id
      and p.role = 'client'
      and p.trainer_id = auth.uid()
  )
);

create policy "workout_sessions_update_admin"
on public.workout_sessions
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "workout_sessions_delete_self"
on public.workout_sessions
for delete
to authenticated
using (auth.uid() = user_id);

create policy "workout_sessions_delete_trainer_clients"
on public.workout_sessions
for delete
to authenticated
using (
  public.current_user_role() = 'trainer'
  and exists (
    select 1
    from public.profiles p
    where p.id = public.workout_sessions.user_id
      and p.role = 'client'
      and p.trainer_id = auth.uid()
  )
);

create policy "workout_sessions_delete_admin"
on public.workout_sessions
for delete
to authenticated
using (public.current_user_role() = 'admin');
