import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import NewChatButton from './NewChatButton';
import { chatAvatar, chatMessageRow } from '../ui/styles';

const TYPING_DOT = 'size-[6px] animate-typing-bounce rounded-full bg-text-muted';

function ChatWindow({ messages, isLoading, onSend, onNewChat, responseStyle }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div data-chat-window className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-main-chat-bg">
      <div className="hidden justify-center border-b border-border bg-surface px-space-4 py-space-2 max-[900px]:flex">
        <NewChatButton onClick={onNewChat} />
      </div>
      <div className="flex flex-1 flex-col gap-space-3 overflow-y-auto p-space-5" ref={scrollRef}>
        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} text={message.text} responseStyle={responseStyle} />
        ))}

        {isLoading && (
          <div className={chatMessageRow}>
            <img src="/QuagBotLogo.png" alt="Bot" className={chatAvatar} />
            <div className="flex max-w-[60%] items-center gap-[4px] px-space-4 py-space-3">
              <span className={TYPING_DOT} />
              <span className={`${TYPING_DOT} [animation-delay:0.15s]`} />
              <span className={`${TYPING_DOT} [animation-delay:0.3s]`} />
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;
