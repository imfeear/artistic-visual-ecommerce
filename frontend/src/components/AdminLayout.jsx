import { createElement, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiBarChart2,
  FiImage,
  FiArrowUpRight,
  FiLogOut,
  FiMenu,
  FiChevronRight,
} from 'react-icons/fi';
import { Brand } from './StoreLayout';
import { Badge, Modal } from './ui';
import { useAuth } from '../auth/useAuth';

const links = [
  ['overview', 'Visão geral', FiGrid],
  ['products', 'Produtos', FiBox],
  ['analytics', 'Estatísticas', FiBarChart2],
  ['media', 'Vitrine & banners', FiImage],
];
export default function AdminLayout({ view, children, action, count = 0 }) {
  const { auth, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const navigation = (
    <>
      <Brand />
      <div className="workspace-label">
        <span className="workspace-dot" /> ESTÚDIO DE GESTÃO
      </div>
      <span className="sidebar-label">PRINCIPAL</span>
      <nav className="admin-nav" aria-label="Gestão">
        {links.map(([key, label, Icon]) => (
          <Link
            to={key === 'overview' ? '/admin' : `/admin?view=${key}`}
            key={key}
            onClick={() => setMenu(false)}
            className={view === key ? 'active' : ''}
            aria-current={view === key ? 'page' : undefined}
          >
            {createElement(Icon)}
            <span>{label}</span>
            {key === 'products' && <span className="nav-count">{count}</span>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-culture">
          <span>
            DE PERNAMBUCO
            <br />
            PARA O MUNDO.
          </span>
          <div className="sidebar-spectrum" />
        </div>
        <Link className="visit-store" to="/" target="_blank">
          Visitar a loja <FiArrowUpRight />
        </Link>
        <div className="admin-account">
          <span className="avatar">{auth.username?.slice(0, 1).toUpperCase() || 'A'}</span>
          <span>
            <strong>{auth.username || 'Administrador'}</strong>
            <small>Administrador</small>
          </span>
          <button className="icon-btn" onClick={logout} aria-label="Encerrar sessão">
            <FiLogOut />
          </button>
        </div>
      </div>
    </>
  );
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Ir para o conteúdo
      </a>
      <aside className="admin-sidebar">{navigation}</aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-btn admin-menu"
              onClick={() => setMenu(true)}
              aria-label="Abrir navegação administrativa"
            >
              <FiMenu />
            </button>
            <span>Estúdio</span>
            <FiChevronRight />
            <strong>{links.find(([key]) => key === view)?.[1]}</strong>
          </div>
          <Badge tone="purple">ALDO SALES</Badge>
        </header>
        <main className="admin-main" id="admin-main">
          <div className="admin-page-heading">
            <div>
              <p className="eyebrow">SEU ESPAÇO DE GESTÃO</p>
              <h1>
                {view === 'overview'
                  ? 'Um novo olhar para o seu negócio.'
                  : view === 'products'
                    ? 'Sua coleção, organizada.'
                    : view === 'analytics'
                      ? 'Entenda cada encontro.'
                      : 'A primeira impressão importa.'}
              </h1>
              <p>
                {view === 'overview'
                  ? 'Catálogo, conteúdo e audiência em um só lugar.'
                  : view === 'products'
                    ? 'Cuide de cada peça e mantenha sua loja atualizada.'
                    : view === 'analytics'
                      ? 'Acompanhe como as pessoas descobrem e exploram sua arte.'
                      : 'Escolha as imagens que apresentam a sua loja.'}
              </p>
            </div>
            {action}
          </div>
          {children}
          <footer className="admin-footer">
            <span>Aldo Sales / Estúdio de gestão</span>
            <span>Cultura viva. Gestão com propósito.</span>
          </footer>
        </main>
      </div>
      <Modal
        open={menu}
        onClose={() => setMenu(false)}
        title="Estúdio de gestão"
        className="admin-nav-dialog"
      >
        <div className="mobile-sidebar">{navigation}</div>
      </Modal>
    </div>
  );
}
