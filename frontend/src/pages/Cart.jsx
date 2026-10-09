import { useEffect, useLayoutEffect, useState } from 'react';
import { FiArrowLeft, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import StoreLayout from '../components/StoreLayout';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { Button, Modal } from '../components/ui';
import { useCart } from '../cart/useCart';
import useResource from '../hooks/useResource';
import { listProducts } from '../lib/api';

export default function Cart() {
  const { items, totals, clear, syncProducts } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const { data, loading, error, refresh } = useResource(listProducts);
  useLayoutEffect(() => {
    if (data) syncProducts(data);
  }, [data, syncProducts]);
  useEffect(() => {
    const reload = () => refresh();
    const storage = (event) => {
      if (event.key === 'products:refresh') refresh();
    };
    window.addEventListener('products:refresh', reload);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener('products:refresh', reload);
      window.removeEventListener('storage', storage);
    };
  }, [refresh]);
  return (
    <StoreLayout>
      <section className="container cart-page">
        <Button to="/catalogo" variant="ghost" className="cart-back">
          <FiArrowLeft /> Continuar explorando
        </Button>
        <div className="cart-heading">
          <div>
            <p className="eyebrow">ALDO SALES / SUAS ESCOLHAS</p>
            <h1>
              Arte que vai <em>com você.</em>
            </h1>
            <p>Seu próximo encontro com a arte começa aqui.</p>
          </div>
          {items.length > 0 && (
            <Button variant="secondary" onClick={() => setConfirmClear(true)}>
              <FiTrash2 /> Limpar carrinho
            </Button>
          )}
        </div>
        {items.length ? (
          <div className="cart-layout">
            <div className="cart-selection">
              <div className="cart-selection-heading">
                <h2>Seu carrinho</h2>
                <span>
                  {totals.quantity} {totals.quantity === 1 ? 'item escolhido' : 'itens escolhidos'}
                </span>
              </div>
              {loading && (
                <p className="cart-update-status" role="status">
                  <span className="spinner" /> Conferindo preços e disponibilidade…
                </p>
              )}
              {error && (
                <div className="cart-api-error" role="alert">
                  <p>
                    Seu carrinho foi mantido, mas não foi possível atualizar preços e
                    disponibilidade.
                  </p>
                  <Button variant="secondary" onClick={refresh}>
                    Tentar novamente
                  </Button>
                </div>
              )}
              <div className="cart-items">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
              <p className="cart-local-note">
                Suas escolhas ficam salvas neste navegador. O envio pelo WhatsApp mantém o carrinho
                para você consultar depois.
              </p>
            </div>
            <CartSummary loading={loading} error={error} />
          </div>
        ) : (
          <div className="cart-empty">
            <span className="cart-empty-art" aria-hidden="true">
              <FiShoppingBag />
            </span>
            <p className="eyebrow">HÁ ARTE ESPERANDO POR VOCÊ</p>
            <h2>
              Seu carrinho está esperando
              <br />
              <em>um encontro especial.</em>
            </h2>
            <p>Explore peças autorais, descubra os detalhes e traga suas favoritas para cá.</p>
            <Button to="/catalogo">
              Explorar o catálogo <FiArrowRight />
            </Button>
            <span>Peças feitas à mão. Histórias feitas para ficar.</span>
          </div>
        )}
      </section>
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Limpar seu carrinho?"
        description="Todas as peças serão removidas. Você pode voltar ao catálogo e escolher novamente."
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setConfirmClear(false)}>
            Manter minhas peças
          </Button>
          <Button
            onClick={() => {
              clear();
              setConfirmClear(false);
            }}
          >
            Confirmar limpeza
          </Button>
        </div>
      </Modal>
    </StoreLayout>
  );
}
