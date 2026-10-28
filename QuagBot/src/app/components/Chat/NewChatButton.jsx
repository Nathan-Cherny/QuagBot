import { SquarePen } from 'lucide-react';

function NewChatButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center gap-space-2 rounded-full border border-important-border/50 bg-navbar-bg px-space-4 py-space-2 font-sans text-[0.9rem] font-medium tracking-[0.01em] text-important-border transition-colors duration-150 hover:border-important-border/70 hover:bg-[#d4ddeb] active:border-important-border active:bg-important-border active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-important-border motion-reduce:transition-none"
    >
      <SquarePen size={17} strokeWidth={1.75} aria-hidden="true" />
      New Chat
    </button>
  );
}

export default NewChatButton;
