import UserAvatar from '../User/UserAvatar';
import { Copy } from 'lucide-react';


const BOT_AVATAR_SRC = '/QuagBotLogo.png';

function ChatMessage({ role, text }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className="chat-avatar" />}

      <div className="chat-message-bubble relative">
        {text}
        {!isUser && <CopyButton text={text} />}
      </div>

      {isUser && <UserAvatar className="chat-avatar" />}
    </div>
  );
}

function CopyButton({text}) {
  function copyText(text) { navigator.clipboard.writeText(text) }

  return (
    <Copy onClick={() => copyText(text)} className='absolute top-11 cursor-pointer hover:scale-110' size={16} />
  )
}

export default ChatMessage;
