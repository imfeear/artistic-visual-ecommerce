import { useEffect, useMemo, useState } from "react";
import CardNav from "./components/CardNav";
import logo from "./assets/logo.png";
import { listProducts, listCarouselPublic } from "./lib/api";
import { trackPageview, trackClick } from "./lib/analytics";

export default function App() {
  const grupos = [
    {
      label: "Esculturas",
      textColor: "#fff",
      linkColor: "#fff",
      bgColor: "#00AEEF",
      links: [
        { label: "Coleções", ariaLabel: "Coleções", href: "#" },
        { label: "Peças Únicas", ariaLabel: "Peças únicas", href: "#" },
      ],
    },
    {
      label: "Destaques",
      textColor: "#0f172a",
      linkColor: "#0f172a",
      bgColor: "#FFD100",
      links: [
        { label: "Mais Vendidos", ariaLabel: "Mais vendidos", href: "#" },
        { label: "Novidades", ariaLabel: "Novidades", href: "#" },
      ],
    },
    {
      label: "Contato",
      textColor: "#fff",
      linkColor: "#fff",
      bgColor: "#FF3EA5",
      links: [
        { label: "WhatsApp", ariaLabel: "WhatsApp", href: "#contato" },
        { label: "Instagram", ariaLabel: "Instagram", href: "#" },
        { label: "Localização", ariaLabel: "Localização", href: "#" },
      ],
    },
  ];

  // --- Carrossel (dinâmico do backend) ---
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
  const normalizeUrl = (u) => {
    if (!u) return u;
    if (u.startsWith("/uploads/")) return `${API_BASE}${u}`; // URL relativa do backend
    return u;
  };

  const [slides, setSlides] = useState([]);
  const heroImages = useMemo(
    () =>
      slides.length
        ? slides
            .filter((s) => s.active !== false)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((s) => normalizeUrl(s.url))
        : [
            // fallback se não houver nada no backend
            "https://picsum.photos/seed/recife-1/1600/600",
            "https://picsum.photos/seed/recife-2/1600/600",
            "https://picsum.photos/seed/recife-3/1600/600",
          ],
    [slides]
  );

  const [slide, setSlide] = useState(0);
  const go = (dir) =>
    setSlide((s) => (heroImages.length ? (s + dir + heroImages.length) % heroImages.length : 0));
  const goDot = (i) => setSlide(i);

  const loadSlides = async () => {
    try {
      const data = await listCarouselPublic();
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      setSlides([]);
    }
  };

  // volta para o primeiro slide quando o total muda
  useEffect(() => {
    setSlide(0);
  }, [heroImages.length]);

  const onSearch = (term) => console.log("Buscar:", term);

  // --- Produtos do backend ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackPageview("/");
    load();
    loadSlides();

    const handler = (e) => {
      if (e.key === "products:refresh") load();
      if (e.key === "carousel:refresh") loadSlides();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="bg-carnaval-vibrante text-slate-900">
      <CardNav
        logo={logo}
        logoAlt="Recife Art"
        brand="Recife Art"
        items={grupos}
        onSearch={onSearch}
        searchPlaceholder="Buscar esculturas..."
      />

      <div id="nav-sentinel" className="nav-spacer" />

      {/* HERO */}
        <section className="relative z-[1]">
          <div className="hero-wrap full-bleed">
            <div className="hero-carousel full shadow-[0_14px_36px_rgba(0,0,0,.18)]
                            h-[220px] sm:h-[300px] md:h-[420px] overflow-hidden">
              {heroImages.map((src, i) => (
                <div key={`${src}-${i}`} className={`hero-slide ${i === slide ? "active" : ""} relative`}>
                  {/* imagem única cobrindo todo o hero */}
                  <img
                    src={src}
                    alt={`banner ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    draggable={false}
                  />
                  {/* opcional: leve gradiente para contraste do topo/menus */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
                </div>
              ))}

              {heroImages.length > 1 && (
                <>
                  <button
                    className="hero-arrow left"
                    onClick={() => { trackClick("hero_arrow_left"); go(-1); }}
                    aria-label="Anterior"
                  >‹</button>
                  <button
                    className="hero-arrow right"
                    onClick={() => { trackClick("hero_arrow_right"); go(1); }}
                    aria-label="Próximo"
                  >›</button>
                </>
              )}

              {heroImages.length > 1 && (
                <div className="hero-dots">
                  {heroImages.map((_, iDot) => (
                    <button
                      key={iDot}
                      className={`hero-dot ${iDot === slide ? "active" : ""}`}
                      onClick={() => { trackClick(`hero_dot_${iDot + 1}`); goDot(iDot); }}
                      aria-label={`Ir para slide ${iDot + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      {/* CONTEÚDO */}
      <main className="relative z-[1] mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aldo Sales Projeto</h1>
        <p className="mt-2 text-slate-800/90">Arte autoral, peças únicas e edição limitada.</p>

        <section id="loja" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <article key={i} className="rounded-2xl bg-white/92 shadow p-4 animate-pulse">
                <div className="aspect-[16/10] rounded-xl bg-slate-200" />
                <div className="mt-3 h-5 bg-slate-200 rounded" />
                <div className="mt-2 h-4 bg-slate-200 rounded w-2/3" />
                <div className="mt-3 h-8 bg-slate-200 rounded" />
              </article>
            ))}

          {!loading && products.length === 0 && (
            <p className="text-slate-700 col-span-full">Nenhum produto cadastrado ainda.</p>
          )}

          {!loading &&
            products.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl bg-white/92 shadow-[0_10px_30px_rgba(0,0,0,.15)] hover:shadow-[0_14px_36px_rgba(0,0,0,.18)] transition p-4 backdrop-blur"
              >
                <div className="aspect-[16/10] rounded-xl bg-white/90 border border-black/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={p.imageUrl || `https://picsum.photos/seed/p-${p.id}/900/600`}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain mx-auto"
                  />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-600">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{currency.format(Number(p.price ?? 0))}</span>
                  <a
                    href={`https://wa.me/5581981018967?text=${encodeURIComponent(`Tenho interesse em: ${p.name}`)}`}
                    onClick={() => trackClick("whatsapp_button")}
                    className="px-3 py-1.5 rounded-lg text-sm text-white"
                    style={{ background: "#00C853" }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </div>
              </article>
            ))}
        </section>
      </main>

      <footer id="contato" className="relative z-[1] mt-10 border-t border-white/30">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-slate-900/80">
          © {new Date().getFullYear()} Recife Art — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
