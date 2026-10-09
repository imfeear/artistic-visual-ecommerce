import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cartReducer,
  cartTotals,
  decodeCart,
  encodeCart,
  normalizeCartItems,
  priceInCents,
  quantityLimit,
} from '../../src/lib/cart.js';
import { cartMessage, cartWhatsAppUrl } from '../../src/lib/whatsapp.js';

const product = {
  id: 1,
  name: 'Brincos de frevo',
  category: 'brincos',
  price: 10.1,
  availability: 'available',
  stock: 3,
};
const initial = () => ({ items: [], notice: null });
const add = (state, item = product) => cartReducer(state, { type: 'add', product: item });
test('produtos iguais somam quantidade sem duplicar linhas ou mutar a origem', () => {
  const first = add(initial());
  const second = add(first);
  assert.equal(first.items[0].quantity, 1);
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].quantity, 2);
  assert.equal(product.quantity, undefined);
});
test('quantidades respeitam estoque, disponibilidade e mínimo de uma unidade', () => {
  let state = add(add(add(initial())));
  assert.equal(add(state).items[0].quantity, 3);
  for (const quantity of [0, -1, NaN, Infinity, 1.5, 4]) {
    state = cartReducer(state, { type: 'quantity', id: 1, quantity });
    assert.equal(state.items[0].quantity, 3);
    assert.equal(state.notice.tone, 'error');
  }
  assert.equal(add(initial(), { ...product, availability: 'sold-out' }).items.length, 0);
  assert.equal(add(initial(), { ...product, stock: 0 }).items.length, 0);
  assert.equal(quantityLimit({ ...product, stock: true }), 0);
});
test('subtotal e total são calculados em centavos, inclusive centavos fracionários', () => {
  const items = normalizeCartItems([
    { ...product, quantity: 3 },
    { ...product, id: 2, price: 19.9, quantity: 2 },
  ]);
  assert.deepEqual(cartTotals(items), { quantity: 5, cents: 7010, quotes: 0, unavailable: 0 });
  assert.equal(priceInCents(1.005), 101);
});
test('preço ausente é sob consulta, sem converter em peça gratuita', () => {
  const state = add(initial(), { ...product, price: null });
  assert.deepEqual(cartTotals(state.items), { quantity: 1, cents: 0, quotes: 1, unavailable: 0 });
  assert.match(cartMessage(state.items), /Valor unitário: Preço sob consulta/);
  assert.match(cartMessage(state.items), /Além dos valores das peças sob consulta/);
});
test('persistência sanitiza dados, remove duplicatas e nunca guarda dados pessoais', () => {
  const items = normalizeCartItems([
    null,
    {},
    { ...product, quantity: 1, customer: 'Não persistir', password: 'Não persistir' },
    { ...product, quantity: 1 },
    { ...product, id: 2, quantity: -1 },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 2);
  const raw = encodeCart(items);
  assert.doesNotMatch(raw, /customer|password|Não persistir/);
  assert.deepEqual(decodeCart(raw), items);
  for (const value of ['{', 'null', '{}', '{"version":9,"items":[]}'])
    assert.deepEqual(decodeCart(value), []);
});
test('revalidação atualiza preço, reduz estoque e sinaliza produtos removidos', () => {
  const state = add(add(initial()));
  const next = cartReducer(state, {
    type: 'sync',
    products: [{ ...product, price: 15, stock: 1 }],
  });
  assert.equal(next.items[0].quantity, 1);
  assert.equal(next.items[0].price, 15);
  assert.equal(state.items[0].quantity, 2);
  const removed = cartReducer(next, { type: 'sync', products: [] });
  assert.equal(removed.items[0].unavailable, true);
  assert.equal(cartWhatsAppUrl(removed.items), '');
});
test('remoção e limpeza preservam a origem e deixam carrinho vazio', () => {
  const state = add(initial());
  assert.deepEqual(cartReducer(state, { type: 'remove', id: 1 }).items, []);
  assert.deepEqual(cartReducer(state, { type: 'clear' }).items, []);
  assert.equal(state.items.length, 1);
});
test('WhatsApp recebe resumo completo, moeda brasileira e campos opcionais codificados', () => {
  const items = add(add(initial())).items;
  const details = {
    name: 'João & Ana',
    city: 'Recife/PE',
    notes: 'Azul + rosa?\nQuero personalizar.',
  };
  const message = cartMessage(items, details);
  assert.match(message, /Aldo Sales/);
  assert.match(message, /Categoria: Brincos/);
  assert.match(message, /Quantidade: 2/);
  assert.match(message, /Total estimado: R\$\s20,20/);
  const url = new URL(cartWhatsAppUrl(items, details));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/5581987063327');
  assert.equal(url.searchParams.get('text'), message);
  assert.match(message, /Nome: João & Ana/);
  assert.match(message, /Cidade\/UF: Recife\/PE/);
  assert.match(message, /Observações: Azul \+ rosa\?/);
});
test('campos vazios são omitidos e carrinho vazio não gera conversa', () => {
  const message = cartMessage(add(initial()).items, { name: ' ', city: '', notes: '\n' });
  assert.doesNotMatch(message, /Nome:|Cidade\/UF:|Observações:/);
  assert.equal(cartWhatsAppUrl([]), '');
});
