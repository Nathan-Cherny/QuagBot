import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { chatExportFilename, createChatTranscript, exportableMessages } from '../../../lib/chatExport';

const ACTION = 'inline-flex cursor-pointer items-center gap-space-2 rounded-card border border-border px-space-3 py-space-2 text-sm text-text hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border disabled:cursor-not-allowed disabled:opacity-50';

export default function ChatExport({ title, messages, disabled }) {
  const [status, setStatus] = useState('');
  const [sharing, setSharing] = useState(false);
  const unavailable = disabled || !exportableMessages(messages).length;

  function download() {
    let url;
    const link = document.createElement('a');
    try {
      url = URL.createObjectURL(new Blob([createChatTranscript(title, messages)], { type: 'text/plain;charset=utf-8' }));
      link.href = url;
      link.download = chatExportFilename(title);
      document.body.appendChild(link);
      link.click();
      setStatus('Chat exported.');
    } catch {
      setStatus('Could not export this chat. Please try again.');
    } finally {
      link.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function share() {
    setStatus('');
    setSharing(true);
    try {
      const text = createChatTranscript(title, messages);
      const data = { title, text };
      const canShare = typeof navigator.share === 'function'
        && (typeof navigator.canShare !== 'function' || navigator.canShare(data));
      if (canShare) {
        try {
          await navigator.share(data);
          setStatus('Chat shared.');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(text);
      setStatus('Chat copied. Paste it to share.');
    } catch {
      setStatus('Could not share this chat. Use Export to save a copy.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-space-2">
      <button type="button" className={ACTION} onClick={download} disabled={unavailable} title="Download this conversation as a text file">
        <Download size={16} aria-hidden="true" /> Export
      </button>
      <button type="button" className={ACTION} onClick={share} disabled={unavailable || sharing} title="Share this conversation or copy its text">
        <Share2 size={16} aria-hidden="true" /> {sharing ? 'Sharing…' : 'Share'}
      </button>
      <span role="status" className="basis-full text-right text-xs text-text-muted empty:hidden">{status}</span>
    </div>
  );
}
