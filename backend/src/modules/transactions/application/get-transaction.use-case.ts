import { NotFoundError } from '../../../shared/domain/errors';
import type { TransactionPrimitives } from '../domain/transaction';
import type { TransactionRepository } from '../domain/transaction-repository';

export class GetTransactionUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string): Promise<TransactionPrimitives> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) throw new NotFoundError(`Transacción ${id} no encontrada`);
    return transaction.toPrimitives();
  }
}
