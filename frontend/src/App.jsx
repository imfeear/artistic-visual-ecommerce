import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiArrowLeft, FiArrowRight, FiArrowDown } from 'react-icons/fi';
import StoreLayout from './components/StoreLayout';
import ProductCard from './components/ProductCard';
import BannerCarousel from './components/BannerCarousel';
import { Button, EmptyState, ProductSkeletons, SectionTitle } from './components/ui';
import useProducts from './hooks/useProducts';
import { trackClick } from './lib/analytics';

const traditions = [
  ['01', 'Frevo', 'Movimento que vira forma.', 'frevo'],
  ['02', 'La Ursa', 'Textura, memória e presença.', 'ursa'],
  ['03', 'Boneco da Meia-Noite', 'A grandeza do imaginário.', 'boneco'],
  ['04', 'Papangus', 'O mistério por trás da máscara.', 'papangu'],
  ['05', 'Caboclos de Lança', 'Ornamento, brilho e resistência.', 'caboclo'],
];
export default function App() {
  const { products, loading, error, refresh } = useProducts();
  const rail = useRef(null);
  const scroll = (dir) =>
    rail.current?.scrollBy({
      left: dir * rail.current.clientWidth * 0.8,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  return (
    <StoreLayout>
      <section className="campaign-hero">
        <div className="hero-grain" aria-hidden="true" />
        <div className="container campaign-grid">
          <div className="campaign-copy">
            <div className="campaign-kicker">
              <span /> PERNAMBUCO, EM ESTADO DE ARTE
            </div>
            <h1>
              Cultura que
              <br />
              pulsa.
              <br />
              <em>Arte que fica.</em>
            </h1>
            <p>
              Arte autoral, peças únicas e edição limitada.
              <br />
              Um encontro entre o que somos e o que criamos.
            </p>
            <div className="campaign-actions">
              <Button to="/catalogo" variant="gold" onClick={() => trackClick('hero_loja')}>
                Explore a loja <FiArrowUpRight />
              </Button>
              <Link to="/#origem" className="hero-story-link">
                Conheça nossa origem <FiArrowRight />
              </Link>
            </div>
            <div className="campaign-bottom">
              <span>ART PROJECT — ALDO SALES</span>
              <a href="#destaques" aria-label="Ir para destaques">
                <FiArrowDown />
              </a>
            </div>
          </div>
          <div className="campaign-visual">
            <img
              className="campaign-art"
              src="/images/pernambuco-editorial.webp"
              alt="Composição artística original de texturas, máscaras, tecidos e sombrinha de frevo inspirada no Carnaval de Pernambuco"
              fetchPriority="high"
            />
            <div className="art-caption">
              <span>EXPRESSÕES DE PERNAMBUCO</span>
              <strong>Tradição em novas formas.</strong>
              <span className="caption-number">01 — 05</span>
            </div>
          </div>
        </div>
        <div className="hero-vertical-label" aria-hidden="true">
          ORIGEM É O NOSSO PONTO DE PARTIDA
        </div>
      </section>
      <div className="culture-strip">
        <div className="container">
          <span>Feito de cultura.</span>
          <span>Escolhido com intenção.</span>
          <span>Arte para ficar.</span>
          <span className="strip-origin">RECIFE • PERNAMBUCO</span>
        </div>
      </div>
      <section className="container section featured-section" id="destaques">
        <SectionTitle
          eyebrow="PEÇAS QUE MERECEM UM OLHAR"
          title="Encontros extraordinários."
          description="Arte autoral, peças únicas e edição limitada."
          to="/catalogo"
        />
        {loading && <ProductSkeletons />}
        {error && (
          <EmptyState
            error
            title="A coleção está temporariamente indisponível"
            description={error}
            action={
              <Button variant="secondary" onClick={refresh}>
                Tentar novamente
              </Button>
            }
          />
        )}
        {!loading && !error && products.length === 0 && (
          <EmptyState
            title="Novas peças estão a caminho"
            description="Em breve, novas formas de levar a nossa arte para casa."
          />
        )}
        {!loading && products.length > 0 && (
          <>
            <div className="featured-rail" ref={rail}>
              {products.slice(0, 16).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <div className="rail-footer">
              <span>Deslize e descubra a coleção</span>
              <div>
                <button
                  className="icon-btn"
                  onClick={() => scroll(-1)}
                  aria-label="Destaques anteriores"
                >
                  <FiArrowLeft />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => scroll(1)}
                  aria-label="Próximos destaques"
                >
                  <FiArrowRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <section className="origin-section" id="origem">
        <div className="container origin-grid">
          <div className="origin-art">
            <img
              src="/images/pernambuco-editorial.webp"
              alt="Detalhe da composição cultural: camadas, bordados e cores pernambucanas"
              loading="lazy"
            />
            <span className="origin-art-label">MEMÓRIA / MATÉRIA / MOVIMENTO</span>
          </div>
          <div className="origin-copy">
            <p className="eyebrow">NOSSA ORIGEM</p>
            <h2>
              Não é só uma peça.
              <br />É um pedaço
              <br />
              <em>de Pernambuco.</em>
            </h2>
            <p>
              A força da cultura popular encontra novas formas de expressão. Do frevo aos bordados,
              das máscaras ao imaginário das ruas: referências que atravessam o tempo e inspiram o
              nosso olhar.
            </p>
            <Link to="/catalogo" className="text-link">
              Encontre a sua peça <FiArrowUpRight />
            </Link>
          </div>
        </div>
        <div className="container tradition-grid">
          {traditions.map(([number, name, description, tone]) => (
            <div className={`tradition tradition-${tone}`} key={name}>
              <span>{number}</span>
              <h3>{name}</h3>
              <p>{description}</p>
              <div className="tradition-line" />
            </div>
          ))}
        </div>
      </section>
      <BannerCarousel />
      <section className="container section" id="loja">
        <SectionTitle eyebrow="AUTORAL. SINGULAR. SEU." title="A loja" to="/catalogo" />
        {loading ? (
          <ProductSkeletons count={3} />
        ) : products.length > 0 ? (
          <div className="product-grid home-grid">
            {products.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          !error && (
            <EmptyState
              title="Nenhum produto cadastrado ainda"
              description="Volte em breve para descobrir novas peças."
            />
          )
        )}
        <div className="collection-cta">
          <Button to="/catalogo" variant="secondary">
            Explorar a coleção completa <FiArrowRight />
          </Button>
        </div>
      </section>
    </StoreLayout>
  );
}
