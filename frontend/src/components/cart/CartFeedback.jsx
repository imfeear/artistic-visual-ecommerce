import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { useCart } from '../../cart/useCart';

export default function CartFeedback() {
  const { notice, dismiss, items } = useCart();
  if (!notice) return null;
  return (
    <div
      className={`cart-feedback ${notice.tone === 'error' ? 'cart-feedback-error' : ''}`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      {notice.tone === 'error' ? (
        <FiAlertCircle aria-hidden="true" />
      ) : (
        <FiCheckCircle aria-hidden="true" />
      )}
      <div>
        <p>{notice.message}</p>
        {items.length > 0 && (
          <Link to="/carrinho" onClick={dismiss}>
            Ver carrinho
          </Link>
        )}
      </div>
      <button className="icon-btn" aria-label="Fechar mensagem do carrinho" onClick={dismiss}>
        <FiX />
      </button>
    </div>
  );
}
