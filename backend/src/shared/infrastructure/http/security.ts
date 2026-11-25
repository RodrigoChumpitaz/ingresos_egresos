import type { RequestHandler } from 'express';

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (!req.path.startsWith('/api/v1/docs')) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  next();
};

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(key);

    if (!record || record.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    record.count += 1;
    if (record.count > options.maxRequests) {
      res.status(429).json({
        error: 'TooManyRequests',
        message: 'Demasiados intentos. Intenta nuevamente en unos minutos.',
      });
      return;
    }

    next();
  };
}
