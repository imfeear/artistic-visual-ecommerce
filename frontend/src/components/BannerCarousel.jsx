import { useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { listCarouselPublic } from '../lib/api';
import { trackClick } from '../lib/analytics';
import { ProductImage } from './ui';
import useResource from '../hooks/useResource';

export default function BannerCarousel() {
  const { data, refresh } = useResource(listCarouselPublic, []);
  const slides = (Array.isArray(data) ? data : [])
    .filter((s) => s.active !== false && s.url)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const [selected, setSelected] = useState(0);
  const active = slides.length ? selected % slides.length : 0;
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'carousel:refresh') refresh();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);
  if (!slides.length) return null;
  const go = (direction) => setSelected((i) => (i + direction + slides.length) % slides.length);
  return (
    <section className="container managed-banners" aria-label="Destaques visuais">
      <div className="managed-banner">
        <ProductImage src={slides[active].url} alt={`Banner ${active + 1} de ${slides.length}`} />
        <div className="banner-controls">
          <span>
            {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          {slides.length > 1 && (
            <>
              <button
                className="icon-btn"
                aria-label="Banner anterior"
                onClick={() => {
                  go(-1);
                  trackClick('hero_arrow_left');
                }}
              >
                <FiArrowLeft />
              </button>
              <button
                className="icon-btn"
                aria-label="Próximo banner"
                onClick={() => {
                  go(1);
                  trackClick('hero_arrow_right');
                }}
              >
                <FiArrowRight />
              </button>
            </>
          )}
        </div>
        {slides.length > 1 && (
          <div className="banner-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir para slide ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => {
                  setSelected(i);
                  trackClick(`hero_dot_${i + 1}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
