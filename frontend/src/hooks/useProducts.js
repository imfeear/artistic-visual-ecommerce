import { useEffect } from 'react';
import { listProducts } from '../lib/api';
import useResource from './useResource';

export default function useProducts() {
  const resource = useResource(listProducts, []);
  const { refresh } = resource;
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
  return { ...resource, products: Array.isArray(resource.data) ? resource.data : [] };
}
