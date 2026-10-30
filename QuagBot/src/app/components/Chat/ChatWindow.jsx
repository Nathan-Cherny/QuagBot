import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import NewChatButton from './NewChatButton';
import { chatAvatar, chatMessageRow } from '../ui/styles';

const TYPING_DOT = 'size-[6px] animate-typing-bounce rounded-full bg-text-muted';

function ChatWindow({ messages, isLoading, onSend, onNewChat, responseStyle, error, onRetry, onOpenHistory, storageError, ready = true, title = 'New chat' }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const followLatest = useRef(true);
  const [showJump, setShowJump] = useState(false);

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
  }, [messages, isLoading, error]);

  return (
    <div data-chat-window className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-main-chat-bg">
      <div className="min-w-0 border-b border-border bg-surface px-space-4 py-space-3">
        <h1 title={title} className="truncate text-base font-semibold text-text">{title}</h1>
      </div>
      <div className="hidden justify-center border-b border-border bg-surface px-space-4 py-space-2 max-[900px]:flex">
        <button type="button" onClick={onOpenHistory} className="mr-space-3 cursor-pointer rounded-card border border-border px-space-3 py-space-2 text-sm hover:bg-navbar-bg">History</button>
        <NewChatButton onClick={onNewChat} />
      </div>
      <div className="border-b border-border px-space-4 py-space-2 text-xs text-text-muted">
        Practice mode · Prepared answers while the AI service is being connected.
        {!ready && <span role="status"> Loading your chats…</span>}
        {storageError && <p role="alert" className="mt-space-1 text-error">{storageError}</p>}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-space-5 max-[900px]:p-space-3 [overflow-anchor:none]" ref={scrollRef}>
        <div ref={contentRef} className="flex flex-col gap-space-3">
        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} text={message.text} responseStyle={responseStyle} animateWelcome={message.id === 'welcome' && !messages.some((item) => item.role === 'user')} />
        ))}

        {!messages.some((message) => message.role === 'user') && (
          <SuggestedQuestions onSelect={onSend} disabled={isLoading || !ready} />
        )}

        {isLoading && (
          <div className={chatMessageRow}>
            <img src="/QuagBotLogo.png" alt="Bot" className={chatAvatar} />
            <div role="status" className="flex flex-wrap items-center gap-space-2 px-space-4 py-space-3 text-sm text-text-muted">
              <span>QuagBot is responding…</span>
              <span aria-hidden="true" className="flex gap-[4px]">
              <span className={TYPING_DOT} />
              <span className={`${TYPING_DOT} [animation-delay:0.15s]`} />
              <span className={`${TYPING_DOT} [animation-delay:0.3s]`} />
              </span>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-card border border-danger-border bg-danger-bg p-space-3 text-sm text-error">
            <p>{error}</p>
            <button type="button" onClick={onRetry} disabled={isLoading || !ready} className="mt-space-2 cursor-pointer rounded-card border border-danger-border bg-surface px-space-3 py-space-2 font-medium hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-50">
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
      <ChatInput onSend={onSend} disabled={isLoading || !ready} />
    </div>
  );
}

export default ChatWindow;
