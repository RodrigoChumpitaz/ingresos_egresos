import { useEffect, useRef, useState } from 'react';
import { errorText } from './format';
import { queryCache } from './query-cache';

export function useCachedQuery<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  revision: number,
) {
  const initialCached = queryCache.get<T>(cacheKey);
  const [data, setData] = useState<T | null>(initialCached);
  const [isInitialLoading, setIsInitialLoading] = useState(!initialCached);
  const [isFetching, setIsFetching] = useState(!initialCached);
  const [error, setError] = useState('');
  const [localRetry, setLocalRetry] = useState(0);
  const dataRef = useRef<T | null>(initialCached);

  useEffect(() => {
    let active = true;
    const cached = queryCache.get<T>(cacheKey);
    if (cached !== null) {
      dataRef.current = cached;
      setData(cached);
      setIsInitialLoading(false);
      setIsFetching(false);
      setError('');
      return () => {
        active = false;
      };
    }

    // Mantener data previa visible durante la transición para evitar pantalla en blanco
    setIsInitialLoading(dataRef.current === null);
    setIsFetching(true);
    setError('');

    fetcher()
      .then((result) => {
        if (!active) return;
        queryCache.set(cacheKey, result);
        dataRef.current = result;
        setData(result);
        setError('');
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      })
      .finally(() => {
        if (active) {
          setIsInitialLoading(false);
          setIsFetching(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, revision, localRetry]);

  return {
    data,
    isInitialLoading,
    isFetching,
    error,
    retry: () => setLocalRetry((n) => n + 1),
  };
}
