import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down' },
});

export function apiKeyAuth(req, _res, next) {
  if (!env.apiKey) return next();
  const provided = req.header('x-api-key');
  if (provided && provided === env.apiKey) return next();
  next(new ApiError(401, 'Missing or invalid API key'));
}
