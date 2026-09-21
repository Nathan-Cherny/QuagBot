import UserAvatar from '../User/UserAvatar';
import { Copy } from 'lucide-react';


const BOT_AVATAR_SRC = '/QuagBotLogo.png';

function ChatMessage({ role, text }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--quagbot'}`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className="chat-avatar" />}

      <div className="chat-message-bubble">
        {text}
        {!isUser && <Buttons text={text} />}
      </div>

      {isUser && <UserAvatar className="chat-avatar" />}
    </div>
  );
}

function Buttons({text}){
  return (
    <div className='mt-5'>
      <CopyButton text={text}/>
    </div>
  )
}

function CopyButton({text}) {
  function copyText(text) { navigator.clipboard.writeText(text) }

  return (
    <Copy onClick={() => copyText(text)} className='cursor-pointer hover:scale-110' size={16} />
  )
}

export default ChatMessage;
