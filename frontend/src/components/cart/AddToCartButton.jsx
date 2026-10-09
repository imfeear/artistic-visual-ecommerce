import { FiPlus, FiCheck } from 'react-icons/fi';
import { useCart } from '../../cart/useCart';
import { quantityLimit } from '../../lib/cart';
import { Button } from '../ui';

export default function AddToCartButton({ product, className = '' }) {
  const { items, add, notice } = useCart();
  const quantity = items.find((item) => item.id === String(product.id))?.quantity || 0;
  const limit = quantityLimit(product);
  const added =
    notice?.tone === 'success' && notice.message === `${product.name} adicionada ao carrinho.`;
  const label = !limit
    ? 'Peça esgotada'
    : quantity >= limit
      ? 'Limite atingido'
      : 'Adicionar ao carrinho';
  return (
    <Button
      className={`add-to-cart ${className}`}
      variant="secondary"
      disabled={!limit || quantity >= limit}
      aria-label={`${label}: ${product.name}`}
      onClick={() => add(product)}
    >
      {added ? <FiCheck aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
      {added && quantity < limit ? 'Adicionado ao carrinho' : label}
    </Button>
  );
}
