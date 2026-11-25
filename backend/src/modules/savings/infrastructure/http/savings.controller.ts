import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../../../shared/infrastructure/http/validate';
import type { CreateSavingsGoalUseCase } from '../../application/create-savings-goal.use-case';
import type { DeleteSavingsGoalUseCase } from '../../application/delete-savings-goal.use-case';
import type { ListSavingsEntriesUseCase } from '../../application/list-savings-entries.use-case';
import type { ListSavingsGoalsUseCase } from '../../application/list-savings-goals.use-case';
import type { RecordSavingsMovementUseCase } from '../../application/record-savings-movement.use-case';
import type { UpdateSavingsGoalUseCase } from '../../application/update-savings-goal.use-case';
import { SAVINGS_MOVEMENT_TYPES } from '../../domain/savings-goal';

const createGoalSchema = z.object({
  name: z.string(),
  targetAmount: z.number(),
  deadline: z.coerce.date().nullable().optional(),
  color: z.string().max(20).optional(),
});

const updateGoalSchema = createGoalSchema.partial();

const movementSchema = z.object({
  type: z.enum(SAVINGS_MOVEMENT_TYPES),
  amount: z.number(),
  note: z.string().optional(),
  date: z.coerce.date().optional(),
});

const idParamsSchema = z.object({ id: z.uuid() });

export interface SavingsUseCases {
  listGoals: ListSavingsGoalsUseCase;
  createGoal: CreateSavingsGoalUseCase;
  updateGoal: UpdateSavingsGoalUseCase;
  deleteGoal: DeleteSavingsGoalUseCase;
  recordMovement: RecordSavingsMovementUseCase;
  listEntries: ListSavingsEntriesUseCase;
}

export function savingsRouter(useCases: SavingsUseCases): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const userId = String(res.locals.userId);
    res.json(await useCases.listGoals.execute(userId));
  });

  router.post('/', async (req, res) => {
    const userId = String(res.locals.userId);
    const body = validate(createGoalSchema, req.body);
    res.status(201).json(await useCases.createGoal.execute({ ...body, userId }));
  });

  router.patch('/:id', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    const body = validate(updateGoalSchema, req.body);
    res.json(await useCases.updateGoal.execute(id, body, userId));
  });

  router.delete('/:id', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    await useCases.deleteGoal.execute(id, userId);
    res.status(204).send();
  });

  router.get('/:id/entries', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    res.json(await useCases.listEntries.execute(id, userId));
  });

  router.post('/:id/movements', async (req, res) => {
    const userId = String(res.locals.userId);
    const { id } = validate(idParamsSchema, req.params);
    const body = validate(movementSchema, req.body);
    res.status(201).json(await useCases.recordMovement.execute({ goalId: id, userId, ...body }));
  });

  return router;
}
