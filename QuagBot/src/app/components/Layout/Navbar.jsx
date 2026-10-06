import UserMenu from '../User/UserMenu';

import { Home, CircleQuestionMark } from 'lucide-react';

function Navbar() {
  const iconSize = 16

  return (
    <header className="navbar">
      <div className='navbar-title'>
        <span className="navbar-brand">QuagBot</span>
        <img className='navbar-logo' src='/QuagBotLogo.png'></img>
      </div>
      <nav className="navbar-links">
        <a href="/" className="navbar-link"><Home size={iconSize}/> Home</a>
        <a href="/about" className="navbar-link"><CircleQuestionMark size={iconSize }/> About</a>
      </nav>
      <UserMenu name="Account" />
    </header>
  );
}

export default Navbar;
