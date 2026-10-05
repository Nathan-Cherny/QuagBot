// src/components/Layout.jsx
import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;