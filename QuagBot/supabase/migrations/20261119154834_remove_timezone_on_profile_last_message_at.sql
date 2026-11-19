alter table public.profiles
alter column last_message_at type date
using last_message_at::date;