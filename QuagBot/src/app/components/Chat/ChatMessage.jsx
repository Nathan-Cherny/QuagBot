import UserAvatar from '../User/UserAvatar';
import { Copy, Download, Watch, WatchIcon } from 'lucide-react';
import { chatAvatar, chatMessageRow } from '../ui/styles';
import MarkdownMessage from './MarkdownMessage';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFDocument from './PracticeExamPDF';

const BOT_AVATAR_SRC = '/QuagBotLogo.png';

const BUBBLE = 'rounded-card px-space-4 py-space-3 text-[0.92rem] leading-[1.45]';
const USER_BUBBLE = `${BUBBLE} max-w-[60%] rounded-br-[2px] bg-user-bubble text-accent-contrast whitespace-pre-wrap`;
const BOT_BUBBLE = `${BUBBLE} rounded-bl-[2px] border-[0.5px] border-gray bg-quagbot-bubble text-left text-text flex flex-row gap-5 items-center`;
const BOT_CONTENT = 'min-w-0 max-w-[60%]';

function ChatMessage({ role, text, responseStyle, isPDF }) {
  const isUser = role === 'user';
  const { fontSize, fontFamily } = responseStyle

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
          <div className='flex-col flex'>
            <MarkdownMessage text={(isPDF) ? text.title : text} />
          </div>

          {isPDF && <PDFDownloadLink
            document={
              <PDFDocument title={text.title} textContent={text.text} />
            }
            fileName={`${text.title}.pdf`}
          >
            {({ loading }) =>
              loading ? <WatchIcon /> : <Download />
            }
          </PDFDownloadLink>}

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
