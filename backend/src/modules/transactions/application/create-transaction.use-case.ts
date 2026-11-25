import type { CurrencyCode } from '../../../shared/domain/currency';
import { NotFoundError } from '../../../shared/domain/errors';
import type { CategoryRepository } from '../../categories/domain/category-repository';
import { Transaction, type TransactionPrimitives } from '../domain/transaction';
import type { TransactionRepository } from '../domain/transaction-repository';

export interface CreateTransactionInput {
  userId?: string;
  amount: number;
  currency?: CurrencyCode;
  exchangeRate?: number;
  categoryId: string;
  description?: string;
  date?: Date;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionPrimitives> {
    const category = await this.categories.findById(input.categoryId, input.userId);
    if (!category) throw new NotFoundError(`Categoría ${input.categoryId} no encontrada`);

    const transaction = Transaction.create({
      userId: category.userId,
      amount: input.amount,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      description: input.description,
      date: input.date,
      category: { id: category.id, type: category.type },
    });

    await this.transactions.save(transaction);
    return transaction.toPrimitives();
  }
}
