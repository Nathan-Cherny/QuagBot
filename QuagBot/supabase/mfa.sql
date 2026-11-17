-- OPTIONAL extra layer: enforce MFA inside the database too.
-- The app already blocks users who skipped their code (proxy.js + ai-route.js).
-- These RESTRICTIVE policies make Postgres refuse AAL1 sessions for users who
-- have a verified factor, so even a direct API call with the publishable key
-- can't read/write their rows without the code. Pattern from Supabase's MFA docs.
--
-- Run in Supabase SQL Editor AFTER the app's MFA flow is merged and tested.
-- Add the same policy to any new table that holds user data.

create policy "mfa: require aal2 when enrolled" on public.profiles
  as restrictive to authenticated
  using (
    array[(select auth.jwt() ->> 'aal')] <@ (
      select case when count(id) > 0 then array['aal2'] else array['aal1', 'aal2'] end
      from auth.mfa_factors
      where (select auth.uid()) = user_id and status = 'verified'
    )
  );

create policy "mfa: require aal2 when enrolled" on public.classrooms
  as restrictive to authenticated
  using (
    array[(select auth.jwt() ->> 'aal')] <@ (
      select case when count(id) > 0 then array['aal2'] else array['aal1', 'aal2'] end
      from auth.mfa_factors
      where (select auth.uid()) = user_id and status = 'verified'
    )
  );
