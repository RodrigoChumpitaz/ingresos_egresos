import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestHandler, Response } from 'express';
import { env } from '../../../../config/env';
import { UnauthorizedError } from '../../../../shared/domain/errors';

export const SESSION_COOKIE_NAME = 'finanza_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  sub: string;
  exp: number;
}

function getSecret(): string {
  if (!env.authSecret) {
    throw new Error('Falta AUTH_SECRET en producción');
  }
  return env.authSecret;
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string): string | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed.sub || typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) {
      return null;
    }
    return parsed.sub;
  } catch {
    return null;
  }
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function setSessionCookie(res: Response, userId: string): void {
  const token = createSessionToken(userId);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME);
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) {
    throw new UnauthorizedError('Debes iniciar sesión para continuar');
  }
  res.locals.userId = userId;
  next();
};
