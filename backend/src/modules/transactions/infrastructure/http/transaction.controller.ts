import { Router } from 'express';
import { z } from 'zod';
import { CURRENCY_CODES } from '../../../../shared/domain/currency';
import { MONEY_TYPES } from '../../../../shared/domain/money-type';
import { validate } from '../../../../shared/infrastructure/http/validate';
import type { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import type { DeleteTransactionUseCase } from '../../application/delete-transaction.use-case';
import type { GetSummaryUseCase } from '../../application/get-summary.use-case';
import type { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import type { GetTrendUseCase } from '../../application/get-trend.use-case';
import type { ListTransactionsUseCase } from '../../application/list-transactions.use-case';
import type { UpdateTransactionUseCase } from '../../application/update-transaction.use-case';

const createSchema = z.object({
  amount: z.number(),
  currency: z.enum(CURRENCY_CODES).optional(),
  exchangeRate: z.number().optional(),
  categoryId: z.uuid(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
});
const updateSchema = createSchema.partial();

const endOfDay = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;

const rangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.preprocess(endOfDay, z.coerce.date().optional()),
  })
  .refine((r) => !r.from || !r.to || r.from <= r.to, {
    message: 'La fecha inicial (from) no puede ser mayor a la fecha final (to)',
  });

const listQuerySchema = rangeSchema.extend({
  type: z.enum(MONEY_TYPES).optional(),
  categoryId: z.uuid().optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  all: z.enum(['true', 'false']).optional(),
});

const summaryQuerySchema = rangeSchema.extend({
  compare: z.enum(['prev']).optional(),
});

const trendQuerySchema = rangeSchema.extend({
  granularity: z.enum(['auto', 'day', 'week', 'month']).default('auto'),
});

const idParamsSchema = z.object({ id: z.uuid() });

export interface TransactionUseCases {
  create: CreateTransactionUseCase;
  list: ListTransactionsUseCase;
  get: GetTransactionUseCase;
  update: UpdateTransactionUseCase;
  delete: DeleteTransactionUseCase;
  summary: GetSummaryUseCase;
  trend: GetTrendUseCase;
}

export function transactionRouter(useCases: TransactionUseCases): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const userId = String(res.locals.userId);
    const { page, limit, all, ...filter } = validate(listQuerySchema, req.query);
    res.json(await useCases.list.execute({ ...filter, userId }, { page, limit, all: all === 'true' }));
  });

  router.get('/:id', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    res.json(await useCases.get.execute(id, userId));
  });

  router.post('/', async (req, res) => {
    const userId = String(res.locals.userId);
    const body = validate(createSchema, req.body);
    res.status(201).json(await useCases.create.execute({ ...body, userId }));
  });

  router.patch('/:id', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    const body = validate(updateSchema, req.body);
    res.json(await useCases.update.execute(id, body, userId));
  });

  router.delete('/:id', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    await useCases.delete.execute(id, userId);
    res.status(204).send();
  });

  return router;
}

export function summaryRouter(summary: GetSummaryUseCase, trend: GetTrendUseCase): Router {
  const router = Router();
  router.get('/', async (req, res) => {
    const userId = String(res.locals.userId);
    const query = validate(summaryQuerySchema, req.query);
    res.json(await summary.execute({ ...query, userId }));
  });
  router.get('/trend', async (req, res) => {
    const userId = String(res.locals.userId);
    const query = validate(trendQuerySchema, req.query);
    res.json(await trend.execute({ ...query, userId }));
  });
  return router;
}
