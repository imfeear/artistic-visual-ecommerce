import { availabilityOf, validPrice } from './catalog.js';

export const CART_STORAGE_KEY = 'aldo-sales:cart:v1';
export const MAX_QUANTITY = 999;
const MAX_LINES = 100;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatCents = (cents) =>
  cents == null ? 'Preço sob consulta' : currency.format(cents / 100);
export function priceInCents(price) {
  if (!validPrice(price)) return null;
  const cents = Math.round((Number(price) + Number.EPSILON) * 100);
  return Number.isSafeInteger(cents) && cents <= Number.MAX_SAFE_INTEGER / MAX_QUANTITY / MAX_LINES
    ? cents
    : null;
}
export function stockOf(product) {
  if (product?.stock == null || product.stock === '') return null;
  if (!validPrice(product.stock)) return 0;
  const stock = Number(product.stock);
  return Number.isSafeInteger(stock) && stock >= 0 ? stock : 0;
}
export const quantityLimit = (product) =>
  product?.unavailable || availabilityOf(product) === 'sold-out'
    ? 0
    : Math.min(stockOf(product) ?? MAX_QUANTITY, MAX_QUANTITY);

function snapshot(product) {
  if (
    !product ||
    !/^[1-9]\d*$/.test(String(product.id)) ||
    typeof product.name !== 'string' ||
    !product.name.trim()
  )
    return null;
  const cents = priceInCents(product.price);
  return {
    id: String(product.id),
    name: product.name.trim().slice(0, 160),
    category: typeof product.category === 'string' ? product.category : null,
    imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : '',
    price: cents == null ? null : cents / 100,
    availability: availabilityOf(product),
    stock: stockOf(product),
    unavailable: product.unavailable === true,
  };
}
export function normalizeCartItems(input) {
  if (!Array.isArray(input)) return [];
  const items = new Map();
  for (const value of input.slice(0, MAX_LINES)) {
    const product = snapshot(value);
    const quantity = Number(value?.quantity);
    if (!product || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const previous = items.get(product.id);
    items.set(product.id, {
      ...product,
      quantity: Math.max(
        1,
        Math.min((previous?.quantity || 0) + quantity, quantityLimit(product) || 1),
      ),
    });
  }
  return [...items.values()];
}
export function decodeCart(raw) {
  try {
    const data = JSON.parse(raw);
    return data?.version === 1 ? normalizeCartItems(data.items) : [];
  } catch {
    return [];
  }
}
export const encodeCart = (items) => JSON.stringify({ version: 1, items });
export const subtotalCents = (item) => {
  const cents = priceInCents(item.price);
  return cents == null ? null : cents * item.quantity;
};
export function cartTotals(items) {
  return items.reduce(
    (total, item) => ({
      quantity: total.quantity + item.quantity,
      cents: total.cents + (subtotalCents(item) ?? 0),
      quotes: total.quotes + (subtotalCents(item) == null ? 1 : 0),
      unavailable: total.unavailable + (quantityLimit(item) < item.quantity ? 1 : 0),
    }),
    { quantity: 0, cents: 0, quotes: 0, unavailable: 0 },
  );
}

export function cartReducer(state, action) {
  const notice = (message, tone = 'success', items = state.items) => ({
    ...state,
    items,
    notice: { message, tone },
  });
  switch (action.type) {
    case 'add': {
      const product = snapshot(action.product);
      if (!product) return notice('Não foi possível adicionar esta peça.', 'error');
      const limit = quantityLimit(product);
      if (!limit) return notice('Esta peça está esgotada ou indisponível.', 'error');
      const existing = state.items.find((item) => item.id === product.id);
      if (existing && existing.quantity >= limit)
        return notice('Você já atingiu a quantidade disponível desta peça.', 'error');
      if (!existing && state.items.length >= MAX_LINES)
        return notice('Seu carrinho atingiu o limite de peças diferentes.', 'error');
      const item = { ...product, quantity: (existing?.quantity || 0) + 1 };
      return notice(
        `${product.name} adicionada ao carrinho.`,
        'success',
        existing
          ? state.items.map((value) => (value.id === item.id ? item : value))
          : [...state.items, item],
      );
    }
    case 'quantity': {
      const item = state.items.find((value) => value.id === String(action.id));
      if (!item) return state;
      const quantity = Number(action.quantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1)
        return notice('A quantidade mínima é 1.', 'error');
      if (quantity > quantityLimit(item))
        return notice('Quantidade indisponível. Confira o limite desta peça.', 'error');
      return {
        ...state,
        notice: null,
        items: state.items.map((value) => (value.id === item.id ? { ...value, quantity } : value)),
      };
    }
    case 'remove':
      return notice(
        'Peça removida do carrinho.',
        'success',
        state.items.filter((item) => item.id !== String(action.id)),
      );
    case 'clear':
      return notice('Carrinho limpo.', 'success', []);
    case 'restore':
      return { ...state, items: decodeCart(action.raw), notice: null };
    case 'sync': {
      const products = new Map(action.products.map((product) => [String(product.id), product]));
      let changed = false;
      const items = state.items.map((item) => {
        const current = products.get(item.id);
        const product = (current ? snapshot(current) : null) || { ...item, unavailable: true };
        const next = {
          ...product,
          quantity: Math.max(1, Math.min(item.quantity, quantityLimit(product) || 1)),
        };
        if (JSON.stringify(item) !== JSON.stringify(next)) changed = true;
        return next;
      });
      return changed
        ? notice(
            'Atualizamos preços, quantidades ou disponibilidade das suas peças. Confira o resumo.',
            'info',
            items,
          )
        : state;
    }
    case 'notice':
      return notice(action.message, action.tone);
    case 'dismiss':
      return { ...state, notice: null };
    default:
      return state;
  }
}
