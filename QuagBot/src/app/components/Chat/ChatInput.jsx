import { useState } from 'react';

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-space-2 border-t border-border bg-surface p-space-4">
      <textarea
        className="max-h-[160px] flex-1 resize-none rounded-card border border-border bg-bg px-space-3 py-space-2 text-[0.92rem] leading-[1.4] text-text focus:outline-2 focus:outline-offset-1 focus:outline-accent"
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
  );
}

export default ChatInput;
