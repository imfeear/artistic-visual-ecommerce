import { useContext } from 'react';
import { CartContext } from './cartStore';
export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('O carrinho precisa do CartProvider.');
  return cart;
}
