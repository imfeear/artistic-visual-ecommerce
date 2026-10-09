// Número público do artesão: país + DDD + número, somente dígitos.
// VITE_WHATSAPP_NUMBER permite configurar outro número por ambiente.
export const storeConfig = {
  name: 'Aldo Sales',
  whatsappNumber: String(import.meta.env?.VITE_WHATSAPP_NUMBER ?? '5581987063327').replace(
    /\D/g,
    '',
  ),
};
export const whatsappConfigured = /^[1-9]\d{9,14}$/.test(storeConfig.whatsappNumber);
export const whatsappUrl = (message) =>
  whatsappConfigured
    ? `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`
    : '';
