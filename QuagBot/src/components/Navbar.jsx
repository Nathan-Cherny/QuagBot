import UserMenu from './UserMenu';

function Navbar() {
  return (
    <header className="navbar">
      <div className='navbar-title'>
        <span className="navbar-brand">Chatbot UI</span>
        <img className='navbar-logo' src='/QuagBotLogo.png'></img>
      </div>
      <nav className="navbar-links">
        <a href="#" className="navbar-link">Home</a>
        <a href="#" className="navbar-link">About</a>
      </nav>
      <UserMenu name="Account" />
    </header>
  );
}

export default Navbar;
