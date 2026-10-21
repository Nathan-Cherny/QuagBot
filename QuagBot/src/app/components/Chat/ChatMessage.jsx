import UserAvatar from '../User/UserAvatar';
import { Copy } from 'lucide-react';
import { chatAvatar, chatMessageRow } from '../ui/styles';


const BOT_AVATAR_SRC = '/QuagBotLogo.png';

const BUBBLE = 'rounded-card px-space-4 py-space-3 text-[0.92rem] leading-[1.45] whitespace-pre-wrap';
const USER_BUBBLE = `${BUBBLE} max-w-[60%] rounded-br-[2px] bg-user-bubble text-accent-contrast`;
const BOT_BUBBLE = `${BUBBLE} rounded-bl-[2px] border-[0.5px] border-gray bg-quagbot-bubble text-left text-text`;
const BOT_CONTENT = 'min-w-0 max-w-[60%]';

function ChatMessage({ role, text, responseStyle }) {
  const isUser = role === 'user';
  const { fontSize, fontFamily } = responseStyle

  if (isUser) return (
    <div className={`${chatMessageRow} justify-end`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className={chatAvatar} />}

      <div className={USER_BUBBLE} style={{fontSize, fontFamily}}>
        {text}
      </div>

      {isUser && <UserAvatar className={chatAvatar} />}
    </div>
  )

  return (
    <div className={`${chatMessageRow} justify-start`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className={chatAvatar} />}

      <div className={BOT_CONTENT}>
        <div className={BOT_BUBBLE} style={responseStyle}>
          {text}
        </div>
        {<Buttons text={text} />}
      </div>

      {isUser && <UserAvatar className={chatAvatar} />}
    </div>
  );
}

function Buttons({ text }) {
  return (
    <div className='mt-1'>
      <CopyButton text={text} />
    </div>
  )
}

function CopyButton({ text }) {
  function copyText(text) { navigator.clipboard.writeText(text) }

  return (
    <Copy onClick={() => copyText(text)} className='cursor-pointer hover:scale-110' size={16} />
  )
}

export default ChatMessage;
