import { useEffect, useRef, useState } from 'react';
import { Download, Ellipsis, Settings, Share2 } from 'lucide-react';
import ShareChatDialog from './ShareChatDialog';
import { chatExportFilename, createChatTranscript, exportableMessages } from '../../../lib/chatExport';

const ACTION = 'inline-flex cursor-pointer items-center gap-space-2 rounded-card border border-transparent px-space-3 py-space-2 text-sm focus-visible:outline-2 focus-visible:outline-important-border disabled:cursor-not-allowed disabled:opacity-50';

export default function ChatExport({ title, messages, disabled, onOpenSettings }) {
  const [status, setStatus] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const menu = menuRef.current;
    function closeOutside(event) {
      if (!menu.contains(event.target)) menu.open = false;
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      menu.querySelector('summary').focus();
    }
    document.addEventListener('pointerdown', closeOutside);
    menu.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      menu.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function closeMenu() {
    if (!menuRef.current.open) return;
    menuRef.current.open = false;
    menuRef.current.querySelector('summary').focus();
  }

  function share() {
    closeMenu();
    setShareOpen(true);
  }
  const unavailable = disabled || !exportableMessages(messages).length;

  function download() {
    closeMenu();
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

  const actions = (
    <>
      <button type="button" className={`${ACTION} bg-accent font-medium text-accent-contrast enabled:hover:brightness-95 max-[900px]:justify-start max-[900px]:bg-transparent max-[900px]:text-text max-[900px]:enabled:hover:bg-navbar-bg`} onClick={share} disabled={unavailable} title="Share a public read-only snapshot">
        <Share2 size={16} aria-hidden="true" /> Share
      </button>
      <button type="button" className={`${ACTION} text-text-muted enabled:hover:bg-navbar-bg enabled:hover:text-text`} onClick={download} disabled={unavailable} title="Download this conversation as a text file">
        <Download size={16} aria-hidden="true" /> Export
      </button>
    </>
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-space-2">
      <div className="flex items-center gap-space-2 max-[900px]:hidden">{actions}</div>
      <details ref={menuRef} className="relative hidden max-[900px]:block">
        <summary aria-label="Chat options" title="Chat options"
          className="flex size-9 cursor-pointer list-none items-center justify-center rounded-card hover:bg-navbar-bg [&::-webkit-details-marker]:hidden">
          <Ellipsis size={21} aria-hidden="true" />
        </summary>
        <div className="absolute right-0 top-full z-20 mt-space-1 flex min-w-40 flex-col rounded-card border border-border bg-surface p-space-1 shadow-md">
          <button type="button" className={`${ACTION} hover:bg-navbar-bg`} onClick={() => { closeMenu(); onOpenSettings(); }}>
            <Settings size={16} aria-hidden="true" /> Chat settings
          </button>
          {actions}
        </div>
      </details>
      {shareOpen && <ShareChatDialog messages={messages} title={title} onClose={() => setShareOpen(false)} />}
      <span role="status" className="text-right text-xs text-text-muted empty:hidden max-[900px]:absolute max-[900px]:right-2 max-[900px]:top-full max-[900px]:z-10 max-[900px]:rounded-card max-[900px]:bg-surface max-[900px]:px-2 max-[900px]:py-1">{status}</span>
    </div>
  );
}
