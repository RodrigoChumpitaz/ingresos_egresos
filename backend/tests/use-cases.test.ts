import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateCategoryUseCase } from '../src/modules/categories/application/create-category.use-case';
import { DeleteCategoryUseCase } from '../src/modules/categories/application/delete-category.use-case';
import { InMemoryCategoryRepository } from '../src/modules/categories/infrastructure/persistence/in-memory-category.repository';
import { GetExchangeRatesUseCase } from '../src/modules/exchange-rates/application/get-exchange-rates.use-case';
import { CreateTransactionUseCase } from '../src/modules/transactions/application/create-transaction.use-case';
import { GetSummaryUseCase } from '../src/modules/transactions/application/get-summary.use-case';
import { GetTrendUseCase } from '../src/modules/transactions/application/get-trend.use-case';
import { ListTransactionsUseCase } from '../src/modules/transactions/application/list-transactions.use-case';
import { InMemoryTransactionRepository } from '../src/modules/transactions/infrastructure/persistence/in-memory-transaction.repository';
import { BusinessRuleError, ConflictError } from '../src/shared/domain/errors';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Categories use cases', () => {
  it('enforces case-insensitive uniqueness per type and allows same name on different types', async () => {
    const categories = new InMemoryCategoryRepository();
    const create = new CreateCategoryUseCase(categories);

    await create.execute({ name: 'Otros', type: 'INCOME' });
    await expect(create.execute({ name: 'otros', type: 'INCOME' })).rejects.toThrow(ConflictError);
    await expect(create.execute({ name: 'Otros', type: 'EXPENSE' })).resolves.toMatchObject({
      name: 'Otros',
      type: 'EXPENSE',
    });
  });

  it('blocks deleting a category that has transactions with BusinessRuleError', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const deleteCat = new DeleteCategoryUseCase(categories, transactions);

    const cat = await createCat.execute({ name: 'Comida', type: 'EXPENSE' });
    await createTx.execute({ amount: 45, categoryId: cat.id, description: 'Almuerzo' });

    await expect(deleteCat.execute(cat.id)).rejects.toThrow(BusinessRuleError);
  });
});

describe('Summary & Trend use cases', () => {
  it('computes netSavings, savingsRate, and previous-period comparison', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const getSummary = new GetSummaryUseCase(transactions, categories);

    const sueldo = await createCat.execute({ name: 'Sueldo', type: 'INCOME' });
    const comida = await createCat.execute({ name: 'Comida', type: 'EXPENSE' });

    // Período anterior: 2026-10-01..2026-10-10
    await createTx.execute({
      amount: 1000,
      categoryId: sueldo.id,
      date: new Date('2026-10-05T12:00:00Z'),
    });
    await createTx.execute({
      amount: 500,
      categoryId: comida.id,
      date: new Date('2026-10-06T12:00:00Z'),
    });

    // Período actual: 2026-10-11..2026-10-20
    await createTx.execute({
      amount: 2000,
      categoryId: sueldo.id,
      date: new Date('2026-10-15T12:00:00Z'),
    });
    await createTx.execute({
      amount: 500,
      categoryId: comida.id,
      date: new Date('2026-10-16T12:00:00Z'),
    });

    const summary = await getSummary.execute({
      from: new Date('2026-10-11T00:00:00.000Z'),
      to: new Date('2026-10-20T23:59:59.999Z'),
      compare: 'prev',
    });

    expect(summary.totalIncome).toBe(2000);
    expect(summary.totalExpense).toBe(500);
    expect(summary.netSavings).toBe(1500);
    expect(summary.savingsRate).toBe(75);
    expect(summary.comparison).toMatchObject({
      totalIncome: 1000,
      totalExpense: 500,
      netSavings: 500,
      savingsRate: 50,
      incomeDeltaPct: 100,
      expenseDeltaPct: 0,
      savingsDeltaPct: 200,
    });
  });

  it('returns savingsRate = 0 when totalIncome is 0 without dividing by zero', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const getSummary = new GetSummaryUseCase(transactions, categories);

    const comida = await createCat.execute({ name: 'Comida', type: 'EXPENSE' });
    await createTx.execute({ amount: 80, categoryId: comida.id, date: new Date('2026-11-05T12:00:00Z') });

    const summary = await getSummary.execute({
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-10T23:59:59.999Z'),
    });

    expect(summary.netSavings).toBe(-80);
    expect(summary.savingsRate).toBe(0);
  });

  it('auto-selects day/week/month granularity and fills continuous buckets', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const getTrend = new GetTrendUseCase(transactions);

    const sueldo = await createCat.execute({ name: 'Sueldo', type: 'INCOME' });
    await createTx.execute({ amount: 1000, categoryId: sueldo.id, date: new Date('2026-11-02T12:00:00Z') });

    const daily = await getTrend.execute({
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-05T23:59:59.999Z'),
      granularity: 'auto',
    });
    expect(daily.granularity).toBe('day');
    expect(daily.points).toHaveLength(5);
    expect(daily.points[1]).toMatchObject({ key: '2026-11-02', totalIncome: 1000, savingsRate: 100 });
    expect(daily.points[2]).toMatchObject({ key: '2026-11-03', totalIncome: 0, totalExpense: 0 });

    const weekly = await getTrend.execute({
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-11-01T23:59:59.999Z'),
    });
    expect(weekly.granularity).toBe('week');

    const monthly = await getTrend.execute({
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-11-01T23:59:59.999Z'),
    });
    expect(monthly.granularity).toBe('month');
  });

  it('filters transactions by text query q and returns all items when all=true', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const listTx = new ListTransactionsUseCase(transactions);

    const comida = await createCat.execute({ name: 'Comida', type: 'EXPENSE' });
    await createTx.execute({ amount: 25, categoryId: comida.id, description: 'Café de mañana' });
    await createTx.execute({ amount: 50, categoryId: comida.id, description: 'Almuerzo ejecutivo' });
    await createTx.execute({ amount: 30, categoryId: comida.id, description: 'Café de tarde' });

    const filtered = await listTx.execute({ q: 'café' }, { page: 1, limit: 1 });
    expect(filtered.total).toBe(2);
    expect(filtered.items).toHaveLength(1);

    const allFiltered = await listTx.execute({ q: 'café' }, { page: 1, limit: 1, all: true });
    expect(allFiltered.total).toBe(2);
    expect(allFiltered.items).toHaveLength(2);
  });
});

describe('GetExchangeRatesUseCase', () => {
  it('caches valid provider response and falls back safely when network fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates: { USD: 0.293, EUR: 0.27, MXN: 5.4 } }),
      })
      .mockRejectedValue(new Error('offline'));

    vi.stubGlobal('fetch', fetchMock);

    const useCase = new GetExchangeRatesUseCase();
    const live = await useCase.execute('PEN');
    expect(live.source).toBe('frankfurter');
    expect(live.stale).toBe(false);
    expect(live.rates.USD).toBe(0.293);

    // Segunda llamada para PEN viene de caché sin llamar fetch
    const cached = await useCase.execute('PEN');
    expect(cached.rates.USD).toBe(0.293);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Nueva base sin red usa fallback marcado stale: true
    const offline = await useCase.execute('USD');
    expect(offline.source).toBe('fallback');
    expect(offline.stale).toBe(true);
    expect(offline.rates.USD).toBe(1);
    expect(offline.rates.PEN).toBeGreaterThan(1);
  });
});
