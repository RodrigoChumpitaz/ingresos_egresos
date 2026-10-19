import { CreateCategoryUseCase } from './modules/categories/application/create-category.use-case';
import { DeleteCategoryUseCase } from './modules/categories/application/delete-category.use-case';
import { ListCategoriesUseCase } from './modules/categories/application/list-categories.use-case';
import { UpdateCategoryUseCase } from './modules/categories/application/update-category.use-case';
import { MongoCategoryRepository } from './modules/categories/infrastructure/persistence/mongo-category.repository';
import { CreateTransactionUseCase } from './modules/transactions/application/create-transaction.use-case';
import { DeleteTransactionUseCase } from './modules/transactions/application/delete-transaction.use-case';
import { GetSummaryUseCase } from './modules/transactions/application/get-summary.use-case';
import { GetTransactionUseCase } from './modules/transactions/application/get-transaction.use-case';
import { ListTransactionsUseCase } from './modules/transactions/application/list-transactions.use-case';
import { UpdateTransactionUseCase } from './modules/transactions/application/update-transaction.use-case';
import { MongoTransactionRepository } from './modules/transactions/infrastructure/persistence/mongo-transaction.repository';

export function buildContainer() {
  const categoryRepository = new MongoCategoryRepository();
  const transactionRepository = new MongoTransactionRepository();

  const summary = new GetSummaryUseCase(transactionRepository, categoryRepository);

  return {
    categories: {
      create: new CreateCategoryUseCase(categoryRepository),
      list: new ListCategoriesUseCase(categoryRepository),
      update: new UpdateCategoryUseCase(categoryRepository),
      delete: new DeleteCategoryUseCase(categoryRepository, transactionRepository),
    },
    transactions: {
      create: new CreateTransactionUseCase(transactionRepository, categoryRepository),
      list: new ListTransactionsUseCase(transactionRepository),
      get: new GetTransactionUseCase(transactionRepository),
      update: new UpdateTransactionUseCase(transactionRepository, categoryRepository),
      delete: new DeleteTransactionUseCase(transactionRepository),
      summary,
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
