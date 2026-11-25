import { UnauthorizedError } from '../../../shared/domain/errors';
import type { PublicUser } from '../domain/user';
import type { UserRepository } from '../domain/user-repository';

export class LoginUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { email: string; password: string }): Promise<PublicUser> {
    const email = input.email?.trim().toLowerCase() ?? '';
    const user = await this.users.findByEmail(email);
    if (!user || !user.matchesPassword(input.password ?? '')) {
      throw new UnauthorizedError('Credenciales inválidas');
    }
    return user.toPublic();
  }
}
