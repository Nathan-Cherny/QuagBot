import Link from 'next/link';
import UserAvatar from '../User/UserAvatar';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Watch, WatchIcon } from 'lucide-react';
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
const RESPONSE_DOT = 'size-1.5 rounded-full bg-current opacity-60 motion-safe:animate-typing-bounce';

function ChatMessage({ role, text = "", linkedDocument, citations, responseStyle, isPDF, streaming = false, progress, animateWelcome = false }) {
  const isUser = role === 'user';
  const { fontSize, fontFamily } = responseStyle

  if (!streaming && text.startsWith("```json")) { text = parseMarkdownJson(text); isPDF = true }
  
  if (isUser) return (
    <div className={`${chatMessageRow} justify-end`}>
      {!isUser && <img src={BOT_AVATAR_SRC} alt="Bot" className={chatAvatar} />}

      <div className={USER_BUBBLE} style={{ fontSize, fontFamily }}>
        {text}
        {linkedDocument && (
          <Link href={`/documents#document-${encodeURIComponent(linkedDocument.id)}`} className="mt-2 block text-sm underline">
            {linkedDocument.filename}
          </Link>
        )}
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
            {text && <MarkdownMessage text={isPDF ? text.title : text} />}
            {!isPDF && Array.isArray(citations) && citations.length > 0 && (
              <section aria-label="PDF citations" className="mt-space-3 border-t border-border pt-space-2 text-sm">
                <p className="font-semibold">Sources</p>
                <ul className="space-y-1">
                  {citations.map((citation) => (
                    <li key={citation.number}>
                      [{citation.number}] {citation.filename} · PDF page {citation.page_number}
                      {citation.section_name && ` · ${citation.section_name}`}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {!isPDF && citations?.length === 0 && (
              <p className="mt-space-2 text-sm text-text-muted">No PDF passages were cited.</p>
            )}
            {progress && (
              <p role="status" className="mt-1 flex items-center gap-2 text-sm text-text-muted first:mt-0">
                <span aria-hidden="true" className="inline-flex h-4 shrink-0 items-center gap-1">
                  <span className={RESPONSE_DOT} />
                  <span className={`${RESPONSE_DOT} [animation-delay:120ms]`} />
                  <span className={`${RESPONSE_DOT} [animation-delay:240ms]`} />
                </span>
                <span>{progress}</span>
              </p>
            )}
          </div>}
        </div>
        {!streaming && <Buttons text={text} />}
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
