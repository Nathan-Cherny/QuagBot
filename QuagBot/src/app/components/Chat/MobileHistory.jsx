import { useEffect, useRef } from 'react';

function MobileHistory({ open, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Chat history"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[90vw] border-r border-border bg-surface p-space-4 text-text backdrop:bg-black/30"
    >
      <button type="button" autoFocus onClick={onClose} className="mb-space-4 cursor-pointer rounded-card border border-border px-space-3 py-space-2 text-sm hover:bg-navbar-bg">Close history</button>
      {children}
    </dialog>
  );
}

export default MobileHistory;
