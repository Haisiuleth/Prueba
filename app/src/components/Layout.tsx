import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useApolloClient } from '@apollo/client';
import logo from '../assets/logo.png';
import '../css/header.css';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const client = useApolloClient();
  const location = useLocation();
  const [open, setOpen] = useState(false);


  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onLogout = () => {
    setOpen(false);
    logout();
    client.clearStore();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <>
      <header className="app-header no-print" data-open={open}>
        <img src={logo} alt="OFFCORSS" className="app-header__logo" />

        <button
          type="button"
          className="app-header__burger"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div id="main-menu" className="app-header__menu">
          <nav aria-label="Principal" className="app-header__nav">
            <NavLink to="/products" className={linkClass}>Productos</NavLink>
            <NavLink to="/profile" className={linkClass}>Perfil</NavLink>
          </nav>
          <button onClick={onLogout} className="btn btn-ghost app-header__logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      {open && <div className="app-header__backdrop" onClick={() => setOpen(false)} />}

      <main className="pa3 pa4-ns mw8 center">
        <Outlet />
      </main>
    </>
  );
}