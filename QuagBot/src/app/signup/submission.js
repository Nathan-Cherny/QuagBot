import { createClient } from "@/lib/supabase/client";

export async function handleSubmit(
  event,
  { name, email, password, accountType, setError, setNotice, setSubmitting, router },
) {
  event.preventDefault();
  setError("");
  setNotice("");
  setSubmitting(true);

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Store the selected account type in user metadata.
    options: { data: { display_name: name, account_type: accountType.toLowerCase() } },
  });

  setSubmitting(false);
  if (error) {
    setError(error.message);
    return;
  }
  /* Teacher share-code loading and notification will be implemented later.
  if (accountType === "Teacher") {
    let shareCode = data.user?.user_metadata?.teacher_share_code;
    if (data.session) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("teacher_share_code")
        .eq("id", data.user.id)
        .single();
      if (profileError) {
        setError(`Account created, but the share code could not be loaded: ${profileError.message}`);
        return;
      }
      shareCode = profile.teacher_share_code;
    }
    if (shareCode) {
      setNotice(`Your teacher share code is ${shareCode}. Share it with your students to connect them.`);
      return;
    }
    setNotice("Check your email to confirm your account. Your teacher share code will be available on your profile after you log in.");
    return;
  }
  */
  // With "Confirm email" on, Supabase creates the user but no session yet.
  if (!data.session) {
    setNotice("Check your email to confirm your account, then log in.");
    return;
  }
  // TODO: connecting to a teacher needs the classrooms join-code flow; do it after login.
  router.push("/");
  router.refresh();
}
