import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

function appendTranscript(current, transcript) {
  if (!transcript) return current;
  const separator = current && !/\s$/.test(current) ? ' ' : '';
  return `${current}${separator}${transcript}`;
}

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
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
    if (!trimmed || disabled) return;

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
    
    onSend(trimmed, false);
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

  return (
    <div className="border-t border-border bg-surface p-space-4">
      <div className="flex items-end gap-space-2">
      <textarea
        ref={textareaRef}
        aria-label="Chat message"
        className="max-h-[160px] min-w-0 flex-1 resize-none overflow-y-auto rounded-card border border-border bg-bg px-space-3 py-space-2 text-[0.92rem] leading-[1.4] text-text focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        placeholder="Send a message..."
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
        className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none ${
          isListening
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
        className="cursor-pointer rounded-card border-none bg-accent px-space-4 py-space-2 text-[0.9rem] font-medium text-accent-contrast enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={submit}
        disabled={disabled || !draftValue.trim()}
      >
        Send
      </button>
      </div>
      {/* Live region for screen readers to announce speech recognition status */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {speechStatus}
      </span>
    </div>
  );
}

export default ChatInput;
