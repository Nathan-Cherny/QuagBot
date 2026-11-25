import UserAvatar from '../User/UserAvatar';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Watch, WatchIcon, ExpandIcon } from 'lucide-react';
import { chatAvatar, chatMessageRow } from '../ui/styles';
import WelcomeText from './WelcomeText';
import MarkdownMessage from './MarkdownMessage';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFDocument, { COULD_NOT_GEN, parseMarkdownJson } from './PracticeExamPDF';

const BOT_AVATAR_SRC = '/QuagBotLogo.png';

const BUBBLE = 'rounded-card px-space-4 py-space-3 text-[0.92rem] leading-[1.45] [overflow-wrap:anywhere]';
const USER_BUBBLE = `${BUBBLE} whitespace-pre-wrap min-w-0 max-w-[60%] max-[900px]:max-w-[85%] rounded-br-[2px] bg-user-bubble text-accent-contrast`;
const BOT_BUBBLE = `${BUBBLE} rounded-bl-[2px] border-[0.5px] border-gray bg-quagbot-bubble text-left text-text flex flex-row gap-5 items-center`;
const BOT_CONTENT = 'min-w-0 max-w-[60%] max-[900px]:max-w-[85%]';

function ChatMessage({ role, text = "", responseStyle, isPDF, RAG_info, animateWelcome = false }) {
  const isUser = role === 'user';
  const { fontSize, fontFamily } = responseStyle
  const [referencesOpen, setReferencesOpen] = useState(false)

  if (text.startsWith("```json")) { text = parseMarkdownJson(text); isPDF = true }

  if (isUser) return (
    <div className={`${chatMessageRow} justify-end`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className={chatAvatar} />}

      <div className={USER_BUBBLE} style={{ fontSize, fontFamily }}>
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

          {isPDF && text.title != COULD_NOT_GEN && <PDFDownloadLink
            className='hover:scale-105 border p-1 bg-white/20 shadow-xl'
            document={
              <PDFDocument title={text.title} textContent={text.text} />
            }
            fileName={`${text.title}.pdf`}
          >
            {({ loading }) =>
              loading ? <WatchIcon /> : <Download />
            }
          </PDFDownloadLink>}

          {animateWelcome ? <WelcomeText text={text} /> : <div className='flex-col flex'>
            <MarkdownMessage text={(isPDF) ? text.title : text} />
            {RAG_info && <RAGReferencesSmall RAG_info={RAG_info} setReferencesOpen={setReferencesOpen} />}
          </div>}

        </div>

        {<Buttons text={text} />}
      </div>
      {isUser && <UserAvatar className={chatAvatar} />}
      
      {referencesOpen && <RAGReferences RAG_info={RAG_info} setReferencesOpen={setReferencesOpen} />}
    </div>
  );
}

function RAGReferencesSmall({ RAG_info, setReferencesOpen }) {
  return (
    <>
      <hr className='my-2' />
      <div onClick={() => {setReferencesOpen(true)}}  className='*:text-xs p-1 rounded cursor-pointer hover:bg-gray-600/30 duration-75 bg-gray-600/20'>
        <h1 className='italic text-sm flex flex-row items-center gap-2'>
          <ExpandIcon size={16} className='border' />Referenced from {RAG_info.title} by {RAG_info.authors.slice(0, 3).join(",")}
        </h1>
      </div>
    </>
  )
}

function RAGReferences({RAG_info, setReferencesOpen}){
  return (
    <div>
      {JSON.stringify(RAG_info)}
      <button onClick={() => {setReferencesOpen(false)}}>Close</button>
    </div>
  )
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
