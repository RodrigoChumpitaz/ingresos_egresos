import { NotFoundError } from '../../../shared/domain/errors';
import type {
  SavingsEntryPrimitives,
  SavingsGoalPrimitives,
  SavingsMovementType,
} from '../domain/savings-goal';
import type { SavingsRepository } from '../domain/savings-repository';

export class RecordSavingsMovementUseCase {
  constructor(private readonly savings: SavingsRepository) {}

  async execute(input: {
    userId?: string;
    goalId: string;
    type: SavingsMovementType;
    amount: number;
    note?: string;
    date?: Date;
  }): Promise<{ goal: SavingsGoalPrimitives; entry: SavingsEntryPrimitives }> {
    const goal = await this.savings.findGoalById(input.goalId, input.userId);
    if (!goal) throw new NotFoundError(`Meta de ahorro ${input.goalId} no encontrada`);

    const entry =
      input.type === 'CONTRIBUTION'
        ? goal.contribute(input.amount, input.note, input.date)
        : goal.withdraw(input.amount, input.note, input.date);

    await Promise.all([this.savings.saveGoal(goal), this.savings.saveEntry(entry)]);
    return { goal: goal.toPrimitives(), entry };
  }
}
