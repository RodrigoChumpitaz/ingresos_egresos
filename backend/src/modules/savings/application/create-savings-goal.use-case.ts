import { ConflictError } from '../../../shared/domain/errors';
import { SavingsGoal, type SavingsGoalPrimitives } from '../domain/savings-goal';
import type { SavingsRepository } from '../domain/savings-repository';

export class CreateSavingsGoalUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(input: {
    userId?: string;
    name: string;
    targetAmount: number;
    deadline?: Date | null;
    color?: string;
  }): Promise<SavingsGoalPrimitives> {
    const goal = SavingsGoal.create(input);
    const duplicate = await this.savings.findGoalByName(goal.name, goal.userId);
    if (duplicate) {
      throw new ConflictError(`Ya existe una meta de ahorro "${goal.name}"`);
    }
    await this.savings.saveGoal(goal);
    return goal.toPrimitives();
  }
}
