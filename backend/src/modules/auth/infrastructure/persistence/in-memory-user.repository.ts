import { User } from '../../domain/user';
import type { UserRepository } from '../../domain/user-repository';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  constructor(initial: User[] = []) {
    for (const user of initial) {
      this.users.set(user.id, User.fromPrimitives(user.toPrimitives()));
    }
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, User.fromPrimitives(user.toPrimitives()));
  }

  async findById(id: string): Promise<User | null> {
    const found = this.users.get(id);
    return found ? User.fromPrimitives(found.toPrimitives()) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalized) {
        return User.fromPrimitives(user.toPrimitives());
      }
    }
    return null;
  }
}
