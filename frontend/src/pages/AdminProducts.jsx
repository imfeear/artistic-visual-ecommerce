import { createElement, useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiArrowUpRight,
  FiBox,
  FiEye,
  FiMousePointer,
  FiUsers,
  FiCheck,
  FiImage,
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ProductEditor from '../components/ProductEditor';
import CarouselModal from '../components/CarouselModal';
import { Badge, Button, EmptyState, Modal, Notice, ProductImage } from '../components/ui';
import { useAuth } from '../auth/useAuth';
import useProducts from '../hooks/useProducts';
import useResource from '../hooks/useResource';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getTrackSummary,
  listCarouselAdmin,
} from '../lib/api';
import { money, searchText, announceProducts } from '../lib/format';
import { AVAILABILITIES, availabilityOf, availabilityLabel, categoryLabel } from '../lib/catalog';

function Metric({ label, value, description, icon: Icon, tone = '' }) {
  return (
    <div className={`metric ${tone}`}>
      <div>
        <span>{label}</span>
        <span className="metric-icon">{createElement(Icon)}</span>
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}
function ProductTable({ products, onEdit, onDelete, compact = false }) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      aria-label="Tabela de produtos, deslize horizontalmente em telas pequenas"
    >
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Peça</th>
            <th scope="col">Preço</th>
            <th scope="col">Disponibilidade</th>
            <th scope="col" className="table-actions-heading">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="table-product">
                  <ProductImage src={p.imageUrl} alt="" loading="lazy" />
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      #{String(p.id).padStart(3, '0')}
                      {` · ${categoryLabel(p.category)}`}
                      {!compact && p.description ? ` · ${p.description}` : ''}
                    </span>
                  </div>
                </div>
              </td>
              <td className="table-price">{money(p.price)}</td>
              <td>
                <Badge
                  tone={
                    availabilityOf(p) === 'available'
                      ? 'success'
                      : availabilityOf(p) === 'made-to-order'
                        ? 'purple'
                        : 'neutral'
                  }
                >
                  {availabilityLabel(p)}
                </Badge>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="icon-btn"
                    aria-label={`Editar ${p.name}`}
                    onClick={() => onEdit(p)}
                  >
                    <FiEdit2 />
                  </button>
                  <Link
                    className="icon-btn"
                    to={`/produto/${p.id}`}
                    target="_blank"
                    aria-label={`Ver ${p.name} na loja`}
                  >
                    <FiArrowUpRight />
                  </Link>
                  <button
                    className="icon-btn danger-icon"
                    aria-label={`Excluir ${p.name}`}
                    onClick={() => onDelete(p)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function MediaView({ onEdit, auth }) {
  const loader = useCallback(() => listCarouselAdmin(auth), [auth]);
  const { data, loading, error, refresh } = useResource(loader, []);
  // Remounting this view after save also reloads the public media list.
  const banners = Array.isArray(data) ? [...data].sort((a, b) => a.position - b.position) : [];
  return (
    <>
      <div className="media-feature">
        <div>
          <Badge tone="purple">CONTEÚDO DA VITRINE</Badge>
          <h2>
            Uma boa imagem
            <br />
            abre novas possibilidades.
          </h2>
          <p>Organize os banners, escolha a ordem e decida o que aparece na sua loja.</p>
          <Button onClick={onEdit}>
            <FiImage /> Editar carrossel
          </Button>
        </div>
        <div className="media-feature-image" aria-hidden="true" />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Seus banners</h2>
            <p>{banners.length} imagens cadastradas</p>
          </div>
          <Button variant="secondary" onClick={refresh} busy={loading}>
            <FiRefreshCw /> Recarregar
          </Button>
        </div>
        {loading ? (
          <div className="skeleton chart-skeleton" />
        ) : error ? (
          <EmptyState
            error
            title="Não foi possível carregar os banners"
            description={error}
            action={<Button onClick={refresh}>Tentar novamente</Button>}
          />
        ) : banners.length ? (
          <div className="media-grid">
            {banners.map((banner, i) => (
              <article className="media-card" key={banner.id || i}>
                <ProductImage src={banner.url} alt={`Banner ${i + 1}`} />
                <div>
                  <span>Banner {String(i + 1).padStart(2, '0')}</span>
                  <Badge tone={banner.active ? 'success' : 'neutral'}>
                    {banner.active ? 'Ativo' : 'Oculto'}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sua vitrine tem espaço para novas histórias"
            description="Adicione imagens para compor o carrossel da página inicial."
            action={<Button onClick={onEdit}>Adicionar imagens</Button>}
          />
        )}
      </section>
    </>
  );
}
export default function AdminProducts() {
  const { auth } = useAuth();
  const [params, setParams] = useSearchParams();
  const selectedView = params.get('view') || 'overview';
  const view = ['overview', 'products', 'analytics', 'media'].includes(selectedView)
    ? selectedView
    : 'overview';
  const { products, loading, error, refresh } = useProducts();
  const [days, setDays] = useState(7);
  const statsLoader = useCallback(() => getTrackSummary(days, auth), [days, auth]);
  const stats = useResource(statsLoader);
  const [editor, setEditor] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [notice, setNotice] = useState(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const query = params.get('busca') || '';
  const filter = params.get('status') || 'all';
  const sort = params.get('ordem') || 'recent';
  const update = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        value ? next.set(key, value) : next.delete(key);
        if (key !== 'pagina') next.delete('pagina');
        return next;
      },
      { replace: true },
    );
  const available = products.filter((p) => availabilityOf(p) === 'available').length;
  const counts = stats.data?.countsByType || {};
  const filtered = products
    .filter(
      (p) =>
        searchText(`${p.name} ${p.description} ${p.id}`).includes(searchText(query)) &&
        (filter === 'all' ||
          (filter === 'unavailable'
            ? availabilityOf(p) === 'sold-out'
            : availabilityOf(p) === filter)),
    )
    .sort((a, b) =>
      sort === 'price'
        ? Number(a.price) - Number(b.price)
        : sort === 'name'
          ? a.name.localeCompare(b.name, 'pt-BR')
          : Number(b.id) - Number(a.id),
    );
  const page = Math.max(
    1,
    Math.min(Number(params.get('pagina')) || 1, Math.ceil(filtered.length / 8) || 1),
  );
  const save = async (payload) => {
    if (editor.product) await updateProduct(editor.product.id, payload, auth);
    else await createProduct(payload, auth);
    setNotice({
      text: editor.product
        ? 'Peça atualizada. Sua coleção já está em dia.'
        : 'Nova peça adicionada à coleção.',
    });
    setEditor(null);
    announceProducts();
  };
  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteProduct(toDelete.id, auth);
      setNotice({ text: 'Peça excluída da coleção.' });
      setToDelete(null);
      announceProducts();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };
  const askRemove = (product) => {
    setToDelete(product);
    setDeleteError('');
  };
  const productState = loading ? (
    <div className="table-loading" aria-label="Carregando produtos" aria-busy="true">
      {[1, 2, 3, 4].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  ) : error ? (
    <EmptyState
      error
      title="Catálogo indisponível"
      description={error}
      action={<Button onClick={refresh}>Tentar novamente</Button>}
    />
  ) : products.length === 0 ? (
    <EmptyState
      title="Toda coleção começa com uma peça"
      description="Cadastre sua primeira peça e dê vida à sua loja."
      action={
        <Button onClick={() => setEditor({ product: null })}>
          <FiPlus /> Criar produto
        </Button>
      }
    />
  ) : null;
  const period = (
    <div className="period-controls">
      <label>
        <span className="sr-only">Período das estatísticas</span>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={1}>Último dia</option>
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </select>
      </label>
      <button
        className="icon-btn"
        aria-label="Atualizar estatísticas"
        onClick={stats.refresh}
        disabled={stats.loading}
      >
        <FiRefreshCw />
      </button>
    </div>
  );
  return (
    <AdminLayout
      view={view}
      count={products.length}
      action={
        view === 'products' || view === 'overview' ? (
          <Button onClick={() => setEditor({ product: null })}>
            <FiPlus /> Novo produto
          </Button>
        ) : view === 'analytics' ? (
          period
        ) : (
          <Button onClick={() => setCarouselOpen(true)}>
            <FiImage /> Editar carrossel
          </Button>
        )
      }
    >
      <Notice notice={notice} onClose={dismissNotice} />
      {view === 'overview' && (
        <>
          <div className="metrics-grid">
            <Metric
              label="Peças na coleção"
              value={loading ? '—' : products.length}
              description="Produtos cadastrados"
              icon={FiBox}
              tone="metric-featured"
            />
            <Metric
              label="Disponíveis"
              value={loading ? '—' : available}
              description="Prontas para novos encontros"
              icon={FiCheck}
            />
            <Metric
              label="Visitas à loja"
              value={stats.loading || stats.error ? '—' : counts.PAGEVIEW || 0}
              description={`Nos últimos ${days} ${days === 1 ? 'dia' : 'dias'}`}
              icon={FiEye}
            />
            <Metric
              label="Interações"
              value={stats.loading || stats.error ? '—' : counts.CLICK || 0}
              description="Cliques em menus e ações"
              icon={FiMousePointer}
            />
          </div>
          <div className="overview-callout">
            <div>
              <span className="eyebrow">SUA ARTE MERECE SER VISTA</span>
              <h2>
                Pequenos cuidados.
                <br />
                Grandes primeiras impressões.
              </h2>
              <p>Uma coleção bem apresentada aproxima a sua arte de novas pessoas.</p>
            </div>
            <Link to="/admin?view=media" className="callout-link">
              Cuidar da vitrine <FiArrowUpRight />
            </Link>
          </div>
          <div className="dashboard-section-heading">
            <h2>Um olhar sobre a audiência</h2>
            {period}
          </div>
          <AnalyticsPanel
            summary={stats.data}
            loading={stats.loading}
            error={stats.error}
            onRetry={stats.refresh}
            compact
          />
          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>Peças da coleção</h2>
                <p>As últimas peças cadastradas na sua loja</p>
              </div>
              <Link className="text-link" to="/admin?view=products">
                Gerenciar coleção <FiArrowUpRight />
              </Link>
            </div>
            {productState || (
              <ProductTable
                products={[...products].sort((a, b) => b.id - a.id).slice(0, 4)}
                onEdit={(p) => setEditor({ product: p })}
                onDelete={askRemove}
                compact
              />
            )}
          </section>
        </>
      )}
      {view === 'products' && (
        <>
          <div className="product-summary">
            <span>
              <strong>{products.length}</strong> peças na coleção
            </span>
            <span>
              <span className="status-dot" />
              <strong>{available}</strong> disponíveis
            </span>
            <span>
              <strong>{money(products.reduce((n, p) => n + (Number(p.price) || 0), 0))}</strong>{' '}
              valor do catálogo
            </span>
          </div>
          <section className="panel products-panel">
            <div className="admin-table-toolbar">
              <label className="search-field">
                <FiSearch />
                <span className="sr-only">Buscar produtos</span>
                <input
                  value={query}
                  onChange={(e) => update('busca', e.target.value)}
                  placeholder="Buscar por nome, descrição ou ID"
                  type="search"
                />
              </label>
              <label className="filter-field">
                <span className="sr-only">Filtrar disponibilidade</span>
                <select value={filter} onChange={(e) => update('status', e.target.value)}>
                  <option value="all">Todos os status</option>
                  {AVAILABILITIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-field">
                <span className="sr-only">Ordenar produtos</span>
                <select value={sort} onChange={(e) => update('ordem', e.target.value)}>
                  <option value="recent">Mais recentes</option>
                  <option value="name">Nome: A–Z</option>
                  <option value="price">Menor preço</option>
                </select>
              </label>
              <button
                className="icon-btn"
                aria-label="Recarregar produtos"
                onClick={refresh}
                disabled={loading}
              >
                <FiRefreshCw />
              </button>
            </div>
            {productState ||
              (filtered.length ? (
                <ProductTable
                  products={filtered.slice((page - 1) * 8, page * 8)}
                  onEdit={(p) => setEditor({ product: p })}
                  onDelete={askRemove}
                />
              ) : (
                <EmptyState
                  title="Nenhuma peça encontrada"
                  description="Tente outro termo ou remova os filtros."
                  action={
                    <Button variant="secondary" onClick={() => setParams({ view: 'products' })}>
                      Limpar filtros
                    </Button>
                  }
                />
              ))}
            <div className="table-footer">
              <span>
                {filtered.length} resultados{filtered.length > 0 && ` · página ${page}`}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => update('pagina', String(page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page * 8 >= filtered.length}
                  onClick={() => update('pagina', String(page + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
      {view === 'analytics' && (
        <>
          <div className="metrics-grid analytics-metrics">
            <Metric
              label="Visualizações"
              value={stats.loading || stats.error ? '—' : counts.PAGEVIEW || 0}
              description="Páginas visitadas no período"
              icon={FiEye}
              tone="metric-featured"
            />
            <Metric
              label="Interações"
              value={stats.loading || stats.error ? '—' : counts.CLICK || 0}
              description="Cliques registrados"
              icon={FiMousePointer}
            />
            <Metric
              label="Visitantes únicos"
              value={stats.loading || stats.error ? '—' : stats.data?.uniqueIps || 0}
              description="Estimativa por IP no período"
              icon={FiUsers}
            />
          </div>
          <AnalyticsPanel
            summary={stats.data}
            loading={stats.loading}
            error={stats.error}
            onRetry={stats.refresh}
          />
        </>
      )}
      {view === 'media' && (
        <MediaView key={mediaVersion} auth={auth} onEdit={() => setCarouselOpen(true)} />
      )}
      {editor && (
        <ProductEditor
          key={editor.product?.id || 'new'}
          product={editor.product}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      <Modal
        open={Boolean(toDelete)}
        onClose={() => {
          if (!deleting) setToDelete(null);
        }}
        busy={deleting}
        title="Excluir esta peça?"
        description="A peça será removida da coleção e da loja."
      >
        <div className="delete-preview">
          <ProductImage src={toDelete?.imageUrl} alt="" />
          <div>
            <strong>{toDelete?.name}</strong>
            <span>Esta ação não pode ser desfeita.</span>
          </div>
        </div>
        {deleteError && (
          <p className="form-error" role="alert">
            {deleteError}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" disabled={deleting} onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" busy={deleting} onClick={remove}>
            <FiTrash2 /> Excluir produto
          </Button>
        </div>
      </Modal>
      <CarouselModal
        open={carouselOpen}
        onClose={(saved) => {
          setCarouselOpen(false);
          if (saved) {
            setMediaVersion((v) => v + 1);
            setNotice({ text: 'Carrossel atualizado. Sua vitrine ganhou um novo olhar.' });
          }
        }}
      />
    </AdminLayout>
  );
}
