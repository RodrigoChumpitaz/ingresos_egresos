import { Router } from 'express';
import { z } from 'zod';
import { MONEY_TYPES } from '../../../../shared/domain/money-type';
import { validate } from '../../../../shared/infrastructure/http/validate';
import type { CreateCategoryUseCase } from '../../application/create-category.use-case';
import type { DeleteCategoryUseCase } from '../../application/delete-category.use-case';
import type { ListCategoriesUseCase } from '../../application/list-categories.use-case';
import type { UpdateCategoryUseCase } from '../../application/update-category.use-case';

const createSchema = z.object({
  name: z.string(),
  type: z.enum(MONEY_TYPES),
});
const updateSchema = z.object({ name: z.string() });
const listQuerySchema = z.object({ type: z.enum(MONEY_TYPES).optional() });
const idParamsSchema = z.object({ id: z.uuid() });

export interface CategoryUseCases {
  create: CreateCategoryUseCase;
  list: ListCategoriesUseCase;
  update: UpdateCategoryUseCase;
  delete: DeleteCategoryUseCase;
}

export function categoryRouter(useCases: CategoryUseCases): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = validate(listQuerySchema, req.query);
    res.json(await useCases.list.execute(query));
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
