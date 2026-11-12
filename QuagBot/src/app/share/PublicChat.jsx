'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import MarkdownMessage from '../components/Chat/MarkdownMessage';
import { decodeChatSnapshot } from '../../lib/publicChatShare.mjs';

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
const getFragment = () => window.location.hash;
const serverFragment = () => '';

export default function PublicChat() {
  const fragment = useSyncExternalStore(subscribe, getFragment, serverFragment);
  let snapshot;
  let error;
  if (fragment) {
    try { snapshot = decodeChatSnapshot(fragment); }
    catch (failure) { error = failure.message; }
  }
  return (
    <main className="mx-auto w-full max-w-3xl p-space-5">
      <Link href="/" className="text-accent underline">QuagBot</Link>
      <h1 className="my-space-4 break-words text-xl font-semibold">{snapshot?.title || 'Shared conversation'}</h1>
      <p className="mb-space-4 text-sm text-text-muted">Public snapshot · Read only · No sign-in required</p>
      {error && <p role="alert" className="text-error">{error}</p>}
      {!fragment && <p role="status">Open the complete shared link, including the part after #, to view this conversation.</p>}
      {snapshot && <>
        <p className="mb-space-4 text-sm text-text-muted">This is a copy of the messages shared by the sender. It may include local fallback answers and does not update with later messages.</p>
        <div className="flex flex-col gap-space-4">
          {snapshot.messages.map((message, index) => <article key={index} className="min-w-0 rounded-card border border-border bg-surface p-space-4 [overflow-wrap:anywhere]">
            <h2 className="mb-space-2 text-sm font-semibold text-text-muted">{message.role === 'user' ? 'Author' : 'QuagBot'}</h2>
            {message.role === 'user' ? <p className="whitespace-pre-wrap">{message.text}</p> : <MarkdownMessage text={message.text} />}
          </article>)}
        </div>
      </>}
    </main>
  );
}
