-- Classrooms use the existing authenticated profiles and server-managed teacher role.
alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;

revoke insert, update, delete on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.classrooms, public.classroom_members from public, anon, authenticated;
grant select on public.classrooms, public.classroom_members to authenticated;
grant insert (name, owner_id) on public.classrooms to authenticated;

create or replace function public.is_classroom_owner(classroom_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.classrooms c
    join public.profiles p on p.id = c.owner_id
    where c.id = classroom_id and c.owner_id = auth.uid() and p.role = 'teacher'
  );
$$;

revoke all on function public.is_classroom_owner(uuid) from public, anon;
grant execute on function public.is_classroom_owner(uuid) to authenticated;

drop policy if exists "owners read their classrooms" on public.classrooms;
create policy "owners read their classrooms" on public.classrooms
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "teachers create classrooms" on public.classrooms;
create policy "teachers create classrooms" on public.classrooms
  for insert to authenticated with check (
    owner_id = (select auth.uid()) and char_length(btrim(name)) between 1 and 100
    and exists (select 1 from public.profiles p where p.id = owner_id and p.role = 'teacher')
  );

create policy "members read their classrooms" on public.classrooms
  for select to authenticated using (exists (
    select 1 from public.classroom_members m
    where m.class_id = classrooms.id and m.user_id = (select auth.uid())
  ));

create policy "classroom membership visibility" on public.classroom_members
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_classroom_owner(class_id)
  );

create or replace function public.join_classroom(code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  classroom_id uuid;
  member_id uuid := auth.uid();
begin
  if not exists (select 1 from public.profiles where id = member_id and role = 'student') then
    raise exception 'Only student accounts can join a classroom';
  end if;
  select id into classroom_id from public.classrooms where join_code = upper(btrim(code));
  if classroom_id is null then raise exception 'Classroom code was not found'; end if;

  insert into public.classroom_members (class_id, user_id)
  values (classroom_id, member_id) on conflict do nothing;
  return classroom_id;
end;
$$;

create or replace function public.classroom_roster(classroom_id uuid)
returns table (student_id uuid, display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.display_name), ''), 'Student')
  from public.classroom_members m join public.profiles p on p.id = m.user_id
  where m.class_id = classroom_id and public.is_classroom_owner(classroom_id)
  order by p.display_name, p.id;
$$;

revoke all on function public.join_classroom(text), public.classroom_roster(uuid) from public, anon;
grant execute on function public.join_classroom(text), public.classroom_roster(uuid) to authenticated;

create table public.classroom_activities (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 4000),
  source_id text not null check (char_length(btrim(source_id)) between 1 and 200),
  source_title text not null check (char_length(btrim(source_title)) between 1 and 500),
  published_at timestamptz not null default now()
);

create index classroom_activities_classroom_idx on public.classroom_activities (classroom_id, published_at desc);

create table public.classroom_activity_progress (
  activity_id uuid not null references public.classroom_activities(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  response text check (response is null or char_length(btrim(response)) between 1 and 4000),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  primary key (activity_id, student_id),
  check ((response is null) = (submitted_at is null))
);

alter table public.classroom_activities enable row level security;
alter table public.classroom_activity_progress enable row level security;

revoke all on public.classroom_activities, public.classroom_activity_progress from public, anon, authenticated;
grant select on public.classroom_activities, public.classroom_activity_progress to authenticated;
grant insert (classroom_id, title, prompt, source_id, source_title) on public.classroom_activities to authenticated;

create policy "classroom activity visibility" on public.classroom_activities
  for select to authenticated using (
    public.is_classroom_owner(classroom_id) or exists (
      select 1 from public.classroom_members m
      where m.class_id = classroom_id and m.user_id = (select auth.uid())
    )
  );

create policy "teachers publish activities to their classrooms" on public.classroom_activities
  for insert to authenticated with check (public.is_classroom_owner(classroom_id));

create policy "student and teacher progress visibility" on public.classroom_activity_progress
  for select to authenticated using (
    student_id = (select auth.uid()) or exists (
      select 1 from public.classroom_activities a
      where a.id = activity_id and public.is_classroom_owner(a.classroom_id)
    )
  );

create or replace function public.record_classroom_activity(target_activity_id uuid, answer text default null)
returns public.classroom_activity_progress
language plpgsql security definer set search_path = ''
as $$
declare
  member_id uuid := auth.uid();
  progress public.classroom_activity_progress;
begin
  if not exists (
    select 1 from public.classroom_activities a
    join public.classroom_members m on m.class_id = a.classroom_id
    where a.id = target_activity_id and m.user_id = member_id
  ) then
    raise exception 'Activity is unavailable for your account';
  end if;

  insert into public.classroom_activity_progress (activity_id, student_id, response, submitted_at)
  values (target_activity_id, member_id, btrim(answer), case when answer is not null then now() end)
  on conflict (activity_id, student_id) do update
    set response = excluded.response, submitted_at = excluded.submitted_at
    where excluded.submitted_at is not null
  returning * into progress;

  if not found then
    select * into progress from public.classroom_activity_progress
    where activity_id = target_activity_id and student_id = member_id;
  end if;
  return progress;
end;
$$;

revoke all on function public.record_classroom_activity(uuid, text) from public, anon;
grant execute on function public.record_classroom_activity(uuid, text) to authenticated;
