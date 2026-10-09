import { useCallback, useEffect, useState } from 'react';
import { invalidateCatalog, searchProducts } from '../lib/api';
import { catalogParams } from '../lib/catalog';
import useResource from './useResource';

export default function useCatalog(query) {
  const search = new URLSearchParams(query).get('busca') || '';
  const [settledSearch, setSettledSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setSettledSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const settledParams = new URLSearchParams(query);
  if (settledSearch) settledParams.set('busca', settledSearch);
  else settledParams.delete('busca');
  const settledQuery = catalogParams(settledParams);
  const loader = useCallback(
    async () => ({ ...(await searchProducts(settledQuery)), query: settledQuery }),
    [settledQuery],
  );
  const resource = useResource(loader);
  const { refresh: reload } = resource;
  const refresh = useCallback(() => {
    invalidateCatalog();
    return reload();
  }, [reload]);
  useEffect(() => {
    const storage = (event) => {
      if (event.key === 'products:refresh') refresh();
    };
    window.addEventListener('storage', storage);
    window.addEventListener('products:refresh', refresh);
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener('products:refresh', refresh);
    };
  }, [refresh]);
  return {
    ...resource,
    refresh,
    loading:
      resource.loading ||
      query !== settledQuery ||
      (!resource.error && resource.data?.query !== query),
  };
}
