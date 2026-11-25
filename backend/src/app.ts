import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env';
import { buildContainer } from './container';
import { docsRouter } from './docs/docs.router';
import { authRouter } from './modules/auth/infrastructure/http/auth.controller';
import { requireAuth } from './modules/auth/infrastructure/http/session-token';
import { categoryRouter } from './modules/categories/infrastructure/http/category.controller';
import { exchangeRatesRouter } from './modules/exchange-rates/infrastructure/http/exchange-rates.controller';
import { savingsRouter } from './modules/savings/infrastructure/http/savings.controller';
import {
  summaryRouter,
  transactionRouter,
} from './modules/transactions/infrastructure/http/transaction.controller';
import { MongoConnection } from './shared/infrastructure/database/mongo-connection';
import { errorHandler, notFoundHandler } from './shared/infrastructure/http/error-handler';
import { securityHeaders } from './shared/infrastructure/http/security';

export function createApp(): Express {
  const app = express();
  const container = buildContainer();

  app.use(securityHeaders);
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1/docs', docsRouter);
  app.get('/api/v1/health', (_req, res) =>
    res.json({ status: 'ok', storageMode: env.storageMode, timestamp: new Date().toISOString() }),
  );

  if (env.storageMode === 'mongo') {
    app.use('/api/v1', async (_req, _res, next) => {
      await MongoConnection.connect();
      next();
    });
  }

  app.use('/api/v1/auth', authRouter(container.auth));
  app.use('/api/v1/exchange-rates', exchangeRatesRouter(container.exchangeRates));

  app.use('/api/v1/categories', requireAuth, categoryRouter(container.categories));
  app.use('/api/v1/transactions', requireAuth, transactionRouter(container.transactions));
  app.use('/api/v1/summary', requireAuth, summaryRouter(container.transactions.summary, container.transactions.trend));
  app.use('/api/v1/savings-goals', requireAuth, savingsRouter(container.savings));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
