import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source] || {});
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          ApiError.badRequest(
            'Validation failed',
            err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
          )
        );
      } else {
        next(err);
      }
    }
  };
}

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'Endpoint not found'));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid data', details: err.message });
    return;
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(409).json({ error: 'Duplicate value', details: err.message });
    return;
  }
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
