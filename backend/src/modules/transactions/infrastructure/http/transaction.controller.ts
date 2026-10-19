import { Router } from 'express';
import { z } from 'zod';
import { MONEY_TYPES } from '../../../../shared/domain/money-type';
import { validate } from '../../../../shared/infrastructure/http/validate';
import type { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import type { DeleteTransactionUseCase } from '../../application/delete-transaction.use-case';
import type { GetSummaryUseCase } from '../../application/get-summary.use-case';
import type { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import type { ListTransactionsUseCase } from '../../application/list-transactions.use-case';
import type { UpdateTransactionUseCase } from '../../application/update-transaction.use-case';

const createSchema = z.object({
  amount: z.number(),
  categoryId: z.uuid(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
});
const updateSchema = createSchema.partial();

const endOfDay = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.preprocess(endOfDay, z.coerce.date().optional()),
});
const listQuerySchema = rangeSchema.extend({
  type: z.enum(MONEY_TYPES).optional(),
  categoryId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const idParamsSchema = z.object({ id: z.uuid() });

export interface TransactionUseCases {
  create: CreateTransactionUseCase;
  list: ListTransactionsUseCase;
  get: GetTransactionUseCase;
  update: UpdateTransactionUseCase;
  delete: DeleteTransactionUseCase;
  summary: GetSummaryUseCase;
}

export function transactionRouter(useCases: TransactionUseCases): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const { page, limit, ...filter } = validate(listQuerySchema, req.query);
    res.json(await useCases.list.execute(filter, { page, limit }));
  });

  router.get('/:id', async (req, res) => {
    const { id } = validate(idParamsSchema, req.params);
    res.json(await useCases.get.execute(id));
  });

  router.post('/', async (req, res) => {
    const body = validate(createSchema, req.body);
    res.status(201).json(await useCases.create.execute(body));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = validate(idParamsSchema, req.params);
    const body = validate(updateSchema, req.body);
    res.json(await useCases.update.execute(id, body));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = validate(idParamsSchema, req.params);
    await useCases.delete.execute(id);
    res.status(204).send();
  });

  return router;
}

export function summaryRouter(summary: GetSummaryUseCase): Router {
  const router = Router();
  router.get('/', async (req, res) => {
    const range = validate(rangeSchema, req.query);
    res.json(await summary.execute(range));
  });
  return router;
}
