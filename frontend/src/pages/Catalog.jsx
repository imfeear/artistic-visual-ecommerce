import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiSliders, FiArrowRight } from 'react-icons/fi';
import StoreLayout from '../components/StoreLayout';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';
import { Button, EmptyState, Modal, ProductSkeletons } from '../components/ui';
import useCatalog from '../hooks/useCatalog';
import useResource from '../hooks/useResource';
import { getCatalogFilters, invalidateCatalog } from '../lib/api';
import {
  AVAILABILITIES,
  catalogParams,
  categoryLabel,
  materialLabel,
  sanitizeCatalogParams,
} from '../lib/catalog';
import { money } from '../lib/format';

export default function Catalog() {
  const [urlParams, setParams] = useSearchParams();
  const rawQuery = urlParams.toString();
  const safeQuery = catalogParams(rawQuery);
  const params = sanitizeCatalogParams(safeQuery);
  useEffect(() => {
    if (rawQuery !== safeQuery) setParams(new URLSearchParams(safeQuery), { replace: true });
  }, [rawQuery, safeQuery, setParams]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterReset, setFilterReset] = useState(0);
  const { data, loading, error, refresh } = useCatalog(catalogParams(params));
  const facets = useResource(getCatalogFilters);
  const { refresh: refreshFacets } = facets;
  useEffect(() => {
    const reload = () => {
      invalidateCatalog();
      refreshFacets();
    };
    const storage = (event) => {
      if (event.key === 'products:refresh') reload();
    };
    window.addEventListener('products:refresh', reload);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener('products:refresh', reload);
      window.removeEventListener('storage', storage);
    };
  }, [refreshFacets]);
  const query = params.get('busca') || '';
  const sort = params.get('ordem') || 'recent';
  const update = (changes) =>
    setParams(
      (previous) => {
        const next = sanitizeCatalogParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key);
          for (const item of Array.isArray(value) ? value : [value])
            if (item) next.append(key, item);
        }
        if (!('pagina' in changes)) next.delete('pagina');
        return sanitizeCatalogParams(next);
      },
      { replace: Object.hasOwn(changes, 'busca'), flushSync: true },
    );
  const toggle = (key, value) =>
    update({
      [key]: params.getAll(key).includes(value)
        ? params.getAll(key).filter((item) => item !== value)
        : [...params.getAll(key), value],
    });
  const clear = () => {
    setParams({});
    setFilterReset((value) => value + 1);
  };
  const active = [
    ...(query ? [{ key: 'busca', value: query, label: `Busca: ${query}` }] : []),
    ...params
      .getAll('categoria')
      .map((value) => ({ key: 'categoria', value, label: categoryLabel(value) })),
    ...params
      .getAll('status')
      .filter((value) => value !== 'all')
      .map((value) => ({
        key: 'status',
        value,
        label: AVAILABILITIES.find(([key]) => key === value)?.[1] || value,
      })),
    ...params
      .getAll('material')
      .map((value) => ({ key: 'material', value, label: materialLabel(value) })),
    ...(params.has('min')
      ? [{ key: 'min', value: params.get('min'), label: `A partir de ${money(params.get('min'))}` }]
      : []),
    ...(params.has('max')
      ? [{ key: 'max', value: params.get('max'), label: `Até ${money(params.get('max'))}` }]
      : []),
  ];
  const filterFields = (
    <CatalogFilters
      key={filterReset}
      params={params}
      update={update}
      toggle={toggle}
      metadata={facets.data}
      loading={facets.loading}
      error={facets.error}
      retry={facets.refresh}
    />
  );
  const total = data?.totalElements || 0;
  const page = data?.page || 1;
  const pages = data?.totalPages || 0;
  return (
    <StoreLayout>
      <section className="catalog-intro">
        <div className="container">
          <p className="eyebrow">Aldo Sales/ A LOJA</p>
          <div>
            <h1>
              O seu próximo
              <br />
              <em>encontro com a arte.</em>
            </h1>
            <p>
              Arte autoral, peças únicas e edição limitada.
              <br />
              Explore no seu ritmo. Escolha com intenção.
            </p>
          </div>
        </div>
      </section>
      <section className="container catalog-section">
        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Filtros de produtos">
            <div className="filter-heading">
              <FiSliders />
              <h2>Encontre sua peça</h2>
            </div>
            {filterFields}
          </aside>
          <div className="catalog-listing">
            <div className="catalog-toolbar">
              <label className="search-field">
                <FiSearch />
                <span className="sr-only">Buscar no catálogo</span>
                <input
                  type="search"
                  maxLength={160}
                  placeholder="Buscar peças"
                  aria-describedby="catalog-search-help"
                  value={query}
                  onChange={(e) => update({ busca: e.target.value })}
                />
                {query && (
                  <button
                    className="icon-btn"
                    onClick={() => update({ busca: '' })}
                    aria-label="Limpar busca"
                  >
                    <FiX />
                  </button>
                )}
              </label>
              <Button
                variant="secondary"
                className="catalog-filter-trigger"
                onClick={() => setFiltersOpen(true)}
              >
                <FiSliders /> Filtrar{' '}
                {active.length > 0 && <span className="filter-count">{active.length}</span>}
              </Button>
              <label className="filter-field catalog-sort">
                <span className="sr-only">Ordenar por</span>
                <select value={sort} onChange={(e) => update({ ordem: e.target.value })}>
                  <option value="recent">Mais recentes</option>
                  <option value="price-up">Menor preço</option>
                  <option value="price-down">Maior preço</option>
                  <option value="featured">Destaque</option>
                  <option value="name">Nome: A–Z</option>
                </select>
              </label>
            </div>
            <p className="catalog-search-help" id="catalog-search-help">
              Busque por nome ou descrição.
            </p>
            <div className="results-label" role="status" aria-live="polite" aria-atomic="true">
              <span>
                {loading
                  ? 'Buscando sua próxima peça…'
                  : error
                    ? 'Busca indisponível'
                    : `${total} ${total === 1 ? 'peça encontrada' : 'peças encontradas'}`}
              </span>
              {(active.length > 0 || sort !== 'recent') && (
                <button className="text-link" onClick={clear}>
                  Limpar todos os filtros <FiX />
                </button>
              )}
            </div>
            {active.length > 0 && (
              <div className="active-filters" aria-label="Filtros ativos">
                {active.map(({ key, value, label }) => (
                  <button
                    key={`${key}:${value}`}
                    className="filter-chip"
                    aria-label={`Remover filtro: ${label}`}
                    onClick={() =>
                      ['categoria', 'status', 'material'].includes(key)
                        ? toggle(key, value)
                        : update({ [key]: '' })
                    }
                  >
                    <span>{label}</span>
                    <FiX aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
            {loading ? (
              <ProductSkeletons count={6} />
            ) : error ? (
              <EmptyState
                error
                title="Não foi possível carregar a coleção"
                description={error}
                action={
                  <>
                    <Button onClick={refresh}>Tentar novamente</Button>
                    {active.length > 0 && (
                      <Button variant="secondary" onClick={clear}>
                        Limpar filtros
                      </Button>
                    )}
                  </>
                }
              />
            ) : total ? (
              <div className="product-grid">
                {data.content.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={(page - 1) * 12 + index} />
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <span className="eyebrow">CADA PEÇA TEM SEU ENCONTRO</span>
                <EmptyState
                  title={
                    active.length
                      ? 'Nenhuma peça com esses filtros'
                      : 'A coleção está sendo preparada'
                  }
                  description={
                    active.length
                      ? 'Experimente ampliar a faixa de preço, trocar a categoria ou remover um filtro. Há outras formas de encontrar a sua arte.'
                      : 'Volte em breve para descobrir novas peças feitas à mão.'
                  }
                  action={
                    active.length > 0 && (
                      <Button variant="secondary" onClick={clear}>
                        Ver todas as peças <FiArrowRight />
                      </Button>
                    )
                  }
                />
              </div>
            )}
            {!loading && !error && pages > 1 && (
              <nav className="pagination" aria-label="Paginação do catálogo">
                <Button
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => update({ pagina: String(page - 1) })}
                >
                  Anterior
                </Button>
                <span>
                  {page} de {pages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= pages}
                  onClick={() => update({ pagina: String(page + 1) })}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </div>
        </div>
      </section>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Encontre sua peça"
        description="Explore por categoria, preço e os detalhes que fazem a diferença."
        className="catalog-filter-dialog"
      >
        {filterFields}
        <div className="catalog-filter-actions">
          <Button variant="secondary" onClick={clear}>
            Limpar filtros
          </Button>
          <Button onClick={() => setFiltersOpen(false)}>
            Ver resultados <FiArrowRight />
          </Button>
        </div>
      </Modal>
    </StoreLayout>
  );
}
