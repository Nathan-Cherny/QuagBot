import UserMenu from '../User/UserMenu';

function Navbar() {
  return (
    <header className="navbar">
      <div className='navbar-title'>
        <span className="navbar-brand">QuagBot</span>
        <img className='navbar-logo' src='/QuagBotLogo.png'></img>
      </div>
      <nav className="navbar-links">
        <a href="/" className="navbar-link">Home</a>
        <a href="/about" className="navbar-link">About</a>
      </nav>
      <UserMenu name="Account" />
    </header>
  );
}

export default Navbar;
