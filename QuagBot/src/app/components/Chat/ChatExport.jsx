import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import ShareChatDialog from './ShareChatDialog';
import { chatExportFilename, createChatTranscript, exportableMessages } from '../../../lib/chatExport';

const ACTION = 'inline-flex cursor-pointer items-center gap-space-2 rounded-card border border-border px-space-3 py-space-2 text-sm text-text hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border disabled:cursor-not-allowed disabled:opacity-50';

export default function ChatExport({ title, messages, disabled }) {
  const [status, setStatus] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
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

  return (
    <div className="flex flex-wrap items-center justify-end gap-space-2">
      <button type="button" className={ACTION} onClick={download} disabled={unavailable} title="Download this conversation as a text file">
        <Download size={16} aria-hidden="true" /> Export
      </button>
      <button type="button" className={ACTION} onClick={() => setShareOpen(true)} disabled={unavailable} title="Share a public read-only snapshot">
        <Share2 size={16} aria-hidden="true" /> Share
      </button>
      {shareOpen && <ShareChatDialog messages={messages} title={title} onClose={() => setShareOpen(false)} />}
      <span role="status" className="basis-full text-right text-xs text-text-muted empty:hidden">{status}</span>
    </div>
  );
}
