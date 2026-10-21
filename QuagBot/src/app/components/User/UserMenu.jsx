import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from './UserAvatar';
import { createClient } from '@/lib/supabase/client';

const MENU_ITEM = "cursor-pointer rounded-[6px] border-none bg-transparent px-space-3 py-space-2 text-left text-[0.88rem] text-text hover:bg-bg";

function UserMenu({ name = 'Account', onSeeAccount, onLogout }) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(null);
  const router = useRouter();

  const seeAccount = onSeeAccount ?? (() => router.push('/profile'));
  const logout = onLogout ?? (async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  });
  const menuRef = useRef(null);

  // Show the logged-in user's name (set at signup as display_name) instead of
  // the generic label. Falls back to `name` when logged out or no name is saved.
  useEffect(() => {
    const supabase = createClient();

    function nameFromUser(user) {
      const metaName = user?.user_metadata?.display_name?.trim();
      return metaName || null;
    }

    supabase.auth.getUser().then(({ data }) => {
      setDisplayName(nameFromUser(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setDisplayName(nameFromUser(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSeeAccount() {
    setOpen(false);
    seeAccount();
  }

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-space-2 rounded-card border border-transparent bg-transparent px-space-2 py-space-1 text-[0.88rem] text-text hover:border-border"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <UserAvatar className="size-[28px] shrink-0 rounded-full" />
        <span>{displayName ?? name}</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-10 flex min-w-[160px] flex-col rounded-card border border-border bg-surface p-space-1" role="menu">
          <button type="button" className={MENU_ITEM} role="menuitem" onClick={handleSeeAccount}>
            See account
          </button>
          <button type="button" className={MENU_ITEM} role="menuitem" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
