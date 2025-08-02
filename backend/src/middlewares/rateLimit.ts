import { Request, Response, NextFunction } from 'express';
import rateLimit, {
  RateLimitRequestHandler,
  ipKeyGenerator,
} from 'express-rate-limit';
import { CustomError, ErrorSeverity } from './error-handler';

// Custom rate limit exceeded error
export class RateLimitExceededError extends CustomError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message, {
      layer: 'middleware',
      severity: ErrorSeverity.MEDIUM,
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }
}

// Create enhanced memory-based rate limiter
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 100,
  message: string = 'Too many requests, please try again later.',
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message,
    standardHeaders: true,
    legacyHeaders: false,

    // Advanced key generation - combine IP with user ID when available
    keyGenerator: (req: Request): string => {
      const ipKey = ipKeyGenerator(req.ip ?? ''); // Use ipKeyGenerator for normalized IP
      const userId = req.user?.id ? `-user-${req.user.id}` : '';
      return `${ipKey}${userId}`;
    },

    // Custom handler for rate limit exceeded
    handler: (_req: Request, res: Response, next: NextFunction) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.set('Retry-After', String(retryAfter));
      next(new RateLimitExceededError(message));
    },

    // Skip rate limiting for certain requests
    skip: (req: Request) => {
      // Skip health checks
      if (req.path === '/health' || req.path === '/ping') return true;

      // Skip for internal requests with secret header
      const bypassToken = req.get('X-Rate-Limit-Bypass');
      return bypassToken === process.env.RATE_LIMIT_BYPASS_SECRET;
    },

    // Enable trust proxy on your Express app instance for proper IP handling behind proxies
    // (Set app.set('trust proxy', true) in your main server file)
  });
};

// Different limiters for different endpoints
export const rateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many authentication attempts, please try again later.',
);

export const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 requests
  'Too many password reset attempts, please try again later.',
);

export default rateLimiter;
