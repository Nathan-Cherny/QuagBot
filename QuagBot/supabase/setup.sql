-- Run once in Supabase Dashboard -> SQL Editor.
-- Supabase Auth already stores accounts + password hashes in auth.users.
-- This adds ONLY app data, keyed to auth.users.id (uuid).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table public.classrooms (
  id bigint generated always as identity primary key,
  name text not null,
  join_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
-- role is NOT read from signup metadata: users control that, so they could make themselves teachers.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: without this, anyone with the publishable key can read/write every row.
alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- Users may edit their name but not promote themselves to teacher.
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
revoke update (role) on public.profiles from authenticated;

create policy "owners read their classrooms" on public.classrooms
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy "teachers create classrooms" on public.classrooms
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher')
  );
