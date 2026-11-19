const DAILY_LIMIT = 50;

export async function checkAndDecrease(supabase) {
  const { data: { user }, error: authError,} = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Failed to get authenticated user", authError);
    return false;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("remaining_messages, last_message_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Something Went Wrong - Profile not found", error);
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  const lastMessageDate = profile.last_message_at;
  let remainingMessages = profile.remaining_messages;

  if (lastMessageDate !== today) {
    remainingMessages = DAILY_LIMIT;
  }

  if (remainingMessages <= 0) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      remaining_messages: remainingMessages - 1,
      last_message_at: today,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to update remaining messages", updateError);
    return false;
  }

  console.error(lastMessageDate);
  console.error(today);

  return true;
}