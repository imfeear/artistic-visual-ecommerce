import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../cart/useCart';

export default function CartButton() {
  const { totals } = useCart();
  return (
    <Link
      to="/carrinho"
      className="icon-btn cart-button"
      aria-label={`Carrinho, ${totals.quantity} ${totals.quantity === 1 ? 'item' : 'itens'}`}
    >
      <FiShoppingBag aria-hidden="true" />
      <span className="cart-count" aria-hidden="true">
        {totals.quantity > 99 ? '99+' : totals.quantity}
      </span>
    </Link>
  );
}
