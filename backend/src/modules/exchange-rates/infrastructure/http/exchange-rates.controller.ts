import { Router } from 'express';
import { z } from 'zod';
import { BASE_CURRENCY, CURRENCY_CODES } from '../../../../shared/domain/currency';
import { validate } from '../../../../shared/infrastructure/http/validate';
import type { GetExchangeRatesUseCase } from '../../application/get-exchange-rates.use-case';

const querySchema = z.object({
  base: z.enum(CURRENCY_CODES).default(BASE_CURRENCY),
});

export function exchangeRatesRouter(useCase: GetExchangeRatesUseCase): Router {
  const router = Router();
  router.get('/', async (req, res) => {
    const { base } = validate(querySchema, req.query);
    res.json(await useCase.execute(base));
  });
  return router;
}
