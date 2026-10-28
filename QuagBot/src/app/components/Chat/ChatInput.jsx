import { useLayoutEffect, useRef, useState } from 'react';

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

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
    return () => observer.disconnect();
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
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
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="cursor-pointer rounded-card border-none bg-accent px-space-4 py-space-2 text-[0.9rem] font-medium text-accent-contrast enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={submit}
        disabled={disabled || !value.trim()}
      >
        Send
      </button>
      </div>
    </div>
  );
}

export default ChatInput;
