import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  brand = 'Recife Art',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor = '#0f172a',
  logoHeight = 56,
  onSearch,
  searchPlaceholder = 'Buscar esculturas...',
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [q, setQ] = useState('');
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const prev = {
          vis: contentEl.style.visibility,
          pe: contentEl.style.pointerEvents,
          pos: contentEl.style.position,
          h: contentEl.style.height,
        };
        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;
        const topBar = 60, padding = 16, contentHeight = contentEl.scrollHeight;
        Object.assign(contentEl.style, { visibility: prev.vis, pointerEvents: prev.pe, position: prev.pos, height: prev.h });
        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline(); newTl && newTl.progress(1); tlRef.current = newTl;
      } else {
        tlRef.current.kill();
        const newTl = createTimeline(); newTl && (tlRef.current = newTl);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current; if (!tl) return;
    if (!isExpanded) { setIsHamburgerOpen(true); setIsExpanded(true); tl.play(0); }
    else { setIsHamburgerOpen(false); tl.eventCallback('onReverseComplete', () => setIsExpanded(false)); tl.reverse(); }
  };

  const setCardRef = i => el => { if (el) cardsRef.current[i] = el; };

  const submitSearch = (e) => {
    e?.preventDefault?.();
    onSearch?.(q.trim());
  };

  return (
    <div className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[980px] z-[99] top-[1.2em] md:top-[2em] ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} block h-[60px] p-0 rounded-2xl shadow-lg relative overflow-hidden will-change-[height]`}
        style={{ background: baseColor }}
        aria-label="Navegação principal"
      >
        {/* Topo */}
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between gap-3 px-3 md:px-4 z-[2]">
          {/* Hamburger */}
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-9 w-9 rounded-xl bg-white/70 hover:bg-white/90 border border-black/5 flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Fechar menu' : 'Abrir menu'}
            tabIndex={0}
            style={{ color: menuColor }}
          >
            <div className={`h-[2px] w-[22px] bg-current transition-all ${isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''}`} />
            <div className={`h-[2px] w-[22px] bg-current transition-all ${isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''}`} />
          </div>

          {/* Logo / Brand centralizado no desktop */}
          <div className="logo-container flex items-center order-1 md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            {logo ? (
              <img src={logo} alt={logoAlt} style={{ height: logoHeight, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span className="font-extrabold tracking-tight text-base md:text-lg" style={{ color: menuColor }}>
                {brand}
              </span>
            )}
          </div>

          {/* Busca */}
          <form onSubmit={submitSearch} className="hidden md:flex items-center gap-2 ml-auto" role="search">
            <input
              type="search"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-[260px] rounded-xl border border-black/10 bg-white/85 px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--azul)]/40"
              aria-label="Buscar"
            />
            <button
              type="submit"
              className="h-9 px-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--rosa), var(--azul))' }}
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Conteúdo (cartões) */}
        <div
          className={`card-nav-content absolute left-0 right-0 top[60px] md:top-[60px] bottom-0 p-3 md:p-4 flex flex-col items-stretch gap-3 justify-start z-[1] ${isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'} md:flex-row md:items-end md:gap-3`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              ref={setCardRef(idx)}
              className="nav-card select-none relative flex flex-col gap-2 p-4 rounded-xl min-w-0 flex-1 shadow-[0_12px_30px_rgba(0,0,0,.18)]"
              style={{
                color: item.textColor,
                background: item.bgGradient ?? item.bgColor,
              }}
            >
              <div className="nav-card-label font-semibold tracking-tight text-[18px] md:text-[20px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[6px]">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="inline-flex items-center gap-[6px] no-underline cursor-pointer hover:opacity-90 text-[14px] md:text-[15px]"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    style={{ color: item.linkColor ?? item.textColor }}
                  >
                    <GoArrowUpRight aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
