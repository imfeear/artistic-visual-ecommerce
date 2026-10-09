import { useId, useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { AVAILABILITIES, CATEGORIES, cleanMaterials, materialLabel } from '../lib/catalog';
import { money } from '../lib/format';
import { Button } from './ui';

function PriceFilter({ min, max, bounds, onApply }) {
  const [from, setFrom] = useState(min);
  const [to, setTo] = useState(max);
  const [error, setError] = useState('');
  const errorId = useId();
  return (
    <form
      className="price-filter"
      onSubmit={(event) => {
        event.preventDefault();
        if (from !== '' && to !== '' && Number(from) > Number(to)) {
          setError('O mínimo deve ser menor ou igual ao máximo.');
          return;
        }
        setError('');
        onApply({ min: from, max: to });
      }}
    >
      {bounds?.maxPrice != null && (
        <p>
          Na coleção: {money(bounds.minPrice)} a {money(bounds.maxPrice)}
        </p>
      )}
      <div className="price-filter-inputs">
        <label className="field">
          Mínimo (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
        <label className="field">
          Máximo (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Sem limite"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
      </div>
      {error && (
        <p className="price-filter-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary">
        Aplicar preço <FiArrowRight />
      </Button>
    </form>
  );
}
export default function CatalogFilters({
  params,
  update,
  toggle,
  metadata,
  loading,
  error,
  retry,
}) {
  const categories = params.getAll('categoria');
  const statuses = params.getAll('status');
  const materials = params.getAll('material');
  const materialOptions = cleanMaterials([
    ...(Array.isArray(metadata?.materials) ? metadata.materials : []),
    ...materials,
  ]);
  return (
    <div className="catalog-filter-fields">
      <fieldset>
        <legend>Categorias</legend>
        <button
          type="button"
          className={`all-categories ${!categories.length ? 'is-selected' : ''}`}
          aria-pressed={!categories.length}
          onClick={() => update({ categoria: '' })}
        >
          Todos os produtos
        </button>
        {CATEGORIES.map(([value, label]) => (
          <label className="catalog-check" key={value}>
            <input
              type="checkbox"
              checked={categories.includes(value)}
              onChange={() => toggle('categoria', value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Faixa de preço</legend>
        <PriceFilter
          key={`${params.get('min')}|${params.get('max')}`}
          min={params.get('min') || ''}
          max={params.get('max') || ''}
          bounds={metadata}
          onApply={update}
        />
      </fieldset>
      <fieldset>
        <legend>Disponibilidade</legend>
        {AVAILABILITIES.map(([value, label]) => (
          <label className="catalog-check" key={value}>
            <input
              type="checkbox"
              checked={statuses.includes(value)}
              onChange={() => toggle('status', value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Material & técnica</legend>
        {loading && <p className="filter-help">Carregando materiais…</p>}
        {error && (
          <div className="filter-help" role="alert">
            <p>Não foi possível carregar os materiais.</p>
            <button className="text-link" onClick={retry}>
              Recarregar materiais
            </button>
          </div>
        )}
        {materialOptions.map((value) => (
          <label className="catalog-check" key={value}>
            <input
              type="checkbox"
              checked={materials.includes(value)}
              onChange={() => toggle('material', value)}
            />
            <span>{materialLabel(value)}</span>
          </label>
        ))}
        {!loading && !error && !materialOptions.length && (
          <p className="filter-help">
            Os materiais aparecerão conforme as peças forem cadastradas.
          </p>
        )}
      </fieldset>
      <p className="filter-footnote">Feito à mão. Escolhido por você.</p>
    </div>
  );
}
