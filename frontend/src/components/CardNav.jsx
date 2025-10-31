import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight, GoSearch } from "react-icons/go";
import { FiMenu } from "react-icons/fi";
import { trackClick } from "../lib/analytics";


export default function CardNav({
  logo,
  logoAlt = "Logo",
  brand = "Recife Art",
  items = [],
  menuColor = "#0f172a",
  logoHeight = 44,
  onSearch,
  searchPlaceholder = "Buscar...",
}) {
  const [q, setQ] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // refs
  const headerRef  = useRef(null);
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);
  const cardsRef   = useRef([]);
  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };

  

  // estado inicial do menu lateral
  useLayoutEffect(() => {
    if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 0, display: "none" });
    if (panelRef.current)   gsap.set(panelRef.current,   { opacity: 0, x: -16, display: "none" });
    gsap.set(cardsRef.current, { y: 12, opacity: 0 });
  }, []);

  const openMenu = () => {
    gsap.set([overlayRef.current, panelRef.current], { display: "block" });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: "power1.out" });
    gsap.to(panelRef.current,   { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" });
    gsap.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out", stagger: 0.06, delay: 0.04 });
    document.documentElement.style.overflow = "hidden";

      requestAnimationFrame(() => {
      headerRef.current?.classList.add("rolagem");
    });
  };

  const closeMenu = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, ease: "power1.in", onComplete: () => {
      gsap.set(overlayRef.current, { display: "none" });
    }});
    gsap.to(panelRef.current, { opacity: 0, x: -16, duration: 0.22, ease: "power3.in", onComplete: () => {
      gsap.set(panelRef.current, { display: "none" });
    }});
    gsap.to(cardsRef.current, { y: 12, opacity: 0, duration: 0.18, ease: "power3.in", stagger: -0.04 });
    document.documentElement.style.overflow = "";

requestAnimationFrame(() => {
      const y =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        0;

      if (y > 0) headerRef.current?.classList.add("rolagem");
      else headerRef.current?.classList.remove("rolagem");
    });

  };

  const toggleMenu = () => {
    if (!isExpanded) { setIsExpanded(true); openMenu(); }
    else { setIsExpanded(false); closeMenu(); }
  };

  // ESC fecha
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isExpanded) { setIsExpanded(false); closeMenu(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded]);

    useEffect(() => {
    const onScroll = () => {
      if (isExpanded) return; // não brigar com o estado azul do menu aberto

      const y =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        0;

      if (y > 0) headerRef.current?.classList.add("rolagem");
      else headerRef.current?.classList.remove("rolagem");
    };

    onScroll(); // estado inicial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isExpanded]);

  // ===== ROLAGEM: adiciona/remove classe "rolagem" no header =====
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setByScroll = () => {
      const y =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ?? 0;
      header.classList.toggle("rolagem", y > 0);
    };

    // Listener com rAF para evitar thrash
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setByScroll();
          ticking = false;
        });
      }
    };

    setByScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Fallback robusto: observa o espaçador com IO
    const sentinel = document.getElementById("nav-sentinel");
    let io;
    if (sentinel && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          // quando o espaçador some do topo, aplicamos a cor estática
          header.classList.toggle("rolagem", !entry.isIntersecting);
        },
        { root: null, threshold: 0 }
      );
      io.observe(sentinel);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const submitSearch = (e) => {
    e?.preventDefault?.();
    const term = q.trim();
    if (term) {
    trackClick(`search:${term}`);
    onSearch?.(term);  
    }
  };

  return (
    <>
      <header ref={headerRef} id="app-header" className={`navbar ${isExpanded ? "is-open" : ""}`}>
        <div className="mx-auto max-w-6xl px-3 md:px-4 nav-inner">
          <div className="nav-left">
            <button type="button" className="menu-btn" aria-label="Abrir menu" onClick={toggleMenu}>
              <FiMenu />
            </button>
            {logo ? (
              <img src={logo} alt={logoAlt} style={{ height: logoHeight, width:"auto", objectFit:"contain" }} />
            ) : (
              <span className="font-extrabold tracking-tight text-lg" style={{ color: menuColor }}>{brand}</span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            <a href="#loja" className="hover:opacity-85" onClick={()=>trackClick("nav_loja")}>loja</a>
            <a href="#destaques" className="hover:opacity-85" onClick={()=>trackClick("nav_destaques")}>destaques</a>
            <a href="#contato" className="hover:opacity-85" onClick={()=>trackClick("nav_contato")}>contato</a>
          </nav>

          <form onSubmit={submitSearch} className="search-wrap" role="search" aria-label="Buscar">
            <input
              type="search"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="search-input"
            />
            <button type="submit" className="search-icon-btn" aria-label="Buscar">
              <GoSearch />
            </button>
          </form>
        </div>
      </header>

      {/* OVERLAY + MENU VERTICAL */}
      <div
        ref={overlayRef}
        className="menu-overlay"
        onClick={() => { if (isExpanded) { setIsExpanded(false); closeMenu(); } }}
      />
      <aside ref={panelRef} className="menu-panel mx-3">
        {(items || []).slice(0,3).map((item, idx)=>(
          <div
            key={`${item.label}-${idx}`}
            ref={setCardRef(idx)}
            className="nav-card shadow-[0_12px_30px_rgba(0,0,0,.18)]"
            style={{ color:item.textColor, background:item.bgColor }}
          >
            <div className="font-semibold tracking-tight text-[18px] md:text-[20px]">{item.label}</div>
            <div className="mt-2 flex flex-col gap-[6px]">
              {item.links?.map((lnk,i)=>(
                <a key={i} href={lnk.href} aria-label={lnk.ariaLabel}
                   className="inline-flex items-center gap-[6px] text-[14px] md:text-[15px] hover:opacity-90 no-underline"
                   style={{ color:item.linkColor ?? item.textColor }} onClick={()=>trackClick(`menu_${(lnk.ariaLabel||lnk.label||"link").toString().toLowerCase().replace(/\s+/g,"_")}`)}>
                  <GoArrowUpRight aria-hidden="true" />{lnk.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}
