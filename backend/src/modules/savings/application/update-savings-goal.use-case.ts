import { ConflictError, NotFoundError } from '../../../shared/domain/errors';
import type { SavingsGoalPrimitives } from '../domain/savings-goal';
import type { SavingsRepository } from '../domain/savings-repository';

export class UpdateSavingsGoalUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(
    id: string,
    input: { name?: string; targetAmount?: number; deadline?: Date | null; color?: string },
    userId?: string,
  ): Promise<SavingsGoalPrimitives> {
    const goal = await this.savings.findGoalById(id, userId);
    if (!goal) throw new NotFoundError(`Meta de ahorro ${id} no encontrada`);

    goal.update(input);

    if (input.name !== undefined) {
      const duplicate = await this.savings.findGoalByName(goal.name, goal.userId);
      if (duplicate && duplicate.id !== goal.id) {
        throw new ConflictError(`Ya existe una meta de ahorro "${goal.name}"`);
      }
    }

    await this.savings.saveGoal(goal);
    return goal.toPrimitives();
  }
}
