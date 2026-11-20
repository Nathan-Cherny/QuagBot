alter table public.profiles
  add column if not exists last_message_at timestamptz;

alter table public.profiles
  add column if not exists remaining_messages integer not null default 50;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_remaining_messages_nonnegative'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_remaining_messages_nonnegative
      check (remaining_messages >= 0);
  end if;
end;
$$;

create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

alter table public.classrooms
  alter column join_code set default public.generate_join_code();

create or replace function public.validate_classroom_owner()
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

drop trigger if exists validate_classroom_owner_trigger
on public.classrooms;

create trigger validate_classroom_owner_trigger
before insert or update of owner_id
on public.classrooms
for each row
execute function public.validate_classroom_owner();
