import { usePathname } from 'next/navigation';
import UserMenu from '../User/UserMenu';

import { Home, CircleQuestionMark } from 'lucide-react';

function Navbar() {
  const iconSize = 16
  const pathname = usePathname()

  return (
    <header className="navbar">
      <div className='navbar-title'>
        <span className="navbar-brand">QuagBot</span>
        <img className='navbar-logo' src='/QuagBotLogo.png'></img>
      </div>
      <nav className="navbar-links">
        <NavbarLink href="/" name="Home" pn={pathname} icon={<Home size={iconSize} />} />
        <NavbarLink href="/about" name="About" pn={pathname} icon={<CircleQuestionMark size={iconSize} />} />
      </nav>
      <UserMenu name="Account" />
    </header>
  );
}

function NavbarLink({ href, name, pn, icon }) {
  return <a href={href} className={`navbar-link ${pn == href ? "active" : ""}`}>{icon}{name}</a>
}

export default Navbar;
