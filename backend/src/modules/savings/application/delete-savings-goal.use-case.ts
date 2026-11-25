import { BusinessRuleError, NotFoundError } from '../../../shared/domain/errors';
import type { SavingsRepository } from '../domain/savings-repository';

export class DeleteSavingsGoalUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(id: string, userId?: string): Promise<void> {
    const goal = await this.savings.findGoalById(id, userId);
    if (!goal) throw new NotFoundError(`Meta de ahorro ${id} no encontrada`);

    if (goal.currentAmount > 0) {
      throw new BusinessRuleError('Retira el saldo ahorrado antes de eliminar esta meta');
    }

    await this.savings.deleteGoal(id, goal.userId);
  }
}
