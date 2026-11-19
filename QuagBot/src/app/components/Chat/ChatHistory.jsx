import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Ellipsis, Funnel, Pencil, Search, Trash2, Share2, X, ArrowUp, ArrowDown } from 'lucide-react';
import ShareChatDialog from './ShareChatDialog';
import { sidebarTitle } from '../ui/styles';
import NewChatButton from './NewChatButton';
import { groupHistory } from '../../../lib/historyGroups';

const actionStyle = 'shrink-0 cursor-pointer rounded-card p-space-2 text-text-muted hover:bg-navbar-bg hover:text-text focus-visible:outline-2 focus-visible:outline-important-border';
const menuStyle = 'absolute right-0 top-full z-20 mt-space-1 min-w-40 rounded-card border border-border bg-surface p-space-1 text-sm text-text shadow-lg';
const menuItem = 'flex w-full cursor-pointer items-center gap-space-2 rounded-card px-space-3 py-space-2 text-left hover:bg-navbar-bg focus-visible:outline-2 focus-visible:outline-important-border disabled:cursor-not-allowed disabled:opacity-50';

function closeMenu(event) {
  const menu = event.currentTarget.closest('details');
  menu.open = false;
  menu.querySelector('summary').focus();
}

function ChatHistory({ chats, onSelectChat, activeChat, onNewChat, onDeleteChat, onRenameChat, loading, syncError, deletingId, deleteError }) {
  const historyRef = useRef(null);
  const [query, setQuery] = useState('');
  const [sharingChat, setSharingChat] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const history = historyRef.current;
    function dismissOutside(event) {
      history.querySelectorAll('details[open]').forEach((menu) => {
        if (!menu.contains(event.target)) menu.open = false;
      });
    }
    function dismissWithEscape(event) {
      const menu = history.querySelector('details[open]');
      if (event.key !== 'Escape' || !menu) return;
      event.preventDefault();
      event.stopPropagation();
      menu.open = false;
      menu.querySelector('summary').focus();
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    history.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      history.removeEventListener('keydown', dismissWithEscape);
    };
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return chats.filter((chat) => !search || chat.title.toLocaleLowerCase().includes(search) || chat.content.some((message) => typeof message.text === 'string' && message.text.toLocaleLowerCase().includes(search)));
  }, [chats, query]);

  const groups = useMemo(() => {
    const grouped = groupHistory(filtered);
    return sortOrder === 'oldest'
      ? grouped.reverse().map(([label, items]) => [label, [...items].reverse()])
      : grouped;
  }, [filtered, sortOrder]);

  function saveTitle(event, id) {
    event.preventDefault();
    if (!title.trim()) return;
    onRenameChat(id, title);
    setEditingId(null);
  }

  return (
    <div ref={historyRef} className="w-56 max-w-full">
      {sharingChat && <ShareChatDialog key={sharingChat.id} messages={sharingChat.content} title={sharingChat.title} onClose={() => setSharingChat(null)} />}
      <div className="mb-space-4 flex justify-center border-b border-border pb-space-4">
        <NewChatButton onClick={onNewChat} />
      </div>
      <div className="mb-space-2 flex items-center justify-between gap-space-2">
        <h2 className={sidebarTitle}>Chat History</h2>
        <details className="relative shrink-0">
          <summary aria-label="Filter and sort chat history" title={`Sort: ${sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}`} className={`${actionStyle} flex list-none items-center gap-space-1 text-xs [&::-webkit-details-marker]:hidden`}>
            <Funnel size={16} aria-hidden="true" /> Filter
          </summary>
          <div aria-label="Sort chat history" className={menuStyle}>
            <p className="px-space-3 py-space-2 text-xs font-semibold text-text-muted">Sort by date</p>
            {[['newest', 'Newest first', ArrowDown], ['oldest', 'Oldest first', ArrowUp]].map(([value, label, Icon]) => (
              <button key={value} type="button" aria-pressed={sortOrder === value} onClick={(event) => { closeMenu(event); setSortOrder(value); }} className={menuItem}>
                <Icon size={15} aria-hidden="true" /><span className="flex-1">{label}</span>{sortOrder === value && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="mb-space-2 flex items-center gap-space-1 rounded-card border border-border bg-surface px-space-2 focus-within:border-important-border">
        <Search size={15} aria-hidden="true" className="shrink-0 text-text-muted" />
        <input type="search" aria-label="Search conversation titles and saved messages" placeholder="Search chats…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-space-2 text-sm text-text outline-none" />
      </div>
      <p className="mb-space-3 text-xs text-text-muted">Saved in browser.</p>
      {deletingId && <p role="status" className="mb-space-3 text-xs text-text-muted">Deleting chat…</p>}
      {deleteError && <p role="alert" className="mb-space-3 text-xs text-error">{deleteError}</p>}
      {syncError && <p role="status" className="mb-space-3 text-xs text-text-muted">{syncError}</p>}
      {loading && <p role="status" className="mb-space-2 text-xs text-text-muted">Loading saved conversations…</p>}
      {!loading && chats.length === 0 && <p className="text-sm text-text-muted">Your conversations will appear here after your first message.</p>}
      {query.trim() && <p role="status" className="mb-space-2 text-xs text-text-muted">{filtered.length ? `${filtered.length} conversation${filtered.length === 1 ? '' : 's'} found` : 'No conversations match your search.'}</p>}
      {groups.map(([label, items]) => (
        <section key={label} aria-label={`${label}'s conversations`} className="mb-space-4">
          <h3 className="mb-space-1 px-space-2 text-xs font-semibold text-text-muted">{label}</h3>
          <ul className="flex flex-col gap-space-1">
            {items.map((chat) => (
              <li key={chat.id} className={`group rounded-card ${chat.id === activeChat ? 'bg-navbar-bg' : 'hover:bg-bg'}`}>
                {editingId === chat.id ? (
                  <form onSubmit={(event) => saveTitle(event, chat.id)} className="p-space-2" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setEditingId(null); } }}>
                    <input autoFocus aria-label="Conversation title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-card border border-border bg-surface px-space-2 py-space-1 text-sm focus:outline-important-border" />
                    <div className="mt-space-1 flex justify-end">
                      <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel rename" className={actionStyle}><X size={15} aria-hidden="true" /></button>
                      <button type="submit" disabled={!title.trim()} aria-label="Save conversation title" className={`${actionStyle} disabled:cursor-not-allowed disabled:opacity-50`}><Check size={15} aria-hidden="true" /></button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center">
                    <button type="button" title={chat.title} aria-current={chat.id === activeChat ? 'true' : undefined} onClick={() => onSelectChat(chat)} className="min-w-0 flex-1 cursor-pointer truncate rounded-card px-space-2 py-space-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-important-border">{chat.title}</button>
                    <details className="relative shrink-0 opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 open:opacity-100">
                      <summary aria-label={`Actions for ${chat.title}`} title="Chat actions" className={`${actionStyle} flex list-none [&::-webkit-details-marker]:hidden`}><Ellipsis size={17} aria-hidden="true" /></summary>
                      <div aria-label={`Actions for ${chat.title}`} className={menuStyle}>
                        <button type="button" onClick={(event) => { closeMenu(event); setSharingChat(chat); }} disabled={!chat.content.length} className={menuItem}><Share2 size={15} aria-hidden="true" /> Share</button>
                        <button type="button" onClick={(event) => { closeMenu(event); setEditingId(chat.id); setTitle(chat.title); }} className={menuItem}><Pencil size={15} aria-hidden="true" /> Rename</button>
                        <div className="my-space-1 border-t border-border" />
                        <button type="button" onClick={(event) => { closeMenu(event); onDeleteChat(chat.id); }} disabled={Boolean(deletingId)} className={`${menuItem} text-error hover:bg-danger-bg`}><Trash2 size={15} aria-hidden="true" /> Delete</button>
                      </div>
                    </details>
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
