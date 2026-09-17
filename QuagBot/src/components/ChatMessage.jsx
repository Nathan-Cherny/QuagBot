import UserAvatar from './UserAvatar';

const BOT_AVATAR_SRC = '/QuagBotLogo.png';

function ChatMessage({ role, text }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className="chat-avatar" />}

      <div className="chat-message-bubble">{text}</div>

      {isUser && <UserAvatar className="chat-avatar" />}
    </div>
  );
}

export default ChatMessage;
