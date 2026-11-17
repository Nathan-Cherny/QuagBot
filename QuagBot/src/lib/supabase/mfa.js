// Server-side MFA check, shared by proxy.js and API routes.
//
// A user who has a verified MFA factor must reach AAL2 (password + code)
// before they can use the app. Users without a factor stay at AAL1 and are
// unaffected.
//
// Why getUser() and not mfa.getAuthenticatorAssuranceLevel()?
// Without a JWT argument that helper reads the user's factor list from the
// session cookie, which the browser controls. getUser() asks Supabase directly,
// so a tampered cookie can't hide a factor and skip the code prompt.
export async function needsMfa(supabase, claims) {
  if (!claims) return false;
  if (claims.aal === "aal2") return false; // already passed the code prompt

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return true; // fail closed if we can't check

  return (data.user.factors ?? []).some((factor) => factor.status === "verified");
}
