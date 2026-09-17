function ChatMessage({ role, text }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div className="chat-message-bubble">{text}</div>
    </div>
  );
}

export default ChatMessage;
