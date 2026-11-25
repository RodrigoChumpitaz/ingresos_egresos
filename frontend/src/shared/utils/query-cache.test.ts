import { beforeEach, describe, expect, it } from 'vitest';
import { queryCache } from './query-cache';

describe('BoundedQueryCache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('stores and retrieves cached values and clears on demand', () => {
    queryCache.set('k1', { total: 100 });
    expect(queryCache.get<{ total: number }>('k1')).toEqual({ total: 100 });

    queryCache.clear();
    expect(queryCache.get('k1')).toBeNull();
  });

  it('evicts the least recently used entry when exceeding MAX_ENTRIES (24)', () => {
    for (let i = 1; i <= 24; i += 1) {
      queryCache.set(`key-${i}`, i);
    }
    // Acceder a key-1 para refrescar su posición LRU -> key-2 pasa a ser la más antigua
    expect(queryCache.get<number>('key-1')).toBe(1);

    queryCache.set('key-25', 25);

    expect(queryCache.get<number>('key-1')).toBe(1);
    expect(queryCache.get<number>('key-2')).toBeNull();
    expect(queryCache.get<number>('key-25')).toBe(25);
  });
});
