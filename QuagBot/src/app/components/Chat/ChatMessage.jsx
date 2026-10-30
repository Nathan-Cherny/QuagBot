import UserAvatar from '../User/UserAvatar';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { chatAvatar, chatMessageRow } from '../ui/styles';
import WelcomeText from './WelcomeText';


const BOT_AVATAR_SRC = '/QuagBotLogo.png';

const BUBBLE = 'rounded-card px-space-4 py-space-3 text-[0.92rem] leading-[1.45] whitespace-pre-wrap [overflow-wrap:anywhere]';
const USER_BUBBLE = `${BUBBLE} min-w-0 max-w-[60%] max-[900px]:max-w-[85%] rounded-br-[2px] bg-user-bubble text-accent-contrast`;
const BOT_BUBBLE = `${BUBBLE} rounded-bl-[2px] border-[0.5px] border-gray bg-quagbot-bubble text-left text-text`;
const BOT_CONTENT = 'min-w-0 max-w-[60%] max-[900px]:max-w-[85%]';

function ChatMessage({ role, text, responseStyle, animateWelcome = false }) {
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
          {animateWelcome ? <WelcomeText text={text} /> : text}
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
  const [status, setStatus] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyText() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied');
    } catch {
      setStatus('Could not copy. Select the text to copy it.');
    }
    timer.current = setTimeout(() => setStatus(''), 2500);
  }

  return (
    <div className="flex items-center gap-space-2 text-xs text-text-muted">
      <button type="button" onClick={copyText} aria-label="Copy response" title="Copy response" className="cursor-pointer rounded p-space-1 hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border">
        {status === 'Copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </button>
      <span role="status">{status}</span>
    </div>
  );
}

export default ChatMessage;
