import { NotFoundError } from '../../../shared/domain/errors';
import type { CategoryRepository } from '../../categories/domain/category-repository';
import type { CategoryRef, TransactionPrimitives } from '../domain/transaction';
import type { TransactionRepository } from '../domain/transaction-repository';

export interface UpdateTransactionInput {
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
}

export class UpdateTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(id: string, input: UpdateTransactionInput): Promise<TransactionPrimitives> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) throw new NotFoundError(`Transacción ${id} no encontrada`);

    let category: CategoryRef | undefined;
    if (input.categoryId) {
      const found = await this.categories.findById(input.categoryId);
      if (!found) throw new NotFoundError(`Categoría ${input.categoryId} no encontrada`);
      category = { id: found.id, type: found.type };
    }

    transaction.update({ ...input, category });
    await this.transactions.save(transaction);
    return transaction.toPrimitives();
  }
}
