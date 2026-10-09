import { storeConfig, whatsappUrl } from '../config/store.js';
import { categoryLabel } from './catalog.js';
import { cartTotals, formatCents, priceInCents, subtotalCents } from './cart.js';

const oneLine = (value, length) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, length) : '';
export function cartMessage(items, details = {}) {
  const totals = cartTotals(items);
  if (!items.length || totals.unavailable) return '';
  const lines = [
    `Olá! Gostaria de solicitar estas peças da ${storeConfig.name}:`,
    '',
    '*Itens do carrinho:*',
    '',
    ...items.flatMap((item, index) => [
      `${index + 1}. ${oneLine(item.name, 160)}`,
      `   Categoria: ${categoryLabel(item.category)}`,
      `   Quantidade: ${item.quantity}`,
      `   Valor unitário: ${formatCents(priceInCents(item.price))}`,
      `   Subtotal: ${formatCents(subtotalCents(item))}`,
      '',
    ]),
    `*Total estimado: ${formatCents(totals.cents)}*`,
    ...(totals.quotes ? ['Além dos valores das peças sob consulta.'] : []),
    '',
  ];
  const name = oneLine(details.name, 100);
  const city = oneLine(details.city, 100);
  const notes =
    typeof details.notes === 'string'
      ? details.notes
          // eslint-disable-next-line no-control-regex -- Remove non-printing controls, keeping line breaks.
          .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
          .trim()
          .slice(0, 1000)
      : '';
  if (name) lines.push(`Nome: ${name}`);
  if (city) lines.push(`Cidade/UF: ${city}`);
  if (notes) lines.push(`Observações: ${notes}`);
  if (name || city || notes) lines.push('');
  lines.push('Aguardo a confirmação de disponibilidade e prazo de produção. Obrigado(a)!');
  return lines.join('\n');
}
export const cartWhatsAppUrl = (items, details) => {
  const message = cartMessage(items, details);
  return message ? whatsappUrl(message) : '';
};
