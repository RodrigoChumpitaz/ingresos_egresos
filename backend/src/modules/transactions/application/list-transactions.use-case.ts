import type { TransactionPrimitives } from '../domain/transaction';
import type {
  Paginated,
  Pagination,
  TransactionFilter,
  TransactionRepository,
} from '../domain/transaction-repository';

export class ListTransactionsUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(filter: TransactionFilter, pagination: Pagination): Promise<Paginated<TransactionPrimitives>> {
    const result = await this.transactions.findMany(filter, pagination);
    return { ...result, items: result.items.map((t) => t.toPrimitives()) };
  }
}
