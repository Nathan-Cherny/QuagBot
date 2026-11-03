// Explicit live check: creates one test conversation and sends two real AI requests.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { callAI, createAIConversation, listAIConversations, listAIMessages, parseChatResponse, readResponse } from '../src/lib/ai-backend.mjs';

const userId = `quagbot-smoke-${randomUUID()}`;
try {
  const conversation = await createAIConversation({ userId, title: 'QuagBot integration smoke test' });
  if (typeof conversation?.id !== 'string' || !conversation.id.trim()) throw new Error('Missing conversation ID');
  console.log(`Created conversation: ${conversation.id}`);
  for (const message of ['Who commanded the Continental Army during the American Revolutionary War? Answer briefly.', 'What was his role at Yorktown? Answer briefly.']) {
    console.log(`Question: ${message}`);
    const payload = await callAI('/chat/stream', {
      userId, body: { conversation_id: conversation.id, message },
    }, async (response) => {
      const text = await readResponse(response);
      const type = response.headers.get('content-type') ?? '';
      console.log(`Backend format: ${type}`);
      try { return parseChatResponse(text, type); }
      catch (error) {
        console.error('Unexpected backend response (first 2000 characters):', text.slice(0, 2000));
        throw error;
      }
    });
    console.log(`Answer: ${payload.reply}\n`);
  }
  const conversations = await listAIConversations({ userId });
  assert.ok(conversations.some((item) => item.id === conversation.id), 'Created conversation is listed');
  const saved = await listAIMessages({ userId, conversationId: conversation.id });
  assert.equal(saved.filter((item) => item.role === 'user').length, 2);
  assert.equal(saved.filter((item) => item.role === 'assistant' && item.status === 'completed').length, 2);
  const otherUserHistory = await listAIConversations({ userId: `quagbot-smoke-${randomUUID()}` });
  assert.ok(!otherUserHistory.some((item) => item.id === conversation.id), 'Other users must not receive this conversation');
  console.log(`Restored ${saved.length} saved messages; separate user history is isolated.`);
  console.log('PASS: live creation, follow-up, saved history, and user separation.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
