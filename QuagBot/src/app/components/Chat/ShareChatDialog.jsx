import { useEffect, useRef, useState } from 'react';
import { createPublicChatLink } from '../../../lib/publicChatShare.mjs';

const BUTTON = 'cursor-pointer rounded-card border border-border px-space-3 py-space-2 text-sm hover:bg-navbar-bg disabled:cursor-not-allowed disabled:opacity-50';

export default function ShareChatDialog({ title, messages, onClose }) {
  const dialog = useRef(null);
  const linkRef = useRef(null);
  const [snapshot] = useState(() => {
    try { return { link: createPublicChatLink(window.location.origin, title, messages), error: '' }; }
    catch (failure) { return { link: '', error: failure.message }; }
  });
  const link = snapshot.link;
  const [error, setError] = useState(snapshot.error);
  const [status, setStatus] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  async function shareLink() {
    setError('');
    setStatus('');
    setSharing(true);
    try {
      const data = { title, url: link };
      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
        try { await navigator.share(data); setStatus('Link shared.'); return; }
        catch (failure) { if (failure?.name === 'AbortError') return; }
      }
      await navigator.clipboard.writeText(link);
      setStatus('Public link copied. Paste it to share this snapshot.');
    } catch {
      linkRef.current.focus();
      linkRef.current.select();
      setError('Select and copy the link below to share it.');
    } finally { setSharing(false); }
  }

  return (
    <dialog ref={dialog} aria-labelledby="share-chat-title" onCancel={onClose} onClose={onClose} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(32rem,92vw)] overflow-y-auto rounded-card border border-border bg-surface p-space-5 text-text backdrop:bg-black/40">
      <h2 id="share-chat-title" className="text-lg font-semibold">Share a public chat link</h2>
      <p className="mt-space-2 break-words text-sm">{title}</p>
      <p className="my-space-3 text-sm text-text-muted">Anyone with this link can read this snapshot without signing in. It includes the messages currently saved in this chat, including any local fallback answers.</p>
      <p className="mb-space-3 text-sm text-text-muted">Later messages are not included. The link contains the shared text and cannot be revoked. Long chats may need to be shared using Export.</p>
      {error && <p role="alert" className="my-space-3 text-sm text-error">{error}</p>}
      {link && <label className="block text-sm font-medium">Public conversation link
        <input ref={linkRef} value={link} readOnly aria-label="Public conversation link" onFocus={(event) => event.target.select()} className="mt-space-2 w-full rounded-card border border-border bg-bg p-space-2 text-sm" />
      </label>}
      <p role="status" className="my-space-2 text-sm">{status}</p>
      <div className="flex justify-end gap-space-2">
        <button type="button" className={BUTTON} onClick={onClose}>Close</button>
        <button type="button" className={BUTTON} onClick={shareLink} disabled={!link || sharing}>{sharing ? 'Sharing…' : 'Share link'}</button>
      </div>
    </dialog>
  );
}
