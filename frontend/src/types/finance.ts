export type MoneyType = 'INCOME' | 'EXPENSE';
export type CurrencyCode = 'PEN' | 'USD' | 'EUR' | 'MXN';
export type TrendGranularity = 'auto' | 'day' | 'week' | 'month';

export interface Category {
  id: string;
  name: string;
  type: MoneyType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: MoneyType;
  amount: number;
  currency?: CurrencyCode;
  originalAmount?: number;
  exchangeRate?: number;
  description?: string;
  categoryId: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  type: MoneyType;
  total: number;
  count: number;
}

export interface SummaryComparison {
  previousFrom: string;
  previousTo: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  incomeDeltaPct: number | null;
  expenseDeltaPct: number | null;
  savingsDeltaPct: number | null;
}

export interface Summary {
  from: string | null;
  to: string | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  netSavings: number;
  savingsRate: number;
  allocatedSavings?: number;
  totalSavingsBalance?: number;
  realAvailable?: number;
  byCategory: CategorySummary[];
  comparison?: SummaryComparison;
}

export type SavingsMovementType = 'CONTRIBUTION' | 'WITHDRAWAL';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsEntry {
  id: string;
  goalId: string;
  type: SavingsMovementType;
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

export interface TrendPoint {
  key: string;
  label: string;
  start: string;
  end: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}

export interface TrendResponse {
  from: string;
  to: string;
  granularity: 'day' | 'week' | 'month';
  points: TrendPoint[];
}

export interface ExchangeRatesResponse {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: 'frankfurter' | 'open-er-api' | 'fallback';
  stale: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Filters {
  type?: MoneyType;
  categoryId?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface TransactionInput {
  amount: number;
  currency?: CurrencyCode;
  exchangeRate?: number;
  categoryId: string;
  description?: string;
  date?: string;
}
