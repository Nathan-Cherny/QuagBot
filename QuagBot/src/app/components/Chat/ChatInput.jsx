import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FileText, FolderOpen, Mic, MicOff, Paperclip, Send, X } from 'lucide-react';
import { uploadPDF } from '../../../lib/api/documents';
import DocumentList from '../Documents/DocumentList';
import { canSelectPdf } from '../../../lib/pdfCitations.mjs';

function appendTranscript(current, transcript) {
  if (!transcript) return current;
  const separator = current && !/\s$/.test(current) ? ' ' : '';
  return `${current}${separator}${transcript}`;
}

function ChatInput({ onSend, disabled, initialDraft = '', initialDocument = null }) {
  const [value, setValue] = useState(initialDraft);
  const [selectedDocument, setSelectedDocument] = useState(initialDocument);
  const [uploadingFilename, setUploadingFilename] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInput = useRef(null);
  const uploadRequest = useRef(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const documentsDialog = useRef(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  // States to track if speech recognition is active
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');
  const recognitionRef = useRef(null);
  const recognitionConstructorRef = useRef(null);
  const wantsListeningRef = useRef(false);
  const restartTimerRef = useRef(null);
  const interimTranscriptRef = useRef('');
  const selectionRef = useRef(null);

  const textareaRef = useRef(null);
  const draftValue = appendTranscript(value, interimTranscript).slice(0, 10000);

  useEffect(() => () => {
    uploadRequest.current?.abort();
    wantsListeningRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function resize() {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    }

    resize();
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth !== lastWidth) {
        lastWidth = textarea.clientWidth;
        resize();
      }
    });
    let lastWidth = textarea.clientWidth;
    observer.observe(textarea);
    const selection = selectionRef.current;
    if (selection) {
      if (document.activeElement === textarea) {
        const start = selection.atEnd
          ? draftValue.length
          : Math.min(selection.start, draftValue.length);
        const end = selection.atEnd
          ? draftValue.length
          : Math.min(selection.end, draftValue.length);
        textarea.setSelectionRange(start, end);
      }
      selectionRef.current = null;
    }
    return () => observer.disconnect();
  }, [draftValue]);

  function submit() {
    const trimmed = draftValue.trim();
    if (!trimmed || disabled || uploadRequest.current) return;

    //Code to stop speech recognition when the user submits a message
    const wasListening = wantsListeningRef.current;
    wantsListeningRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (wasListening) {
      setIsListening(false);
      setSpeechStatus('Dictation stopped because your message was sent.');
    }

    const scopedId = canSelectPdf(selectedDocument?.id, selectedDocument?.filename) ? selectedDocument.id : undefined;
    onSend(trimmed, false, false, scopedId, selectedDocument);
    setSelectedDocument(null);
    setValue('');
    setInterimTranscript('');
    interimTranscriptRef.current = '';
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  //Speech recognition functions
  function commitInterimTranscript() {
    const transcript = interimTranscriptRef.current;
    if (!transcript) return;
    setValue((current) =>
      appendTranscript(current, transcript).slice(0, 10000),
    );
    interimTranscriptRef.current = '';
    setInterimTranscript('');
  }

  function startRecognition() {
    const Recognition = recognitionConstructorRef.current;
    if (!Recognition || !wantsListeningRef.current) return;

    const recognition = new Recognition();
    recognition.lang = navigator.language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const textarea = textareaRef.current;
      if (textarea && document.activeElement === textarea) {
        selectionRef.current = {
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
          atEnd:
            textarea.selectionStart === textarea.value.length &&
            textarea.selectionEnd === textarea.value.length,
        };
      }

      const results = Array.from(event.results);
      const finalTranscript = results
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript)
        .join('');
      const currentInterim = results
        .filter((result) => !result.isFinal)
        .map((result) => result[0].transcript)
        .join('');
      if (finalTranscript) {
        setValue((current) =>
          appendTranscript(current, finalTranscript).slice(0, 10000),
        );
      }
      interimTranscriptRef.current = currentInterim;
      setInterimTranscript(currentInterim);
    };
    recognition.onerror = (event) => {
      const fatalErrors = [
        'not-allowed',
        'service-not-allowed',
        'audio-capture',
        'language-not-supported',
      ];
      if (fatalErrors.includes(event.error)) {
        wantsListeningRef.current = false;
        setIsListening(false);
        setSpeechStatus(`Speech recognition error: ${event.error}.`);
      } else if (event.error !== 'no-speech') {
        setSpeechStatus(
          `Speech recognition error: ${event.error}. Retrying while dictation is active.`,
        );
      }
    };
    recognition.onend = () => {
      commitInterimTranscript();
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      if (!wantsListeningRef.current) {
        setIsListening(false);
        return;
      }
      restartTimerRef.current = setTimeout(startRecognition, 300);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      wantsListeningRef.current = false;
      setIsListening(false);
      setSpeechStatus(`Could not start speech recognition: ${error.message}`);
    }
  }

  function toggleSpeechRecognition() {
    if (isListening) {
      wantsListeningRef.current = false;
      clearTimeout(restartTimerRef.current);
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechStatus('Dictation stopped.');
      return;
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechStatus('Speech recognition is not supported in this browser.');
      return;
    }

    recognitionConstructorRef.current = Recognition;
    wantsListeningRef.current = true;
    setIsListening(true);
    setSpeechStatus('Listening. Press Stop dictation when finished.');
    startRecognition();
  }

  async function attachUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || disabled || uploadRequest.current) return;
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Choose a PDF file.');
      return;
    }
    const controller = new AbortController();
    uploadRequest.current = controller;
    setUploadingFilename(file.name);
    try {
      const document = await uploadPDF(file, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (document.embedding_status === 'failed' || document.chunk_count === 0) {
        throw new Error('This PDF has no searchable text. Choose a PDF with selectable text.');
      }
      setSelectedDocument(document);
      textareaRef.current?.focus();
    } catch (error) {
      if (!controller.signal.aborted) setUploadError(error.message);
    } finally {
      if (!controller.signal.aborted) {
        uploadRequest.current = null;
        setUploadingFilename(null);
      }
    }
  }

  function openDocuments() {
    if (disabled || uploadRequest.current) return;
    setDocumentsOpen(true);
    documentsDialog.current.showModal();
  }

  function attachSavedDocument(document) {
    setUploadError(null);
    setSelectedDocument(document);
    documentsDialog.current.close();
    textareaRef.current?.focus();
  }

  return (
    <div className="border-t border-border bg-surface p-space-4 max-[900px]:p-space-2">
      {selectedDocument && (
        <div className="mb-space-2 inline-flex max-w-full items-center gap-space-2 rounded-card border border-border px-space-3 py-space-2 text-sm">
          <FileText size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
          <span className="min-w-0 truncate" title={selectedDocument.filename}>{selectedDocument.filename}</span>
          <button type="button" aria-label="Remove PDF attachment" onClick={() => setSelectedDocument(null)}
            className="shrink-0 rounded p-1 hover:bg-navbar-bg">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {selectedDocument && !canSelectPdf(selectedDocument.id, selectedDocument.filename) && (
        <p className="mb-space-2 text-xs text-text-muted">QuagBot can also search other education sources.</p>
      )}
      {uploadingFilename && <p role="status" className="mb-space-2 text-sm text-text-muted">Attaching {uploadingFilename}…</p>}
      {uploadError && <p role="alert" className="mb-space-2 text-sm text-error">{uploadError}</p>}
      <div className="flex items-center gap-space-2 max-[480px]:gap-1">
        <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="hidden" onChange={attachUpload} />
        <button type="button" aria-label="Attach PDF" title="Attach PDF" disabled={disabled || Boolean(uploadingFilename)}
          onClick={() => fileInput.current?.click()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted enabled:cursor-pointer enabled:hover:bg-navbar-bg disabled:opacity-50">
          <Paperclip size={19} aria-hidden="true" />
        </button>
        <button type="button" onClick={openDocuments} aria-label="Choose an uploaded PDF" title="Choose an uploaded PDF"
          disabled={disabled || Boolean(uploadingFilename)}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-card border border-border bg-surface text-text-muted hover:bg-navbar-bg">
          <FolderOpen size={19} aria-hidden="true" />
        </button>
        <textarea
          ref={textareaRef}
          aria-label="Chat message"
          className="max-h-[160px] min-w-0 flex-1 resize-none overflow-y-auto rounded-card border border-border bg-bg px-space-3 py-space-2 text-[0.92rem] leading-[1.4] text-text focus:outline-2 focus:outline-offset-1 focus:outline-accent"
          placeholder={selectedDocument ? "Ask about this PDF…" : "Send a message..."}
          rows={1}
          maxLength={10000}
          value={draftValue}
          onChange={(event) => {
            selectionRef.current = null;
            setValue(event.target.value);
            setInterimTranscript('');
            interimTranscriptRef.current = '';
          }}
          onKeyDown={handleKeyDown}
        />

        {/* Button to start and stop speech recognition */}
        <button
          type="button"
          className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none ${isListening
              ? 'bg-red-600 text-white'
              : 'bg-navbar-bg text-text hover:brightness-95'
            } disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
          onClick={toggleSpeechRecognition}
          disabled={disabled && !isListening}
          aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
          aria-pressed={isListening}
        >
          {isListening ? (
            <MicOff size={18} aria-hidden="true" />
          ) : (
            <Mic size={18} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          aria-label="Send message"
          className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-card border-none bg-accent px-space-4 text-[0.9rem] max-[480px]:size-9 max-[480px]:p-0 font-medium text-accent-contrast enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={submit}
          disabled={disabled || Boolean(uploadingFilename) || !draftValue.trim()}
        >
          <span className="max-[480px]:hidden">Send</span>
          <Send size={17} aria-hidden="true" className="hidden max-[480px]:block" />
        </button>
      </div>
      <dialog ref={documentsDialog} onClose={() => setDocumentsOpen(false)} aria-labelledby="chat-documents-title"
        className="m-auto max-h-[85dvh] w-[min(40rem,calc(100%_-_1.5rem))] overflow-y-auto rounded-card border border-border bg-surface p-space-4 text-text shadow-xl backdrop:bg-black/40">
        <div className="mb-space-3 flex items-center justify-between gap-space-2">
          <h2 id="chat-documents-title" className="text-lg font-semibold">Choose a PDF</h2>
          <button type="button" aria-label="Close documents" onClick={() => documentsDialog.current.close()}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-card hover:bg-navbar-bg">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {documentsOpen && <DocumentList onAttach={attachSavedDocument} />}
      </dialog>
      {/* Live region for screen readers to announce speech recognition status */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {speechStatus}
      </span>
    </div>
  );
}

export default ChatInput;
