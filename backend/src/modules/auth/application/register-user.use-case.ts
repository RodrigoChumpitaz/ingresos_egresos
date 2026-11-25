import { ConflictError } from '../../../shared/domain/errors';
import { User, type PublicUser } from '../domain/user';
import type { UserRepository } from '../domain/user-repository';

export class RegisterUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { name: string; email: string; password: string }): Promise<PublicUser> {
    const user = User.create(input);
    const existing = await this.users.findByEmail(user.email);
    if (existing) {
      throw new ConflictError('Ya existe una cuenta registrada con ese correo');
    }
    await this.users.save(user);
    return user.toPublic();
  }
}
