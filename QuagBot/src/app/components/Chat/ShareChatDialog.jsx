import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { createPublicChatLink } from '../../../lib/publicChatShare.mjs';

const BUTTON = 'cursor-pointer rounded-card border px-space-3 py-space-2 text-sm focus-visible:outline-2 focus-visible:outline-important-border disabled:cursor-not-allowed disabled:opacity-50';

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
  const [copying, setCopying] = useState(false);

  async function copyLink() {
    setError('');
    setStatus('');
    setCopying(true);
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied.');
    } catch {
      linkRef.current.focus();
      linkRef.current.select();
      setError('Could not copy automatically. Select and copy the link above.');
    } finally { setCopying(false); }
  }

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
      <div className="flex items-center justify-between gap-space-3">
        <h2 id="share-chat-title" className="flex items-center gap-space-2 text-lg font-semibold"><Share2 size={19} aria-hidden="true" /> Share chat</h2>
        <button type="button" aria-label="Close sharing" onClick={onClose} className="cursor-pointer rounded-card p-space-2 text-text-muted hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border"><X size={18} aria-hidden="true" /></button>
      </div>
      <p className="mt-space-3 truncate font-medium" title={title}>{title}</p>
      <p className="my-space-3 text-sm text-text-muted">Anyone with this link can view this snapshot. No sign-in needed.</p>
      {error && <p role="alert" className="my-space-3 text-sm text-error">{error}</p>}
      {link && <div>
        <label htmlFor="public-chat-link" className="block text-sm font-medium">Chat link</label>
        <div className="mt-space-2 flex flex-wrap items-center gap-space-2">
          <input id="public-chat-link" ref={linkRef} value={link} readOnly onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-card border border-border bg-bg p-space-2 text-sm" />
          <button type="button" onClick={copyLink} disabled={copying || sharing} className={`${BUTTON} inline-flex items-center gap-space-2 border-border hover:bg-navbar-bg`}>
            {status === 'Link copied.' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copying ? 'Copying…' : status === 'Link copied.' ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>}
      <p className="mt-space-2 text-xs text-text-muted">New messages won’t appear in this link. Access can’t be revoked.</p>
      <p role="status" className="my-space-2 text-sm">{status}</p>
      <div className="flex justify-end gap-space-2">
        <button type="button" className={`${BUTTON} border-border hover:bg-navbar-bg`} onClick={onClose}>Close</button>
        <button type="button" className={`${BUTTON} inline-flex items-center gap-space-2 border-transparent bg-accent font-medium text-accent-contrast enabled:hover:brightness-95`} onClick={shareLink} disabled={!link || sharing || copying}><Share2 size={16} aria-hidden="true" />{sharing ? 'Sharing…' : 'Share link'}</button>
      </div>
    </dialog>
  );
}
