import { createClient } from "@/lib/supabase/client";
import { setTeacherMode } from "@/lib/teacherMode";

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
  if (!data.session) {
    setNotice("Check your email to confirm your account, then log in.");
    return;
  }
  const requestedTeacher = accountType === "Teacher";
  setTeacherMode(requestedTeacher);
  router.push(requestedTeacher ? "/teacherdash" : "/classrooms");
  router.refresh();
}
