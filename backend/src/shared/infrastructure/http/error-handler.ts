import type { ErrorRequestHandler, RequestHandler } from 'express';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors';

function statusFor(error: DomainError): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof BusinessRuleError) return 422;
  return 400;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Ruta no encontrada: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof DomainError) {
    res.status(statusFor(error)).json({ error: error.name, message: error.message });
    return;
  }

  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'ValidationError', message: 'El body no es un JSON válido' });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'InternalServerError', message: 'Ocurrió un error inesperado' });
};
