import { usePathname } from 'next/navigation';
import UserMenu from '../User/UserMenu';

import { Home, CircleQuestionMark } from 'lucide-react';

function Navbar() {
  const iconSize = 16
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between border-b-2 border-important-border bg-navbar-bg px-space-5 py-space-3">
      <div className='flex w-fit items-center justify-around gap-3.75'>
        <span className="text-[1.05rem] font-semibold">QuagBot</span>
        <img className='max-w-12.5' src='/QuagBotLogo.png'></img>
      </div>
      <nav className="flex gap-space-5">
        <NavbarLink href="/" name="Home" pn={pathname} icon={<Home size={iconSize} />} />
        <NavbarLink href="/about" name="About" pn={pathname} icon={<CircleQuestionMark size={iconSize} />} />
      </nav>
      <UserMenu name="Account" />
    </header>
  );
}

// The active link gets a fading underline drawn with ::after.
const LINK_BASE = "flex items-center gap-[5px] text-[0.9rem] text-text-muted hover:text-text"
const LINK_ACTIVE = "relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-full after:bg-[linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]"

function NavbarLink({ href, name, pn, icon }) {
  return <a href={href} className={`${LINK_BASE} ${pn == href ? LINK_ACTIVE : ""}`.trim()}>{icon}{name}</a>
}

export default Navbar;
