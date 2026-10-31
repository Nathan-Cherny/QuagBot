// Client-side helper for the /api/messages route handler.
export async function sendMessage(conversationId, message) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message }),
  });

  // The body can be empty or non-JSON on failure, so don't let res.json() throw.
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error ?? `Sending message failed: ${res.status}\n\n${res}`);
  }

  return data;
}
