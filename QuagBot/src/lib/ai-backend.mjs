// Server-side backend adapter. Never accept a user ID or backend URL from the browser.
export class AIError extends Error {
  constructor(message, status = 502, retryAfter = null) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export const MAX_MESSAGE_LENGTH = 20000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export async function readResponse(response) {
  if (!response.body)
    throw new AIError("The AI service returned an empty response.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES)
        throw new AIError("The AI service response was too large.");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function normalizeReply(payload) {
  const reply = typeof payload === "string" ? payload : payload?.reply;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new AIError("The AI service returned an invalid or empty answer.");
  }
  return { reply };
}

export function parseChatResponse(text, contentType = "") {
  if (contentType.includes("application/json")) {
    try {
      return normalizeReply(JSON.parse(text));
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError("The AI service returned invalid JSON.");
    }
  }
  let completed;
  for (const block of text.split(/\r?\n\r?\n/)) {
    let event = "message";
    const lines = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) lines.push(line.slice(5).replace(/^ /, ""));
    }
    const raw = lines.join("\n");
    if (!raw || raw.trim() === "[DONE]") continue;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new AIError("The AI service returned an invalid stream.");
    }
    if (
      event === "error" ||
      data?.status === "error" ||
      data?.status === "failed"
    ) {
      throw new AIError(
        "The AI service could not complete this answer. Please try again.",
      );
    }
    if (data?.status === "completed" || event === "completed") {
      completed = normalizeReply(data?.response);
    }
  }
  if (!completed)
    throw new AIError(
      "The AI service ended without an answer. Please try again.",
    );
  return completed;
}

export async function callAI(path, { userId, body, signal, timeoutMs = 60000, method = 'POST' }, consume) {
  if (process.env.AI_MAINTENANCE_MODE === 'true') {
    throw new AIError('AI chat is temporarily unavailable. You can still view your saved chats and continue with limited capabilities.', 503, 60);
  }
  const configured = process.env.AI_API_URL || process.env.NEXT_PUBLIC_API_URL;
  let base;
  try {
    base = new URL(configured);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new Error();
  } catch {
    throw new AIError(
      "The AI service URL is not configured. Set AI_API_URL on the server.",
      503,
    );
  }
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort, { once: true });

  try {
    const response = await fetch(`${base.href.replace(/\/$/, "")}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-User-ID": userId },
      body: method === "GET" ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {

      console.log(
        `${base.href.replace(/\/$/, "")}${path} \n ${JSON.stringify(body)} ${method}`,
      );
      await response.body?.cancel();
      if (
        response.status === 404 &&
        (path === "/chat/stream" ||
          /^\/conversations\/[^/]+\/messages$/.test(path))
      ) {
        throw new AIError(
          "This conversation is no longer available for your account. Any locally saved messages are kept. Start a new chat to continue.",
          404,
        );
      }
      if (response.status === 429 || response.status === 503) {
        const raw = response.headers.get('retry-after');
        const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : Math.ceil((Date.parse(raw) - Date.now()) / 1000);
        const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 86400) : 30;
        throw new AIError(response.status === 429 ? 'Too many requests. Please wait before trying again.' : 'AI chat is temporarily unavailable. Please try again later.', response.status, retryAfter);
      }
      throw new AIError(`The AI service rejected the request (${response.status}). Please try again.`);
    }

    return await consume(response);
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (timedOut)
      throw new AIError(
        "The AI service took too long to respond. Please try again.",
        504,
      );
    if (signal?.aborted) throw new AIError("The request was cancelled.", 499);
    throw new AIError("Could not reach the AI service. Please try again.", 502);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

// AI Infra exposes a dedicated per-user system prompt endpoint. Keep these
// instructions out of user messages so chat history contains only their question.
const SYSTEM_PROMPT = `You are QuagBot, a study companion focused on the American Revolutionary War. Answer clearly in Markdown. If a question is unrelated, politely explain your scope. Never invent citations or claim to have consulted documents you were not given. If evidence is unavailable, say so.`;

export async function createAIConversation({ userId, title, signal }) {
  await callAI(
    "/me/system-prompt",
    {
      userId,
      body: { prompt: SYSTEM_PROMPT },
      method: "PUT",
      signal,
    },
    readResponse,
  );
  return callAI(
    "/conversations",
    {
      userId,
      body: { title, domain: "education" },
      signal,
    },
    async (response) => {
      let data;
      try {
        data = JSON.parse(await readResponse(response));
      } catch (error) {
        if (error instanceof AIError) throw error;
        throw new AIError("The AI service returned invalid conversation data.");
      }
      if (typeof data?.id !== "string" || !data.id.trim())
        throw new AIError("The AI service did not provide a conversation ID.");
      return { id: data.id };
    },
  );
}

export async function readJSONResponse(response) {
  const text = await readResponse(response);
  try {
    return JSON.parse(text);
  } catch {
    throw new AIError("The AI service returned invalid JSON.");
  }
}

export async function listAIConversations({ userId, signal }) {
  const records = await callAI(
    "/conversations",
    { userId, signal, method: "GET" },
    readJSONResponse,
  );
  if (
    !Array.isArray(records) ||
    records.some(
      (record) =>
        typeof record?.id !== "string" || typeof record.title !== "string",
    )
  ) {
    throw new AIError("The AI service returned invalid conversation history.");
  }
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    updated_at: record.updated_at,
    created_at: record.created_at,
  }));
}

export async function listAIMessages({ userId, conversationId, signal }) {
  const records = await callAI(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      userId,
      signal,
      method: "GET",
    },
    readJSONResponse,
  );
  if (
    !Array.isArray(records) ||
    records.some(
      (record) =>
        typeof record?.id !== "string" ||
        typeof record.content !== "string" ||
        !["user", "assistant"].includes(record.role) ||
        !["pending", "completed", "failed"].includes(record.status),
    )
  ) {
    throw new AIError("The AI service returned invalid messages.");
  }
  return records.map(({ id, role, content, status, created_at }) => ({
    id,
    role,
    content,
    status,
    created_at,
  }));
}
