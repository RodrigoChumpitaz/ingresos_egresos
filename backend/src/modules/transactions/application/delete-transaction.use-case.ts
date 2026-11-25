import { NotFoundError } from '../../../shared/domain/errors';
import type { TransactionRepository } from '../domain/transaction-repository';

export class DeleteTransactionUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string, userId?: string): Promise<void> {
    const transaction = await this.transactions.findById(id, userId);
    if (!transaction) throw new NotFoundError(`Transacción ${id} no encontrada`);
    await this.transactions.delete(id, transaction.userId);
  }
}
