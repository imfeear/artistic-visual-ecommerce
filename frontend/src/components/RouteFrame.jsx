import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { trackPageview } from '../lib/analytics';
export function RouteFrame() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    trackPageview(pathname);
    document.title = `${pathname.startsWith('/admin') ? 'Estúdio' : pathname === '/catalogo' ? 'A loja' : pathname === '/carrinho' ? 'Seu carrinho' : pathname === '/login' ? 'Entrar' : pathname.startsWith('/produto/') ? 'Detalhes da peça' : 'Arte com origem'} | Aldo Sales`;
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const scroll = () => {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'instant' });
        return true;
      }
      return false;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => observer.disconnect(), 5000);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname, hash]);
  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status">
          <span className="spinner" /> Preparando seu próximo encontro…
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}
export function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">ALDO SALES / 404</span>
      <h1>
        Um pequeno desvio
        <br />
        no caminho da arte.
      </h1>
      <p>Esta página não foi encontrada.</p>
      <Link className="btn btn-primary" to="/">
        Voltar para a loja
      </Link>
    </div>
  );
}
export function RouteError() {
  return (
    <div className="not-found">
      <span className="eyebrow">ALDO SALES</span>
      <h1>Vamos tentar de novo?</h1>
      <p>Não foi possível abrir esta página.</p>
      <a className="btn btn-primary" href="/">
        Voltar para a loja
      </a>
    </div>
  );
}
