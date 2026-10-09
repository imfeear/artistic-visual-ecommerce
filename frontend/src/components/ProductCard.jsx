import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { Badge, ProductImage } from './ui';
import { money, contactUrl } from '../lib/format';
import { trackClick } from '../lib/analytics';
import { availabilityOf, availabilityLabel, categoryLabel } from '../lib/catalog';

export default function ProductCard({ product, index = 0 }) {
  const status = availabilityOf(product);
  const available = status !== 'sold-out';
  return (
    <article className="art-card" style={{ '--card-delay': `${Math.min(index, 5) * 45}ms` }}>
      <Link
        to={`/produto/${product.id}`}
        className="art-card-image"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <ProductImage src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="card-open">
          <FiArrowUpRight />
        </span>
      </Link>
      <div className="art-card-body">
        <div className="card-meta">
          <span>{categoryLabel(product.category)}</span>
          {status !== 'available' && (
            <Badge tone={status === 'made-to-order' ? 'purple' : 'neutral'}>
              {availabilityLabel(product)}
            </Badge>
          )}
          {product.featured && <Badge tone="purple">Destaque</Badge>}
        </div>
        <h3>
          <Link to={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <p>{product.description}</p>
        <div className="art-card-bottom">
          <strong>{money(product.price)}</strong>
          {available ? (
            <a
              href={contactUrl(product)}
              target="_blank"
              rel="noreferrer"
              className="card-contact"
              onClick={() => trackClick('whatsapp_button')}
            >
              WhatsApp <FiArrowUpRight />
            </a>
          ) : (
            <Link to={`/produto/${product.id}`} className="card-contact">
              Detalhes <FiArrowUpRight />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
