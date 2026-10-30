import { useMemo, useState } from 'react';
import { Check, Pencil, Search, Trash2, X } from 'lucide-react';
import { sidebarTitle } from '../ui/styles';
import NewChatButton from './NewChatButton';
import { groupHistory } from '../../../lib/historyGroups';

const actionStyle = 'shrink-0 cursor-pointer rounded-card p-space-2 text-text-muted hover:bg-navbar-bg hover:text-text focus-visible:outline-2 focus-visible:outline-important-border';

function ChatHistory({ chats, onSelectChat, activeChat, onNewChat, onDeleteChat, onRenameChat }) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return chats.filter((chat) => !search || chat.title.toLocaleLowerCase().includes(search) || chat.content.some((message) => message.text.toLocaleLowerCase().includes(search)));
  }, [chats, query]);

  function saveTitle(event, id) {
    event.preventDefault();
    if (!title.trim()) return;
    onRenameChat(id, title);
    setEditingId(null);
  }

  return (
    <div className="w-56 max-w-full">
      <div className="mb-space-4 flex justify-center border-b border-border pb-space-4">
        <NewChatButton onClick={onNewChat} />
      </div>
      <h2 className={sidebarTitle}>Chat History</h2>
      <div className="mb-space-3 flex items-center gap-space-1 rounded-card border border-border bg-surface px-space-2 focus-within:border-important-border">
        <Search size={15} aria-hidden="true" className="shrink-0 text-text-muted" />
        <input type="search" aria-label="Search conversations by title or message" placeholder="Search chats…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-space-2 text-sm text-text outline-none" />
      </div>
      <p className="mb-space-3 text-xs text-text-muted">Saved in this browser for your account.</p>
      {chats.length === 0 && <p className="text-sm text-text-muted">Your conversations will appear here after your first message.</p>}
      {query.trim() && <p role="status" className="mb-space-2 text-xs text-text-muted">{filtered.length ? `${filtered.length} conversation${filtered.length === 1 ? '' : 's'} found` : 'No conversations match your search.'}</p>}
      {groupHistory(filtered).map(([label, items]) => (
        <section key={label} aria-label={`${label}'s conversations`} className="mb-space-4">
          <h3 className="mb-space-1 px-space-2 text-xs font-semibold text-text-muted">{label}</h3>
          <ul className="flex flex-col gap-space-1">
        {items.map((chat) => (
          <li key={chat.id} className={`rounded-card ${chat.id === activeChat ? 'bg-navbar-bg' : 'hover:bg-bg'}`}>
            {editingId === chat.id ? (
              <form onSubmit={(event) => saveTitle(event, chat.id)} className="p-space-2" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setEditingId(null); } }}>
                <input autoFocus aria-label="Conversation title" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-card border border-border bg-surface px-space-2 py-space-1 text-sm focus:outline-important-border" />
                <div className="mt-space-1 flex justify-end">
                  <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel rename" className={actionStyle}><X size={15} /></button>
                  <button type="submit" disabled={!title.trim()} aria-label="Save conversation title" className={`${actionStyle} disabled:cursor-not-allowed disabled:opacity-50`}><Check size={15} /></button>
                </div>
              </form>
            ) : (
              <div className="flex items-center">
                <button type="button" title={chat.title} aria-current={chat.id === activeChat ? 'true' : undefined} onClick={() => onSelectChat(chat)} className="min-w-0 flex-1 cursor-pointer truncate rounded-card px-space-2 py-space-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-important-border">
                  {chat.title}
                </button>
                <button type="button" onClick={() => { setEditingId(chat.id); setTitle(chat.title); }} aria-label={`Rename conversation: ${chat.title}`} className={actionStyle}><Pencil size={15} aria-hidden="true" /></button>
                <button type="button" onClick={() => onDeleteChat(chat.id)} aria-label={`Delete conversation: ${chat.title}`} className={`${actionStyle} hover:bg-danger-bg hover:text-danger`}><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
        </section>
      ))}
    </div>
  );
}

export default ChatHistory;
