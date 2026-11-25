import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../shared/domain/errors';
import { hashPassword, verifyPassword } from './password';

export interface UserPrimitives {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class User {
  private constructor(private props: UserPrimitives) {}

  static create(input: { id?: string; name: string; email: string; password: string }): User {
    const now = new Date();
    return new User({
      id: input.id ?? randomUUID(),
      name: User.validateName(input.name),
      email: User.validateEmail(input.email),
      passwordHash: hashPassword(User.validatePassword(input.password)),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(props: UserPrimitives): User {
    return new User({ ...props });
  }

  matchesPassword(plain: string): boolean {
    return verifyPassword(plain, this.props.passwordHash);
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }

  toPrimitives(): UserPrimitives {
    return { ...this.props };
  }

  toPublic(): PublicUser {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      createdAt: this.props.createdAt,
    };
  }

  private static validateName(name: string): string {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length < 2 || trimmed.length > 60) {
      throw new ValidationError('El nombre debe tener entre 2 y 60 caracteres');
    }
    return trimmed;
  }

  private static validateEmail(email: string): string {
    const normalized = email?.trim().toLowerCase() ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 120) {
      throw new ValidationError('Ingresa un correo electrónico válido');
    }
    return normalized;
  }

  private static validatePassword(password: string): string {
    if (!password || password.length < 8 || password.length > 100) {
      throw new ValidationError('La contraseña debe tener entre 8 y 100 caracteres');
    }
    return password;
  }
}
