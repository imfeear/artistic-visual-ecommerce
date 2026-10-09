import { useCallback, useEffect, useRef, useState } from 'react';

// Every request has an identity; late responses cannot replace fresher data.
export default function useResource(loader, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      if (id === request.current) setData(result);
      return result;
    } catch (err) {
      if (id === request.current) setError(err.message || 'Não foi possível carregar os dados.');
      return null;
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    refresh();
    return () => {
      request.current += 1;
    };
  }, [refresh]);
  return { data, loading, error, refresh };
}
