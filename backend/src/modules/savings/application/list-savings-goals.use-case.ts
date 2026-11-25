import type { SavingsGoalPrimitives } from '../domain/savings-goal';
import type { SavingsRepository } from '../domain/savings-repository';

export class ListSavingsGoalsUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(userId?: string): Promise<SavingsGoalPrimitives[]> {
    const goals = await this.savings.findAllGoals(userId);
    return goals.map((g) => g.toPrimitives());
  }
}
