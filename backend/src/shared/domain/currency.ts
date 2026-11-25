export const CURRENCY_CODES = ['PEN', 'USD', 'EUR', 'MXN'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const BASE_CURRENCY: CurrencyCode = 'PEN';
