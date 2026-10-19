import cors from 'cors';
import express, { type Express } from 'express';
import { buildContainer } from './container';
import { docsRouter } from './docs/docs.router';
import { categoryRouter } from './modules/categories/infrastructure/http/category.controller';
import {
  summaryRouter,
  transactionRouter,
} from './modules/transactions/infrastructure/http/transaction.controller';
import { MongoConnection } from './shared/infrastructure/database/mongo-connection';
import { errorHandler, notFoundHandler } from './shared/infrastructure/http/error-handler';

export function createApp(): Express {
  const app = express();
  const container = buildContainer();

  app.use(cors());
  app.use(express.json());

  app.use('/api/v1/docs', docsRouter);
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/v1', async (_req, _res, next) => {
    await MongoConnection.connect();
    next();
  });

  app.use('/api/v1/categories', categoryRouter(container.categories));
  app.use('/api/v1/transactions', transactionRouter(container.transactions));
  app.use('/api/v1/summary', summaryRouter(container.transactions.summary));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
