import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from './UserAvatar';
import { createClient } from '@/lib/supabase/client';

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
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <UserAvatar className="user-menu-avatar" />
        <span className="user-menu-name">{displayName ?? name}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <button type="button" className="user-menu-item" role="menuitem" onClick={handleSeeAccount}>
            See account
          </button>
          <button type="button" className="user-menu-item" role="menuitem" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
