-- Run once in Supabase Dashboard -> SQL Editor.
-- Supabase Auth already stores accounts + password hashes in auth.users.
-- This adds ONLY app data, keyed to auth.users.id (uuid).

create function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  code text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    select string_agg(
      substr(
        alphabet,
        floor(random() * length(alphabet) + 1)::int,
        1
      ),
      ''
    )
    into code
    from generate_series(1, 5);

    exit when not exists (
      select 1
      from public.classrooms
      where join_code = code
    );
  end loop;

  return code;
end;
$$;

create table public.profiles (
  id uuid PRIMARY KEY references auth.users(id) on delete cascade,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  remaining_messages integer not default 50 check (remaining_messages >= 0),
);

create table public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text not null,
  join_code text not null unique default public.generate_join_code(),
  owner_id uuid not null REFERENCES public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

CREATE TABLE public.classroom_members (
  class_id uuid REFERENCES public.classrooms(id),
  user_id uuid REFERENCES public.profiles(id),

  PRIMARY KEY (class_id, user_id)
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

create function public.validate_classroom_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.owner_id
      and role = 'teacher'
  ) then
    raise exception 'Classroom owner must be a teacher';
  end if;

  return new;
end;
$$;

create trigger validate_classroom_owner_trigger
before insert or update of owner_id
on public.classrooms
for each row
execute function public.validate_classroom_owner();

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
