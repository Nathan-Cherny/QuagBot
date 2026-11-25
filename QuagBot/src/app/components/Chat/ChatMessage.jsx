import UserAvatar from '../User/UserAvatar';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Watch, WatchIcon, ExpandIcon, X } from 'lucide-react';
import { chatAvatar, chatMessageRow, iconButton } from '../ui/styles';
import { PILL_BUTTON } from './ChatSettings';
import { locateHighlight, sectionParagraphs } from '../../../lib/ragHighlight.mjs';
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
      
      {referencesOpen && <RAGReferences RAG_info={RAG_info} setReferencesOpen={setReferencesOpen} textStyle={{ fontSize, fontFamily }} />}
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

const HIGHLIGHT = 'rounded-[3px] bg-yellow-200 px-[2px] text-black underline decoration-amber-500 decoration-2 underline-offset-2 [box-decoration-break:clone]';

function publishedYear(value) {
  const year = new Date(value).getFullYear();
  return Number.isNaN(year) ? null : year;
}

// Overlay (same backdrop and card treatment as ChatSettings) showing the textbook section the
// answer drew on, with the exact passage the AI used (`referenced_text`) highlighted inside it.
function RAGReferences({ RAG_info, setReferencesOpen, textStyle }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const highlightRef = useRef(null);
  const close = () => setReferencesOpen(false);

  const { title, authors, institution, header, start_page, citation, date_published, referenced_text } = RAG_info;
  const paragraphs = sectionParagraphs(RAG_info.text);
  const hit = locateHighlight(paragraphs, referenced_text);
  const authorList = Array.isArray(authors) ? authors.filter(Boolean).join('; ') : '';
  const year = date_published ? publishedYear(date_published) : null;
  const byline = [authorList, institution, year].filter(Boolean).join(' · ');

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    highlightRef.current?.scrollIntoView({ block: 'center' });
    function onKeyDown(event) {
      if (event.key === 'Escape') setReferencesOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [setReferencesOpen]);

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30"
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[90vh] w-[720px] max-w-[92%] flex-col overflow-hidden rounded-[12px] bg-surface text-black">
        <div className="flex items-start justify-between gap-space-4 border-b border-border px-space-5 pt-space-5 pb-space-4">
          <div className="min-w-0">
            <p className="mb-space-1 text-[0.75rem] font-semibold tracking-[0.08em] text-text-muted">Source used for this answer</p>
            <h2 id={titleId} className="text-[24px] leading-[118%] font-medium tracking-[-0.24px] [overflow-wrap:anywhere] max-[1024px]:text-[20px]">{title}</h2>
            {byline && <p className="mt-space-1 text-[0.9rem] text-text-muted [overflow-wrap:anywhere]">{byline}</p>}
          </div>
          <button type="button" ref={closeRef} className={`${iconButton} shrink-0 rounded focus-visible:outline-2 focus-visible:outline-important-border`} onClick={close} aria-label="Close references" title="Close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-space-5 py-space-4">
          <div className="mb-space-2 flex items-baseline justify-between gap-space-3">
            {header && <h3 className="text-[1.15rem] leading-[125%] font-medium [overflow-wrap:anywhere]">{header}</h3>}
            {start_page != null && <span className="ml-auto text-[0.82rem] whitespace-nowrap text-text-muted">Section starts on p. {start_page}</span>}
          </div>

          <p className="mb-space-4 flex flex-wrap items-center gap-x-space-2 gap-y-space-1 text-[0.85rem] text-text-muted">
            <span><mark className={HIGHLIGHT}>Highlighted</mark> text is the part QuagBot used to write its answer.</span>
            {hit && (
              <button type="button" className="cursor-pointer rounded px-space-1 text-accent underline hover:brightness-90 focus-visible:outline-2 focus-visible:outline-important-border" onClick={() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>
                Jump to highlight
              </button>
            )}
          </p>

          {!hit && typeof referenced_text === 'string' && referenced_text.trim() && (
            <blockquote className="mb-space-4 rounded-card border-l-4 border-amber-500 bg-yellow-100 p-space-3 text-[0.9rem]">
              <p className="mb-space-1 text-[0.8rem] font-semibold text-text-muted">We couldn&apos;t locate this passage in the section text below:</p>
              <mark className={HIGHLIGHT}>{referenced_text}</mark>
            </blockquote>
          )}

          <div className="flex flex-col gap-space-3 leading-[1.6] [overflow-wrap:anywhere]" style={textStyle}>
            {paragraphs.length === 0 && <p className="text-text-muted">The text of this section isn&apos;t available.</p>}
            {paragraphs.map((paragraph, index) => hit && hit.section === index ? (
              <p key={index}>
                {paragraph.slice(0, hit.start)}
                <mark ref={highlightRef} className={HIGHLIGHT}>{paragraph.slice(hit.start, hit.end)}</mark>
                {paragraph.slice(hit.end)}
              </p>
            ) : <p key={index}>{paragraph}</p>)}
          </div>
        </div>

        <div className="border-t border-border px-space-5 pt-space-3 pb-space-5">
          {citation && (
            <p className="mb-space-3 text-[0.8rem] leading-[1.4] text-text-muted [overflow-wrap:anywhere]">
              <span className="font-semibold">Citation: </span>{citation}
            </p>
          )}
          <button type="button" className={PILL_BUTTON} onClick={close}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
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
