import { isDocumentId, normalizeCitations } from './pdfCitations.mjs';
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

export async function readResponse(response, onText) {
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
      const chunk = decoder.decode(value, { stream: true });
      if (onText) onText(chunk);
      else text += chunk;
    }
    const tail = decoder.decode();
    if (onText) onText(tail);
    return text + tail;
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
  const citations = normalizeCitations(payload?.citations);
  return citations === undefined ? { reply } : { reply, citations };
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
  const parser = createChatParser();
  parser.push(text);
  return parser.finish();
}

function createChatParser(onUpdate) {
  let buffer = '';
  let completed;

  function parseEvent(block) {
    let event = 'message';
    const lines = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''));
    }
    const raw = lines.join('\n');
    if (!raw || raw.trim() === '[DONE]') return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new AIError('The AI service returned an invalid stream.');
    }
    const status = data?.status ?? data?.type ?? event;
    if (['error', 'failed'].includes(status) || ['error', 'failed'].includes(event)) {
      throw new AIError('The AI service could not complete this answer. Please try again.');
    }
    if (status === 'completed' || event === 'completed') {
      completed = normalizeReply(data?.response);
      return;
    }
    if (completed || !onUpdate) return;

    const delta = data?.delta ?? ((status === 'delta' || event === 'delta') ? data?.text ?? data?.response ?? data : null);
    if (typeof delta === 'string' && delta) {
      onUpdate({ type: 'delta', text: delta });
    } else if (typeof status === 'string' && status !== 'message' && status !== 'delta') {
      const label = typeof data?.message === 'string' ? data.message : status.replaceAll('_', ' ');
      onUpdate({ type: 'progress', label });
    }
  }

  return {
    push(chunk) {
      buffer += chunk;
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop();
      for (const block of blocks) parseEvent(block);
    },
    finish() {
      if (buffer) parseEvent(buffer);
      if (!completed) {
        throw new AIError('The AI service ended without an answer. Please try again.');
      }
      return completed;
    },
  };
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
    const multipart = body instanceof FormData;
    const response = await fetch(`${base.href.replace(/\/$/, "")}${path}`, {
      method,
      headers: multipart
        ? { "X-User-ID": userId }
        : { "Content-Type": "application/json", "X-User-ID": userId },
      body: multipart ? body : method === "GET" ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      if (multipart && [400, 413, 422].includes(response.status)) {
        const data = await readJSONResponse(response).catch(() => null);
        const fallback = response.status === 413 ? 'The PDF exceeds the AI service upload limit.' : 'The AI service could not process this PDF.';
        const message = data?.message ?? data?.detail?.message;
        throw new AIError(typeof message === 'string' && message.trim() ? message : fallback, response.status);
      }
      await response.body?.cancel();
      if (
        response.status === 404 &&
        (path === "/chat" ||
          /^\/conversations\/[^/]+(?:\/messages)?$/.test(path))
      ) {
        throw new AIError(
          body?.document_id
            ? "The selected PDF or conversation is unavailable for your account."
            : "This conversation is no longer available for your account.",
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

export function sendAIMessage({ userId, conversationId, message, documentId, signal, onUpdate }) {
  return callAI('/chat', {
    userId,
    body: { conversation_id: conversationId, message, ...(documentId && { document_id: documentId }) },
    signal,
  }, async (response) => {
    const contentType = response.headers.get('content-type') ?? '';
    if (!onUpdate || contentType.includes('application/json')) {
      return validateDocumentReply(parseChatResponse(await readResponse(response), contentType), documentId);
    }
    const parser = createChatParser(onUpdate);
    await readResponse(response, parser.push);
    return validateDocumentReply(parser.finish(), documentId);
  });
}

function validateDocumentReply(result, documentId) {
  if (documentId && (!result.citations || result.citations.some((citation) => citation.document_id !== documentId))) {
    throw new AIError("The PDF answer could not be verified against the selected document.", 422);
  }
  return result;
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
  return records.filter((record) => record.domain === "education").map((record) => ({
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
  return records.map(({ id, role, content, status, created_at, citations, document_id }) => ({
    id,
    role,
    content,
    status,
    created_at,
    ...(role === "assistant" && Array.isArray(citations) && { citations: normalizeCitations(citations) }),
    ...(role === "user" && isDocumentId(document_id) && { document_id }),
  }));
}

export async function deleteAIConversation({
  userId,
  conversationId,
  signal,
}) {
  await callAI(
    `/conversations/${encodeURIComponent(conversationId)}`,
    { userId, signal, method: 'DELETE' },
    async () => null,
  );
}

export async function listAIDocuments({ userId, signal }) {
  const records = await callAI('/upload?domain=education', {
    userId, signal, method: 'GET',
  }, readJSONResponse);
  if (!Array.isArray(records) || records.some((record) =>
    typeof record?.id !== 'string' || typeof record.filename !== 'string'
  )) {
    throw new AIError('The AI service returned an invalid document list.');
  }
  return records.map((record) => ({
    id: record.id,
    filename: record.filename,
    ...processingFields(record),
  }));
}

function processingFields(record) {
  return {
    status: typeof record.status === 'string' && record.status.trim() ? record.status : null,
    embedding_status: typeof record.embedding_status === 'string' && record.embedding_status.trim()
      ? record.embedding_status
      : null,
    chunk_count: Number.isSafeInteger(record.chunk_count) && record.chunk_count >= 0
      ? record.chunk_count
      : null,
  };
}

export async function uploadAIPDF({ userId, file, signal }) {
  const body = new FormData();
  body.set('domain', 'education');
  body.append('files', file, file.name);
  const records = await callAI('/upload', { userId, body, signal }, readJSONResponse);
  if (!Array.isArray(records) || records.length !== 1 || typeof records[0]?.success !== 'boolean') {
    throw new AIError('The AI service returned an invalid upload result.');
  }
  const result = records[0];
  if (!result.success) {
    throw new AIError(
      typeof result.message === 'string' && result.message.trim()
        ? result.message
        : 'The AI service could not process this PDF.',
      422,
    );
  }
  if (typeof result.document_id !== 'string' || !result.document_id.trim()) {
    throw new AIError('The AI service did not return a document ID.');
  }
  return {
    id: result.document_id,
    filename: typeof result.filename === 'string' ? result.filename : file.name,
    ...processingFields(result),
  };
}

export async function listEducationSources({ userId, signal }) {
  const records = await callAI('/uploadedu', { userId, signal, method: 'GET' }, readJSONResponse);
  if (!Array.isArray(records)) throw new AIError('The education source list is unavailable.');
  return records.filter((record) =>
    typeof record?.id === 'string' && typeof record.filename === 'string'
  ).map(({ id, filename, metadata }) => {
    const source = metadata?.education;
    return {
      id,
      filename,
      title: typeof source?.title === 'string' && source.title.trim() ? source.title : filename,
      authors: Array.isArray(source?.authors) ? source.authors.filter((author) => typeof author === 'string') : [],
      citation: typeof source?.citation === 'string' ? source.citation : null,
    };
  });
}
