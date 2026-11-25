import { NotFoundError } from '../../../shared/domain/errors';
import type { SavingsEntryPrimitives } from '../domain/savings-goal';
import type { SavingsRepository } from '../domain/savings-repository';

export class ListSavingsEntriesUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(goalId: string, userId?: string): Promise<SavingsEntryPrimitives[]> {
    const goal = await this.savings.findGoalById(goalId, userId);
    if (!goal) throw new NotFoundError(`Meta de ahorro ${goalId} no encontrada`);
    return this.savings.findEntriesByGoal(goalId, goal.userId);
  }
}
