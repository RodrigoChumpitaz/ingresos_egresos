import type { SavingsEntryPrimitives, SavingsGoal } from './savings-goal';

export interface SavingsReader {
  sumNetAllocated(range: { from?: Date; to?: Date; userId?: string }): Promise<number>;
  totalBalance(userId?: string): Promise<number>;
}

export interface SavingsRepository extends SavingsReader {
  saveGoal(goal: SavingsGoal): Promise<void>;
  findGoalById(id: string, userId?: string): Promise<SavingsGoal | null>;
  findGoalByName(name: string, userId?: string): Promise<SavingsGoal | null>;
  findAllGoals(userId?: string): Promise<SavingsGoal[]>;
  deleteGoal(id: string, userId?: string): Promise<void>;
  saveEntry(entry: SavingsEntryPrimitives): Promise<void>;
  findEntriesByGoal(goalId: string, userId?: string): Promise<SavingsEntryPrimitives[]>;
}
