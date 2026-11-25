import { randomUUID } from 'node:crypto';
import { DEFAULT_USER_ID } from '../../categories/domain/category';
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors';

export const SAVINGS_MOVEMENT_TYPES = ['CONTRIBUTION', 'WITHDRAWAL'] as const;
export type SavingsMovementType = (typeof SAVINGS_MOVEMENT_TYPES)[number];

export interface SavingsGoalPrimitives {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | null;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsEntryPrimitives {
  id: string;
  userId: string;
  goalId: string;
  type: SavingsMovementType;
  amount: number;
  note: string;
  date: Date;
  createdAt: Date;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export class SavingsGoal {
  private constructor(private props: SavingsGoalPrimitives) {}

  static create(input: {
    userId?: string;
    name: string;
    targetAmount: number;
    deadline?: Date | null;
    color?: string;
  }): SavingsGoal {
    const now = new Date();
    return new SavingsGoal({
      id: randomUUID(),
      userId: input.userId ?? DEFAULT_USER_ID,
      name: SavingsGoal.validateName(input.name),
      targetAmount: SavingsGoal.validatePositiveAmount(input.targetAmount, 'El objetivo'),
      currentAmount: 0,
      deadline: input.deadline ?? null,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(props: SavingsGoalPrimitives): SavingsGoal {
    return new SavingsGoal({ ...props, userId: props.userId ?? DEFAULT_USER_ID });
  }

  update(changes: {
    name?: string;
    targetAmount?: number;
    deadline?: Date | null;
    color?: string;
  }): void {
    if (changes.name !== undefined) {
      this.props.name = SavingsGoal.validateName(changes.name);
    }
    if (changes.targetAmount !== undefined) {
      this.props.targetAmount = SavingsGoal.validatePositiveAmount(changes.targetAmount, 'El objetivo');
    }
    if (changes.deadline !== undefined) {
      this.props.deadline = changes.deadline;
    }
    if (changes.color !== undefined) {
      this.props.color = changes.color;
    }
    this.props.updatedAt = new Date();
  }

  contribute(amount: number, note = '', date?: Date): SavingsEntryPrimitives {
    const valid = SavingsGoal.validatePositiveAmount(amount, 'El aporte');
    const now = new Date();
    this.props.currentAmount = round2(this.props.currentAmount + valid);
    this.props.updatedAt = now;
    return {
      id: randomUUID(),
      userId: this.props.userId,
      goalId: this.props.id,
      type: 'CONTRIBUTION',
      amount: valid,
      note: SavingsGoal.validateNote(note),
      date: date ?? now,
      createdAt: now,
    };
  }

  withdraw(amount: number, note = '', date?: Date): SavingsEntryPrimitives {
    const valid = SavingsGoal.validatePositiveAmount(amount, 'El retiro');
    if (valid > this.props.currentAmount) {
      throw new BusinessRuleError(
        `No puedes retirar más del saldo ahorrado (${this.props.currentAmount})`,
      );
    }
    const now = new Date();
    this.props.currentAmount = round2(this.props.currentAmount - valid);
    this.props.updatedAt = now;
    return {
      id: randomUUID(),
      userId: this.props.userId,
      goalId: this.props.id,
      type: 'WITHDRAWAL',
      amount: valid,
      note: SavingsGoal.validateNote(note),
      date: date ?? now,
      createdAt: now,
    };
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get name() { return this.props.name; }
  get currentAmount() { return this.props.currentAmount; }

  toPrimitives(): SavingsGoalPrimitives {
    return { ...this.props };
  }

  private static validateName(name: string): string {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length < 2 || trimmed.length > 60) {
      throw new ValidationError('El nombre de la meta debe tener entre 2 y 60 caracteres');
    }
    return trimmed;
  }

  private static validatePositiveAmount(amount: number, label: string): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError(`${label} debe ser un número mayor a 0`);
    }
    const cents = amount * 100;
    if (Math.abs(cents - Math.round(cents)) > 1e-9) {
      throw new ValidationError(`${label} puede tener como máximo 2 decimales`);
    }
    return Math.round(cents) / 100;
  }

  private static validateNote(note: string): string {
    const trimmed = note.trim();
    if (trimmed.length > 200) {
      throw new ValidationError('La nota no puede superar los 200 caracteres');
    }
    return trimmed;
  }
}
