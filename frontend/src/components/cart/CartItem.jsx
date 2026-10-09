import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../../cart/useCart';
import { categoryLabel, availabilityLabel } from '../../lib/catalog';
import { formatCents, priceInCents, quantityLimit, subtotalCents } from '../../lib/cart';
import { ProductImage } from '../ui';

export default function CartItem({ item }) {
  const { setQuantity, remove } = useCart();
  const limit = quantityLimit(item);
  return (
    <article className="cart-item" aria-label={item.name}>
      <Link
        to={`/produto/${item.id}`}
        className="cart-item-image"
        aria-label={`Ver detalhes de ${item.name}`}
      >
        <ProductImage src={item.imageUrl} alt={item.name} loading="lazy" />
      </Link>
      <div className="cart-item-info">
        <span className="cart-item-category">{categoryLabel(item.category)}</span>
        <h2>
          <Link to={`/produto/${item.id}`}>{item.name}</Link>
        </h2>
        <p>
          Valor unitário: <strong>{formatCents(priceInCents(item.price))}</strong>
        </p>
        <span className={`cart-item-availability ${!limit ? 'cart-item-unavailable' : ''}`}>
          {!limit ? 'Indisponível. Remova esta peça para continuar.' : availabilityLabel(item)}
          {limit > 0 &&
            item.stock != null &&
            ` · ${item.stock} ${item.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}`}
        </span>
        <div className="cart-item-controls">
          <div className="quantity-control" role="group" aria-label={`Quantidade de ${item.name}`}>
            <button
              type="button"
              className="icon-btn"
              disabled={item.quantity <= 1 || !limit}
              onClick={() => setQuantity(item.id, item.quantity - 1)}
              aria-label={`Diminuir quantidade de ${item.name}`}
            >
              <FiMinus />
            </button>
            <output aria-label={`Quantidade atual de ${item.name}`}>{item.quantity}</output>
            <button
              type="button"
              className="icon-btn"
              disabled={item.quantity >= limit}
              onClick={() => setQuantity(item.id, item.quantity + 1)}
              aria-label={`Aumentar quantidade de ${item.name}`}
            >
              <FiPlus />
            </button>
          </div>
          <button
            type="button"
            className="cart-remove"
            onClick={() => remove(item.id)}
            aria-label={`Remover ${item.name}`}
          >
            <FiTrash2 /> Remover
          </button>
        </div>
      </div>
      <div className="cart-item-subtotal">
        <span>Subtotal</span>
        <strong>{formatCents(subtotalCents(item))}</strong>
      </div>
    </article>
  );
}
