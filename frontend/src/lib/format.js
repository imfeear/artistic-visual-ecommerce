import { API_BASE } from './api';
import { validPrice } from './catalog';
import { whatsappUrl } from '../config/store';

export const money = (value) =>
  validPrice(value)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    : 'Preço sob consulta';
export const imageUrl = (url) => {
  if (typeof url !== 'string' || !url.trim()) return '';
  const value = url.trim();
  if (!/^(https?:\/\/|\/(?!\/)|data:image\/)/i.test(value)) return '';
  return value.startsWith('/uploads/') ? `${API_BASE}${value}` : value;
};
export const searchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export function contactUrl(product) {
  return whatsappUrl(`Tenho interesse em: ${product.name}`);
}
export function announceProducts() {
  localStorage.setItem('products:refresh', String(Date.now()));
  window.dispatchEvent(new Event('products:refresh'));
}
