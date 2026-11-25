import { SavingsGoal, type SavingsEntryPrimitives } from '../../domain/savings-goal';
import type { SavingsRepository } from '../../domain/savings-repository';

const round2 = (n: number) => Math.round(n * 100) / 100;

export class InMemorySavingsRepository implements SavingsRepository {
  private readonly goals = new Map<string, SavingsGoal>();
  private readonly entries: SavingsEntryPrimitives[] = [];

  constructor(initial?: { goals?: SavingsGoal[]; entries?: SavingsEntryPrimitives[] }) {
    for (const goal of initial?.goals ?? []) {
      this.goals.set(goal.id, SavingsGoal.fromPrimitives(goal.toPrimitives()));
    }
    for (const entry of initial?.entries ?? []) {
      this.entries.push({ ...entry });
    }
  }

  async saveGoal(goal: SavingsGoal): Promise<void> {
    this.goals.set(goal.id, SavingsGoal.fromPrimitives(goal.toPrimitives()));
  }

  async findGoalById(id: string, userId?: string): Promise<SavingsGoal | null> {
    const found = this.goals.get(id);
    if (!found) return null;
    if (userId && found.userId !== userId) return null;
    return SavingsGoal.fromPrimitives(found.toPrimitives());
  }

  async findGoalByName(name: string, userId?: string): Promise<SavingsGoal | null> {
    const normalized = name.trim().toLocaleLowerCase('es');
    for (const goal of this.goals.values()) {
      if (
        (!userId || goal.userId === userId) &&
        goal.name.trim().toLocaleLowerCase('es') === normalized
      ) {
        return SavingsGoal.fromPrimitives(goal.toPrimitives());
      }
    }
    return null;
  }

  async findAllGoals(userId?: string): Promise<SavingsGoal[]> {
    return Array.from(this.goals.values())
      .filter((g) => !userId || g.userId === userId)
      .sort((a, b) => b.toPrimitives().createdAt.getTime() - a.toPrimitives().createdAt.getTime())
      .map((g) => SavingsGoal.fromPrimitives(g.toPrimitives()));
  }

  async deleteGoal(id: string, userId?: string): Promise<void> {
    const existing = this.goals.get(id);
    if (!existing || (userId && existing.userId !== userId)) return;
    this.goals.delete(id);
    for (let i = this.entries.length - 1; i >= 0; i -= 1) {
      if (this.entries[i].goalId === id) {
        this.entries.splice(i, 1);
      }
    }
  }

  async saveEntry(entry: SavingsEntryPrimitives): Promise<void> {
    this.entries.push({ ...entry });
  }

  async findEntriesByGoal(goalId: string, userId?: string): Promise<SavingsEntryPrimitives[]> {
    return this.entries
      .filter((e) => e.goalId === goalId && (!userId || e.userId === userId))
      .sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime())
      .map((e) => ({ ...e }));
  }

  async sumNetAllocated(range: { from?: Date; to?: Date; userId?: string }): Promise<number> {
    let total = 0;
    for (const entry of this.entries) {
      if (range.userId && entry.userId !== range.userId) continue;
      if (range.from && entry.date < range.from) continue;
      if (range.to && entry.date > range.to) continue;
      total += entry.type === 'CONTRIBUTION' ? entry.amount : -entry.amount;
    }
    return round2(total);
  }

  async totalBalance(userId?: string): Promise<number> {
    let total = 0;
    for (const goal of this.goals.values()) {
      if (userId && goal.userId !== userId) continue;
      total += goal.currentAmount;
    }
    return round2(total);
  }
}
