import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './cartStore';
import { CART_STORAGE_KEY, cartReducer, cartTotals, decodeCart, encodeCart } from '../lib/cart';

function initialCart() {
  try {
    return { items: decodeCart(localStorage.getItem(CART_STORAGE_KEY)), notice: null };
  } catch {
    return {
      items: [],
      notice: {
        tone: 'error',
        message:
          'O navegador não permite salvar seu carrinho. Ele ficará disponível enquanto esta página estiver aberta.',
      },
    };
  }
}
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initialCart);
  useEffect(() => {
    try {
      const raw = encodeCart(state.items);
      if (localStorage.getItem(CART_STORAGE_KEY) !== raw)
        localStorage.setItem(CART_STORAGE_KEY, raw);
    } catch {
      dispatch({
        type: 'notice',
        tone: 'error',
        message:
          'Não foi possível salvar o carrinho neste navegador. Mantenha esta página aberta para continuar.',
      });
    }
  }, [state.items]);
  useEffect(() => {
    const restore = (event) => {
      if (event.key === CART_STORAGE_KEY || event.key === null)
        dispatch({ type: 'restore', raw: event.newValue });
    };
    window.addEventListener('storage', restore);
    return () => window.removeEventListener('storage', restore);
  }, []);
  const add = useCallback((product) => dispatch({ type: 'add', product }), []);
  const setQuantity = useCallback(
    (id, quantity) => dispatch({ type: 'quantity', id, quantity }),
    [],
  );
  const remove = useCallback((id) => dispatch({ type: 'remove', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const syncProducts = useCallback((products) => dispatch({ type: 'sync', products }), []);
  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);
  useEffect(() => {
    if (!state.notice || state.notice.tone === 'error') return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [state.notice, dismiss]);
  const value = useMemo(
    () => ({
      ...state,
      totals: cartTotals(state.items),
      add,
      setQuantity,
      remove,
      clear,
      syncProducts,
      dismiss,
    }),
    [state, add, setQuantity, remove, clear, syncProducts, dismiss],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
