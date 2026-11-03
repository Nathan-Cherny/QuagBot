// Client-side helper for the /api/conversations route handler.
export async function createConversation(title = "New Chat") {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  // The body can be empty or non-JSON on failure, so don't let res.json() throw.
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error ?? `Create conversation failed: ${res.status}`);
  }

  return data;
}
