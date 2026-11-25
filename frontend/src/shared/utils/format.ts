import type { CurrencyCode } from '@/types/finance';

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  PEN: 'es-PE',
  USD: 'en-US',
  EUR: 'es-ES',
  MXN: 'es-MX',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'PEN'): string {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function shortMoney(amount: number, currency: CurrencyCode = 'PEN'): string {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount || 0);
}

export function dateLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthStart(): string {
  return `${today().slice(0, 7)}-01`;
}

export function dateForInput(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? today() : d.toISOString().slice(0, 10);
}

export function dateToISO(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Ha ocurrido un error inesperado';
}
