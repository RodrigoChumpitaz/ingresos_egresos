import { env } from './config/env';
import { GetCurrentUserUseCase } from './modules/auth/application/get-current-user.use-case';
import { LoginUserUseCase } from './modules/auth/application/login-user.use-case';
import { RegisterUserUseCase } from './modules/auth/application/register-user.use-case';
import type { UserRepository } from './modules/auth/domain/user-repository';
import { InMemoryUserRepository } from './modules/auth/infrastructure/persistence/in-memory-user.repository';
import { MongoUserRepository } from './modules/auth/infrastructure/persistence/mongo-user.repository';
import type { CategoryRepository } from './modules/categories/domain/category-repository';
import { CreateCategoryUseCase } from './modules/categories/application/create-category.use-case';
import { DeleteCategoryUseCase } from './modules/categories/application/delete-category.use-case';
import { ListCategoriesUseCase } from './modules/categories/application/list-categories.use-case';
import { UpdateCategoryUseCase } from './modules/categories/application/update-category.use-case';
import { InMemoryCategoryRepository } from './modules/categories/infrastructure/persistence/in-memory-category.repository';
import { MongoCategoryRepository } from './modules/categories/infrastructure/persistence/mongo-category.repository';
import { GetExchangeRatesUseCase } from './modules/exchange-rates/application/get-exchange-rates.use-case';
import { CreateSavingsGoalUseCase } from './modules/savings/application/create-savings-goal.use-case';
import { DeleteSavingsGoalUseCase } from './modules/savings/application/delete-savings-goal.use-case';
import { ListSavingsEntriesUseCase } from './modules/savings/application/list-savings-entries.use-case';
import { ListSavingsGoalsUseCase } from './modules/savings/application/list-savings-goals.use-case';
import { RecordSavingsMovementUseCase } from './modules/savings/application/record-savings-movement.use-case';
import { UpdateSavingsGoalUseCase } from './modules/savings/application/update-savings-goal.use-case';
import type { SavingsRepository } from './modules/savings/domain/savings-repository';
import { InMemorySavingsRepository } from './modules/savings/infrastructure/persistence/in-memory-savings.repository';
import { MongoSavingsRepository } from './modules/savings/infrastructure/persistence/mongo-savings.repository';
import type { TransactionRepository } from './modules/transactions/domain/transaction-repository';
import { CreateTransactionUseCase } from './modules/transactions/application/create-transaction.use-case';
import { DeleteTransactionUseCase } from './modules/transactions/application/delete-transaction.use-case';
import { GetSummaryUseCase } from './modules/transactions/application/get-summary.use-case';
import { GetTransactionUseCase } from './modules/transactions/application/get-transaction.use-case';
import { GetTrendUseCase } from './modules/transactions/application/get-trend.use-case';
import { ListTransactionsUseCase } from './modules/transactions/application/list-transactions.use-case';
import { UpdateTransactionUseCase } from './modules/transactions/application/update-transaction.use-case';
import { InMemoryTransactionRepository } from './modules/transactions/infrastructure/persistence/in-memory-transaction.repository';
import { MongoTransactionRepository } from './modules/transactions/infrastructure/persistence/mongo-transaction.repository';
import { createDemoSeed } from './shared/infrastructure/database/seed-demo-data';

function createRepositories(): {
  userRepository: UserRepository;
  categoryRepository: CategoryRepository;
  transactionRepository: TransactionRepository;
  savingsRepository: SavingsRepository;
} {
  if (env.storageMode === 'memory') {
    const seed = createDemoSeed();
    return {
      userRepository: new InMemoryUserRepository([seed.demoUser]),
      categoryRepository: new InMemoryCategoryRepository(seed.categories),
      transactionRepository: new InMemoryTransactionRepository(seed.transactions),
      savingsRepository: new InMemorySavingsRepository({
        goals: seed.savingsGoals,
        entries: seed.savingsEntries,
      }),
    };
  }
  return {
    userRepository: new MongoUserRepository(),
    categoryRepository: new MongoCategoryRepository(),
    transactionRepository: new MongoTransactionRepository(),
    savingsRepository: new MongoSavingsRepository(),
  };
}

export function buildContainer() {
  const { userRepository, categoryRepository, transactionRepository, savingsRepository } =
    createRepositories();

  const summary = new GetSummaryUseCase(transactionRepository, categoryRepository, savingsRepository);
  const trend = new GetTrendUseCase(transactionRepository);
  const exchangeRates = new GetExchangeRatesUseCase();

  return {
    auth: {
      register: new RegisterUserUseCase(userRepository),
      login: new LoginUserUseCase(userRepository),
      me: new GetCurrentUserUseCase(userRepository),
    },
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
      trend,
    },
    savings: {
      listGoals: new ListSavingsGoalsUseCase(savingsRepository),
      createGoal: new CreateSavingsGoalUseCase(savingsRepository),
      updateGoal: new UpdateSavingsGoalUseCase(savingsRepository),
      deleteGoal: new DeleteSavingsGoalUseCase(savingsRepository),
      recordMovement: new RecordSavingsMovementUseCase(savingsRepository),
      listEntries: new ListSavingsEntriesUseCase(savingsRepository),
    },
    exchangeRates,
  };
}

export type Container = ReturnType<typeof buildContainer>;
