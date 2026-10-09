import { useState } from 'react';
import { FiArrowUpRight, FiMessageCircle, FiCheck } from 'react-icons/fi';
import { useCart } from '../../cart/useCart';
import { formatCents } from '../../lib/cart';
import { cartWhatsAppUrl } from '../../lib/whatsapp';
import { whatsappConfigured } from '../../config/store';
import { trackClick } from '../../lib/analytics';
import { Button } from '../ui';

export default function CartSummary({ loading, error }) {
  const { items, totals } = useCart();
  const [details, setDetails] = useState({ name: '', city: '', notes: '' });
  const [prepared, setPrepared] = useState('');
  const blocked =
    loading || !!error || totals.unavailable > 0 || !items.length || !whatsappConfigured;
  const currentUrl = cartWhatsAppUrl(items, details);
  const change = (event) =>
    setDetails((current) => ({ ...current, [event.target.name]: event.target.value }));
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title">
      <span className="eyebrow">ESCOLHAS COM SIGNIFICADO</span>
      <h2 id="cart-summary-title">Resumo da sua seleção</h2>
      <div className="cart-summary-count">
        <span>
          {totals.quantity} {totals.quantity === 1 ? 'item' : 'itens'}
        </span>
        <span>
          {items.length} {items.length === 1 ? 'peça diferente' : 'peças diferentes'}
        </span>
      </div>
      <div className="cart-total">
        <span>Total estimado</span>
        <strong>{formatCents(totals.cents)}</strong>
      </div>
      {totals.quotes > 0 && (
        <p className="cart-summary-note">
          Além dos valores das peças sob consulta, que serão informados pelo artesão.
        </p>
      )}
      <p className="cart-summary-note">
        Disponibilidade, frete e prazo de produção serão confirmados pelo artesão no WhatsApp.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (blocked) return;
          const url = cartWhatsAppUrl(items, details);
          if (!url) return;
          window.open(url, '_blank', 'noopener,noreferrer');
          setPrepared(url);
          trackClick('whatsapp_button');
        }}
      >
        <fieldset className="cart-contact-fields">
          <legend>Deixe a conversa mais fácil</legend>
          <p>Preenchimento opcional. Estas informações vão apenas na mensagem.</p>
          <label className="field">
            Nome (opcional)
            <input
              name="name"
              autoComplete="name"
              maxLength={100}
              value={details.name}
              onChange={change}
            />
          </label>
          <label className="field">
            Cidade/UF (opcional)
            <input
              name="city"
              autoComplete="address-level2"
              maxLength={100}
              placeholder="Recife/PE"
              value={details.city}
              onChange={change}
            />
          </label>
          <label className="field">
            Observações (opcional)
            <textarea
              name="notes"
              rows={3}
              maxLength={1000}
              placeholder="Cores, personalização ou dúvidas sobre as peças…"
              value={details.notes}
              onChange={change}
            />
          </label>
        </fieldset>
        {!whatsappConfigured && (
          <p className="form-error" role="alert">
            O WhatsApp da loja ainda não está disponível. Tente novamente mais tarde.
          </p>
        )}
        {totals.unavailable > 0 && (
          <p className="form-error" role="alert">
            Remova as peças indisponíveis para continuar.
          </p>
        )}
        <Button type="submit" className="cart-whatsapp" disabled={blocked}>
          <FiMessageCircle />{' '}
          {loading ? 'Atualizando sua seleção…' : 'Finalizar pedido pelo WhatsApp'}{' '}
          <FiArrowUpRight />
        </Button>
      </form>
      {prepared && prepared === currentUrl && !blocked && (
        <div className="cart-prepared" role="status">
          <FiCheck />
          <p>
            Resumo preparado. Envie a mensagem no WhatsApp para solicitar suas peças.{' '}
            <a href={prepared} target="_blank" rel="noreferrer">
              Abrir conversa novamente
            </a>
          </p>
        </div>
      )}
      <span className="cart-summary-footnote">Feito à mão. Combinado de perto.</span>
    </aside>
  );
}
