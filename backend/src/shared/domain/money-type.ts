export const MONEY_TYPES = ['INCOME', 'EXPENSE'] as const;
export type MoneyType = (typeof MONEY_TYPES)[number];
