import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../../../shared/infrastructure/http/validate';
import { createRateLimiter } from '../../../../shared/infrastructure/http/security';
import type { GetCurrentUserUseCase } from '../../application/get-current-user.use-case';
import type { LoginUserUseCase } from '../../application/login-user.use-case';
import type { RegisterUserUseCase } from '../../application/register-user.use-case';
import { clearSessionCookie, requireAuth, setSessionCookie } from './session-token';

const registerSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export interface AuthUseCases {
  register: RegisterUserUseCase;
  login: LoginUserUseCase;
  me: GetCurrentUserUseCase;
}

export function authRouter(useCases: AuthUseCases): Router {
  const router = Router();
  const authRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

  router.post('/register', authRateLimit, async (req, res) => {
    const body = validate(registerSchema, req.body);
    const user = await useCases.register.execute(body);
    setSessionCookie(res, user.id);
    res.status(201).json({ user });
  });

  router.post('/login', authRateLimit, async (req, res) => {
    const body = validate(loginSchema, req.body);
    const user = await useCases.login.execute(body);
    setSessionCookie(res, user.id);
    res.json({ user });
  });

  router.post('/logout', (_req, res) => {
    clearSessionCookie(res);
    res.status(204).send();
  });

  router.get('/me', requireAuth, async (_req, res) => {
    const user = await useCases.me.execute(String(res.locals.userId));
    res.json(user);
  });

  return router;
}
