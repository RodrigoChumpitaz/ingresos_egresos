import type {
  AuthUser,
  Category,
  CurrencyCode,
  ExchangeRatesResponse,
  Filters,
  MoneyType,
  SavingsEntry,
  SavingsGoal,
  SavingsMovementType,
  Summary,
  Transaction,
  TransactionInput,
  TransactionPage,
  TrendGranularity,
  TrendResponse,
} from '../types/finance';

export const API_BASE = (
  import.meta.env.VITE_API_URL || 'https://ingreso-egresos-backend.vercel.app/api/v1'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(
      0,
      'No se pudo conectar con la API. Verifica que el backend esté activo o revisa VITE_API_URL.',
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, data?.message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      search.set(k, String(v));
    }
  });
  return search.toString() ? `?${search}` : '';
}

export const api = {
  categories: (type?: MoneyType) => request<Category[]>(`/categories${query({ type })}`),
  createCategory: (data: { name: string; type: MoneyType }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, name: string) =>
    request<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  transactions: (filters: Filters = {}) =>
    request<TransactionPage>(`/transactions${query({ ...filters })}`),
  createTransaction: (data: TransactionInput) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<TransactionInput>) =>
    request<Transaction>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string) =>
    request<void>(`/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  summary: (from?: string, to?: string, compare?: 'prev') =>
    request<Summary>(`/summary${query({ from, to, compare })}`),
  trend: (from?: string, to?: string, granularity: TrendGranularity = 'auto') =>
    request<TrendResponse>(`/summary/trend${query({ from, to, granularity })}`),

  savingsGoals: () => request<SavingsGoal[]>('/savings-goals'),
  createSavingsGoal: (data: {
    name: string;
    targetAmount: number;
    deadline?: string | null;
    color?: string;
  }) => request<SavingsGoal>('/savings-goals', { method: 'POST', body: JSON.stringify(data) }),
  updateSavingsGoal: (
    id: string,
    data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string },
  ) =>
    request<SavingsGoal>(`/savings-goals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSavingsGoal: (id: string) =>
    request<void>(`/savings-goals/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  savingsEntries: (goalId: string) =>
    request<SavingsEntry[]>(`/savings-goals/${encodeURIComponent(goalId)}/entries`),
  recordSavingsMovement: (
    goalId: string,
    data: { type: SavingsMovementType; amount: number; note?: string; date?: string },
  ) =>
    request<{ goal: SavingsGoal; entry: SavingsEntry }>(
      `/savings-goals/${encodeURIComponent(goalId)}/movements`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  exchangeRates: (base: CurrencyCode = 'PEN') =>
    request<ExchangeRatesResponse>(`/exchange-rates${query({ base })}`),
  health: () => request<{ status: string; storageMode?: string; timestamp: string }>('/health'),

  me: () => request<AuthUser>('/auth/me'),
  login: (data: { email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};
