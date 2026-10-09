import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiMessageCircle,
  FiMaximize2,
  FiPlus,
  FiMinus,
} from 'react-icons/fi';
import StoreLayout from '../components/StoreLayout';
import { Badge, Button, EmptyState, Modal, ProductImage } from '../components/ui';
import { getProduct } from '../lib/api';
import { money, contactUrl } from '../lib/format';
import { trackClick } from '../lib/analytics';
import useResource from '../hooks/useResource';
import { availabilityOf, availabilityLabel, categoryLabel, materialLabel } from '../lib/catalog';

export default function ProductDetails() {
  const { id } = useParams();
  const loader = useCallback(() => getProduct(id), [id]);
  const { data: product, loading, error, refresh } = useResource(loader);
  const [zoom, setZoom] = useState(false);
  const [expanded, setExpanded] = useState(true);
  return (
    <StoreLayout>
      <div className="container detail-container">
        <Link to="/catalogo" className="text-link detail-back">
          <FiArrowLeft /> Voltar para a coleção
        </Link>
        {loading ? (
          <div className="detail-grid" aria-busy="true">
            <div className="skeleton detail-skeleton" />
            <div>
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-price" />
            </div>
          </div>
        ) : error ? (
          <EmptyState
            error
            title="Esta peça não está disponível para consulta"
            description={error}
            action={
              <>
                <Button variant="secondary" onClick={refresh}>
                  Tentar novamente
                </Button>
                <Button to="/catalogo">Explorar a loja</Button>
              </>
            }
          />
        ) : (
          product && (
            <div className="detail-grid">
              <div className="detail-image">
                <ProductImage src={product.imageUrl} alt={product.name} />
                <button
                  className="icon-btn zoom-button"
                  aria-label="Ampliar imagem"
                  onClick={() => setZoom(true)}
                >
                  <FiMaximize2 />
                </button>
              </div>
              <div className="detail-info">
                <p className="eyebrow">{categoryLabel(product.category)} / ALDO SALES</p>
                <Badge
                  tone={
                    availabilityOf(product) === 'available'
                      ? 'success'
                      : availabilityOf(product) === 'made-to-order'
                        ? 'purple'
                        : 'neutral'
                  }
                >
                  {availabilityLabel(product)}
                </Badge>
                <h1>{product.name}</h1>
                <p className="detail-description">{product.description}</p>
                <div className="detail-price">
                  <strong>{money(product.price)}</strong>
                  <span>Consulte as condições diretamente com a loja.</span>
                </div>
                {availabilityOf(product) !== 'sold-out' ? (
                  <Button
                    href={contactUrl(product)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackClick('whatsapp_button')}
                  >
                    <FiMessageCircle />{' '}
                    {availabilityOf(product) === 'made-to-order'
                      ? 'Encomendar esta peça'
                      : 'Tenho interesse'}{' '}
                    <FiArrowUpRight />
                  </Button>
                ) : (
                  <Button to="/catalogo" variant="secondary">
                    Conhecer outras peças <FiArrowUpRight />
                  </Button>
                )}
                <p className="detail-contact-note">
                  Atendimento pelo WhatsApp para consultar a peça e combinar os próximos passos.
                </p>
                <div className="detail-accordion">
                  <button
                    aria-expanded={expanded}
                    aria-controls="piece-description"
                    onClick={() => setExpanded((s) => !s)}
                  >
                    Sobre esta peça {expanded ? <FiMinus /> : <FiPlus />}
                  </button>
                  {expanded && (
                    <div id="piece-description">
                      <p>
                        {product.description ||
                          'Consulte a loja para conhecer todos os detalhes desta peça.'}
                      </p>
                      <span>Referência #{product.id} · Aldo Sales</span>
                      {product.materials?.length > 0 && (
                        <span>
                          Materiais & técnicas: {product.materials.map(materialLabel).join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      <Modal
        open={zoom}
        onClose={() => setZoom(false)}
        title={product?.name || 'Imagem da peça'}
        className="image-dialog"
      >
        <ProductImage src={product?.imageUrl} alt={product?.name} />
      </Modal>
    </StoreLayout>
  );
}
