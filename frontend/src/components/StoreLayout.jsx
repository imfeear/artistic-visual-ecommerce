import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowUpRight, FiMenu, FiSearch, FiArrowRight } from 'react-icons/fi';
import { Button, Modal } from './ui';
import { trackClick } from '../lib/analytics';
import CartButton from './cart/CartButton';
import CartFeedback from './cart/CartFeedback';

export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label="Aldo Sales, página inicial"
    >
      <span className="brand-mark" aria-hidden="true">
        <img src="/aldo-sales.png" alt="" />
      </span>

      <span>
        Aldo<span className="brand-art">Sales.</span>
        <small>ARTE • CULTURA • ORIGEM</small>
      </span>
    </Link>
  );
}
function StoreHeader() {
  const [menu, setMenu] = useState(false);
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('busca') || '');
  const activeQuery = params.get('busca') || '';
  const { pathname } = useLocation();
  useEffect(() => {
    setQuery(activeQuery);
  }, [activeQuery]);
  const navigate = useNavigate();
  const search = (event) => {
    event.preventDefault();
    trackClick(`search:${query.trim()}`);
    const next = new URLSearchParams(pathname === '/catalogo' ? params : undefined);
    next.delete('pagina');
    if (query.trim()) next.set('busca', query.trim());
    else next.delete('busca');
    navigate(`/catalogo${next.size ? `?${next}` : ''}`);
    setMenu(false);
  };
  const links = (
    <>
      <NavLink
        to="/catalogo"
        onClick={() => {
          trackClick('nav_loja');
          setMenu(false);
        }}
      >
        A loja
      </NavLink>
      <Link
        to="/#destaques"
        onClick={() => {
          trackClick('nav_destaques');
          setMenu(false);
        }}
      >
        Destaques
      </Link>
      <Link to="/#origem" onClick={() => setMenu(false)}>
        Nossa origem
      </Link>
      <Link
        to="/#contato"
        onClick={() => {
          trackClick('nav_contato');
          setMenu(false);
        }}
      >
        Contato
      </Link>
    </>
  );
  return (
    <>
      <div className="announcement">
        <span>Arte autoral, peças únicas e edição limitada.</span>
        <Link to="/catalogo">
          Conheça a coleção <FiArrowUpRight />
        </Link>
      </div>
      <header className="store-header">
        <div className="store-header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Principal">
            {links}
          </nav>
          <div className="header-actions">
            <CartButton />
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Abrir menu"
              aria-expanded={menu}
            >
              <FiMenu />
            </button>
          </div>
          <form className="header-search" role="search" onSubmit={search}>
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar peças"
              placeholder="Encontre sua peça"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="icon-btn" aria-label="Buscar">
              <FiArrowRight />
            </button>
          </form>
        </div>
      </header>
      <Modal
        open={menu}
        onClose={() => setMenu(false)}
        title="Explore Aldo Sales"
        className="nav-dialog"
      >
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {links}
        </nav>
      </Modal>
    </>
  );
}
export default function StoreLayout({ children }) {
  return (
    <div className="store-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <StoreHeader />
      <CartFeedback />
      <main id="main-content">{children}</main>
      <footer className="store-footer" id="contato">
        <div className="container footer-main">
          <div>
            <Brand light />
            <p>
              O extraordinário mora na nossa cultura.
              <br />
              Pernambuco em cada detalhe.
            </p>
          </div>
          <div>
            <span className="footer-label">EXPLORE</span>
            <Link to="/catalogo">A loja</Link>
            <Link to="/#destaques">Destaques</Link>
            <Link to="/#origem">Nossa origem</Link>
          </div>
          <div>
            <span className="footer-label">VAMOS CONVERSAR</span>
            <p>Encontrou uma peça que é a sua cara?</p>
            <Button to="/catalogo" variant="outline-light">
              Escolha sua peça <FiArrowUpRight />
            </Button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Aldo Sales — Todos os direitos reservados.</span>
          <span>Feito de cultura. Feito para ficar.</span>
        </div>
      </footer>
    </div>
  );
}
