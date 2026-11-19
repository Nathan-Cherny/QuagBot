'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, Share2 } from 'lucide-react';
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
      <header className="mb-space-5 border-b border-border pb-space-4">
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <Link href="/" className="text-lg font-semibold text-text">QuagBot</Link>
          <span className="inline-flex items-center gap-space-2 rounded-full border border-border bg-surface px-space-3 py-space-1 text-xs text-text-muted"><Share2 size={13} aria-hidden="true" /> Shared snapshot · Read only</span>
        </div>
        <h1 className="mt-space-5 break-words text-2xl font-semibold">{snapshot?.title || 'Shared conversation'}</h1>
        <p className="mt-space-2 text-sm text-text-muted">Anyone with this link can view it. No sign-in required.</p>
      </header>
      {error && <p role="alert" className="text-error">{error}</p>}
      {!fragment && <p role="status">Open the complete shared link, including the part after #, to view this conversation.</p>}
      {snapshot && <>
        <div className="flex flex-col gap-space-5">
          {snapshot.messages.map((message, index) => <article key={index} className={`min-w-0 max-w-[90%] rounded-card p-space-4 [overflow-wrap:anywhere] ${message.role === 'user' ? 'self-end rounded-br-[2px] bg-user-bubble text-accent-contrast' : 'self-start rounded-bl-[2px] border border-border bg-quagbot-bubble text-text'}`}>
            <h2 className={`mb-space-2 text-xs font-semibold ${message.role === 'user' ? 'opacity-75' : 'text-text-muted'}`}>{message.role === 'user' ? 'Author' : 'QuagBot'}</h2>
            {message.role === 'user' ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p> : <MarkdownMessage text={message.text} />}
          </article>)}
        </div>
        <footer className="mt-space-5 border-t border-border pt-space-4">
          <p className="mb-space-3 text-xs text-text-muted">This snapshot may include local fallback answers. Later messages aren’t included.</p>
          <Link href="/" className="inline-flex items-center gap-space-2 rounded-card bg-accent px-space-4 py-space-2 text-sm font-medium text-accent-contrast hover:brightness-95 focus-visible:outline-2 focus-visible:outline-important-border"><MessageSquarePlus size={16} aria-hidden="true" /> Start your own chat</Link>
        </footer>
      </>}
    </main>
  );
}
