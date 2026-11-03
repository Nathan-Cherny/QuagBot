# QuagBot local development

Use Node.js 22.15+ and run these commands from this directory:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

If `.env.local` already exists, retain its Supabase values and add:

```dotenv
AI_API_URL=https://runberry-694004167309.us-east4.run.app
```

`AI_API_URL` is server-only. The adapter also accepts the older `NEXT_PUBLIC_API_URL`
for compatibility. Restart Next.js after changing environment variables. Sign in at
http://localhost:3000 using a Supabase account.

## AI request flow

The first question creates a backend conversation, then sends the question to
`/chat/stream`. The Next.js routes verify the Supabase session and forward its user
ID as `X-User-ID`. They never trust a user ID supplied by the browser. Conversation
creation configures the Revolutionary War instructions through AI Infra's
`PUT /me/system-prompt` endpoint rather than adding them to every user message.

The server reads the SSE response and returns its final answer as `{ reply }`.
Replies display as Markdown. Backend calls have a 60-second timeout and a 2 MiB
response limit. Switching chats cancels the browser request and prevents late
answers from appearing in another chat.

Conversation history loads from AI Infra on sign-in and when you refresh the
history sidebar. Selecting an AI chat fetches its saved messages before allowing a
follow-up, so conversations can be continued from another browser. Local caches
remain readable if synchronization fails; retry the load before continuing.
Failed/pending assistant records are never displayed as completed answers.
Browser-only unsent questions are retained when refreshing messages.

Titles and appearance preferences are saved in this browser
per account. Backend conversation IDs are saved with new chats, so reopening them
uses the same AI context. Older practice chats remain readable but cannot be continued as AI
conversations. Renaming a chat affects this browser only. AI chat deletion requires
a backend deletion endpoint and is not offered. Local practice chats can still be deleted. Document retrieval, citations, and incremental rendering remain
separate work.

## Checks

```bash
npm test
npm run lint
npm run build
```

`npm test` uses a temporary local HTTP server, not the live AI service. It covers
conversation creation and retry, system prompt setup, follow-up identity, SSE
heartbeats and errors, malformed/empty answers, response limits, timeout, and cancellation.

For an explicit live check:

```bash
npm run test:ai
```

This reads `.env.local`, creates a uniquely identified test user/conversation, and
sends two real AI requests, then verifies saved conversations/messages and user separation. It tests the server adapter against AI Infra, without
signing in through Supabase. Test data remains on the backend. It does not prove a
browser session works; complete the signed-in walkthrough below as well.

## Signed-in local walkthrough

1. Sign in, send a Revolutionary War question, and confirm a real answer appears.
2. Ask a follow-up referring to the previous answer.
3. Start a new chat, ask another question, then reopen the first chat and continue it.
4. Reload and confirm saved chats and backend IDs are retained.
5. Switch chats while an answer is pending; it must not appear in the selected chat.
6. To test recovery, temporarily set `AI_API_URL=http://localhost:9999`, restart,
   and send a question. Restore the real URL, restart, and use **Try again**.
7. Open another browser, sign in to the same account, and refresh history. Open a
   saved AI conversation and continue it. Check a different account does not list it.
8. Rename a chat and refresh; its browser-only title stays intact.
9. A signed-out GET to history/messages or POST to either API route must return JSON with HTTP 401.

The backend does not document an idempotency key. Retrying a request after a lost
response can create another backend turn; the frontend avoids duplicating the
visible user question, but cannot guarantee exactly-once backend processing.
