import { z } from 'zod';
import { CURRENCY_CODES, type CurrencyCode } from '../../../shared/domain/currency';

export interface ExchangeRatesResult {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: 'frankfurter' | 'open-er-api' | 'fallback';
  stale: boolean;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const FALLBACK_PEN_BASE: Record<CurrencyCode, number> = {
  PEN: 1,
  USD: 0.2933,
  EUR: 0.27,
  MXN: 5.85,
};

const positiveRatesSchema = z.record(z.string(), z.number().finite().positive());
const frankfurterSchema = z.object({ rates: positiveRatesSchema, date: z.string().optional() });
const openErSchema = z.object({ result: z.string().optional(), rates: positiveRatesSchema });

function normalizeRates(base: CurrencyCode, raw: Record<string, number>): Record<CurrencyCode, number> {
  const result = {} as Record<CurrencyCode, number>;
  for (const code of CURRENCY_CODES) {
    if (code === base) {
      result[code] = 1;
    } else {
      const value = raw[code];
      result[code] = value && value > 0 ? Math.round(value * 1000000) / 1000000 : computeFallbackRate(base, code);
    }
  }
  return result;
}

function computeFallbackRate(from: CurrencyCode, to: CurrencyCode): number {
  const fromInPen = 1 / FALLBACK_PEN_BASE[from];
  return Math.round(fromInPen * FALLBACK_PEN_BASE[to] * 1000000) / 1000000;
}

function buildFallback(base: CurrencyCode): ExchangeRatesResult {
  const rates = {} as Record<CurrencyCode, number>;
  for (const code of CURRENCY_CODES) {
    rates[code] = code === base ? 1 : computeFallbackRate(base, code);
  }
  return {
    base,
    rates,
    updatedAt: new Date().toISOString(),
    source: 'fallback',
    stale: true,
  };
}

export class GetExchangeRatesUseCase {
  private readonly cache = new Map<CurrencyCode, { data: ExchangeRatesResult; expiresAt: number }>();

  async execute(base: CurrencyCode = 'PEN'): Promise<ExchangeRatesResult> {
    const cached = this.cache.get(base);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const targets = CURRENCY_CODES.filter((c) => c !== base).join(',');

    try {
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${base}&to=${targets}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const parsed = frankfurterSchema.safeParse(await res.json());
        if (parsed.success) {
          const data: ExchangeRatesResult = {
            base,
            rates: normalizeRates(base, parsed.data.rates),
            updatedAt: new Date().toISOString(),
            source: 'frankfurter',
            stale: false,
          };
          this.cache.set(base, { data, expiresAt: Date.now() + CACHE_TTL_MS });
          return data;
        }
      }
    } catch {
      // Fallback al segundo proveedor gratuito
    }

    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const parsed = openErSchema.safeParse(await res.json());
        if (parsed.success) {
          const data: ExchangeRatesResult = {
            base,
            rates: normalizeRates(base, parsed.data.rates),
            updatedAt: new Date().toISOString(),
            source: 'open-er-api',
            stale: false,
          };
          this.cache.set(base, { data, expiresAt: Date.now() + CACHE_TTL_MS });
          return data;
        }
      }
    } catch {
      // Sin red: usar último caché o fallback de referencia
    }

    if (cached) {
      return { ...cached.data, stale: true };
    }
    return buildFallback(base);
  }
}
