import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Menu, SquarePen } from 'lucide-react';
import ChatMessage from './ChatMessage';
import Link from 'next/link';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import ChatExport from './ChatExport';

const HEADER_ACTION = 'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-card text-text hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border';

function ChatWindow({ messages, initialDocument, activity, activityNotice, isLoading, streamingText, streamProgress, onSend, onNewChat, responseStyle, error, onRetry, onOpenHistory, onOpenSettings, storageError, ready = true, sendDisabled = false, title = 'New chat', date, maintenance = false, cooldownSeconds = 0, syncLoading = false, syncPending = false, syncError }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const followLatest = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const displayDate = date ? new Date(date).toLocaleString() : "";

  useEffect(() => {
    const viewport = scrollRef.current;
    const content = contentRef.current;
    function onScroll() {
      const nearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
      followLatest.current = nearBottom;
      setShowJump(!nearBottom);
    }
    const observer = new ResizeObserver(() => {
      if (followLatest.current) viewport.scrollTop = viewport.scrollHeight;
      setShowJump(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight >= 80);
    });
    viewport.addEventListener('scroll', onScroll, { passive: true });
    observer.observe(content);
    observer.observe(viewport);
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  function jumpToLatest() {
    followLatest.current = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el && followLatest.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingText, isLoading, error]);

  return (
    <div data-chat-window className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-main-chat-bg">
      <header className="relative flex min-w-0 items-center gap-space-2 border-b border-border bg-surface px-space-4 py-space-2 max-[900px]:px-space-2">
        <div className="hidden shrink-0 items-center max-[900px]:flex">
          <button type="button" onClick={onOpenHistory} aria-label="History" title="History" className={HEADER_ACTION}>
            <Menu size={19} aria-hidden="true" />
          </button>
          <button type="button" onClick={onNewChat} aria-label="New chat" title="New chat" className={HEADER_ACTION}>
            <SquarePen size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-space-2">
          <h1 title={title} className="truncate text-base font-semibold text-text">{title}</h1>
          {displayDate && <span title={displayDate} className="truncate text-sm text-text-muted max-[900px]:hidden">{displayDate}</span>}
        </div>
        <ChatExport key={title + ':' + (messages[0]?.id ?? '')} title={title} messages={messages} disabled={!ready || isLoading} onOpenSettings={onOpenSettings} />
      </header>
      {(maintenance || cooldownSeconds > 0 || !ready || storageError || syncLoading || syncPending || syncError) && (
      <div className="border-b border-border px-space-4 py-space-2 text-xs text-text-muted">
        {maintenance && <p role="status" className="mt-space-2 font-medium">QuagBot is running with limited capabilities while our AI service is temporarily unavailable. You can keep chatting, though some questions may need to wait.</p>}
        {cooldownSeconds > 0 && <p role="status">QuagBot is running with limited capabilities due to a connection issue. You can keep chatting. We’ll try the AI service again on your next message in {cooldownSeconds} seconds.</p>}
        {!ready && <span role="status"> Loading your chats…</span>}
        {storageError && <p role="alert" className="mt-space-1 text-error">{storageError}</p>}
        {syncLoading && <p role="status">Syncing messages… Cached messages remain visible.</p>}
        {!syncLoading && syncPending && <p role="status">Waiting for the saved reply. This chat updates automatically.</p>}
        {!syncLoading && syncError && <p role="status">{syncError}</p>}
      </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-space-5 max-[900px]:p-space-3 [overflow-anchor:none]" ref={scrollRef}>
          <div ref={contentRef} className="flex flex-col gap-space-3">
            {messages.map((message) => (
              <ChatMessage key={message.id} role={message.role} text={message.text} linkedDocument={message.linkedDocument} citations={message.citations} isPDF={message.isPDF} responseStyle={responseStyle} animateWelcome={message.id === 'welcome' && !messages.some((item) => item.role === 'user')} />
            ))}

            {!sendDisabled && !messages.some((message) => message.role === 'user') && (
              <SuggestedQuestions onSelect={onSend} disabled={isLoading || sendDisabled || !ready} />
            )}

            {(isLoading || streamingText) && (
              <ChatMessage role="quagbot" text={streamingText} responseStyle={responseStyle} streaming
                progress={isLoading ? (streamProgress || (streamingText ? 'Writing answer…' : 'QuagBot is responding…')) : null} />
            )}
            {error && (
              <div role="alert" className="max-w-md self-start rounded-card border border-danger-border bg-danger-bg p-space-3 text-sm text-error">
                <p>{error}</p>
                <button type="button" onClick={onRetry} disabled={isLoading || sendDisabled || !ready} className="mt-space-2 cursor-pointer rounded-card border border-danger-border bg-surface px-space-3 py-space-2 font-medium hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-50">
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {showJump && (
          <button type="button" onClick={jumpToLatest} className="absolute bottom-space-3 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-space-2 whitespace-nowrap rounded-full border border-border bg-surface px-space-3 py-space-2 text-sm text-text shadow-sm hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border">
            <ArrowDown size={16} aria-hidden="true" /> Jump to latest
          </button>
        )}
      </div>
      {activity && (
        <div className="flex flex-wrap items-center justify-between gap-space-2 border-t border-border bg-surface px-space-4 py-space-2 text-sm">
          <p className="min-w-0 break-words"><strong>{activity.title}</strong> · {activity.source_title}</p>
          <Link href="/classrooms" className="shrink-0 underline">Back to classrooms</Link>
          {activityNotice && <p className="w-full text-text-muted" role="status">{activityNotice}</p>}
        </div>
      )}
      <ChatInput initialDraft={activity ? `Using the education library source ${JSON.stringify(activity.source_title)} if available, help me work through this reading activity:\n\n${activity.prompt}` : ''} initialDocument={initialDocument} onSend={onSend} disabled={isLoading || sendDisabled || !ready} />
    </div >
  );
}

export default ChatWindow;
