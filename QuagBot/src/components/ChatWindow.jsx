import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

function ChatWindow({ messages, isLoading, onSend }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} text={message.text} />
        ))}

        {isLoading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-bubble chat-message-bubble--typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;
