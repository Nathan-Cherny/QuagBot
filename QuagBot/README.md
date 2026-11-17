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

## Browser-only history (temporary)

Saved conversations, messages, custom titles, and appearance preferences use
`localStorage`, keyed by the signed-in Supabase user. Opening an older conversation
reads its locally saved messages immediately; the UI makes no AI history GET
requests on sign-in, reload, rename, deletion, or chat selection.

All chats can be renamed or deleted in this browser. Deletion removes the local
record permanently, after confirmation; it does not delete an AI Infra record.
The same origin/browser/profile must be used to see these chats. Other browsers,
ports, devices, or cleared browser storage do not share this history. A history
read failure preserves the existing stored value and keeps new chats in memory.

Existing local messages and backend conversation IDs are retained. Metadata-only
entries from the earlier remote sync have no locally saved messages to display;
the UI explains this instead of showing a fake conversation. Older practice chats
remain read-only. Opening a cached chat never requires AI Infra, but sending a
follow-up still uses its backend conversation ID. A missing backend conversation
can still return 404 when sending; it cannot be recovered by local storage.

The AI history routes, client helpers, and reconciliation code remain available
for future integration, separate from `src/lib/browserHistory.mjs`. Before
reconnecting synchronization, decide how local deletions, custom titles, and
unsent messages should merge; do not silently restore deleted local records.
Document retrieval, citations, and incremental rendering remain separate work.

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
7. Rename a saved AI chat and reload; its title and messages remain available.
8. Delete a saved AI chat, reload, and verify it stays deleted in this browser.
9. Open a cached chat while AI Infra is unavailable: local messages still display.
   In Network, opening chats must not request `/api/conversations` or `/messages`.
10. Sign in as another user: their history must be separate. Another browser or
    port does not share this browser's local history.
11. A signed-out GET to history/messages or POST to either API route must return JSON with HTTP 401.

The backend does not document an idempotency key. Retrying a request after a lost
response can create another backend turn; the frontend avoids duplicating the
visible user question, but cannot guarantee exactly-once backend processing.

### AI downtime

Set `AI_MAINTENANCE_MODE=true` in the server environment and restart/redeploy to pause outgoing AI calls. The chat shows a maintenance notice; browser history remains accessible and chat uses local backup answers with a limited-capabilities notice. Questions beyond the prepared material receive an outage notice. Set it to `false` and restart/redeploy to restore chat. Open tabs check the maintenance setting every 30 seconds and automatically resume AI requests once maintenance is disabled and any cooldown has expired. The status endpoint only reads configuration and does not call the AI backend.

Failed service requests fall back to prepared answers and trigger a 30-second cooldown on AI requests across chats, extended by upstream `Retry-After` for 429/503 responses (up to 24 hours). There are no automatic AI retries. This cooldown is a UX safeguard, not an enforceable usage quota; server-side rate limits and cloud cost controls are still needed. Prepared answers require the frontend to be reachable; this does not add full offline/PWA support.
