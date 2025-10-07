import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import ENV from '../config/env';
import { handlePrismaError, isPrismaError } from './prismaErrorHandler';

/**
 * Error severity levels for better logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Enhanced CustomError class with additional context for better debugging
 */
export class CustomError extends Error {
  readonly status: number;
  readonly layer: string;
  readonly severity: ErrorSeverity;
  readonly timestamp: Date;
  readonly code?: string;
  readonly context?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    options: {
      layer?: string;
      severity?: ErrorSeverity;
      code?: string;
      context?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.layer = options.layer || 'unknown';
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.timestamp = new Date();
    this.code = options.code;
    this.context = options.context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Type guard to check if an error is a CustomError
 */
const isCustomError = (error: unknown): error is CustomError => {
  return error instanceof CustomError;
};

/**
 * Error response interface for consistent API responses
 */
interface ErrorResponse {
  status: string;
  message: string;
  errorId?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Generate a unique error ID for tracking
 */
const generateErrorId = (): string => {
  return `err_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

/**
 * Sanitize error data for safe logging and response
 */
const sanitizeErrorData = (data: unknown): unknown => {
  if (!data) return data;

  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};

    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (
        ['password', 'token', 'secret', 'auth', 'key', 'credit', 'ssn'].some(
          (k) => key.toLowerCase().includes(k),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeErrorData(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  return data;
};

/**
 * Error handler middleware with full type safety
 */
export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  const errorId = generateErrorId();

  // Convert Prisma errors first
  let processedError: Error | CustomError = error;

  if (isPrismaError(error)) {
    processedError = handlePrismaError(error);
  }

  const sanitizedBody = sanitizeErrorData(req.body);

  // Default values
  let status = 500;
  let severity = ErrorSeverity.HIGH;
  let layer = 'unknown';
  let code: string | undefined;
  let context: Record<string, unknown> | undefined;

  // Safely narrow CustomError type
  if (isCustomError(processedError)) {
    status = processedError.status;
    severity = processedError.severity;
    layer = processedError.layer;
    code = processedError.code;
    context = processedError.context;
  }

  // Logging details
  const logDetails = {
    errorId,
    message: processedError.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: sanitizedBody,
    params: req.params,
    query: req.query,
    severity,
    stack: !isProduction ? processedError.stack : undefined,
    timestamp: new Date().toISOString(),
    layer,
    code,
    context,
  };

  // Log at the appropriate level
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      logger.error(logDetails);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(logDetails);
      break;
    case ErrorSeverity.LOW:
      logger.info(logDetails);
      break;
    default:
      logger.error(logDetails);
  }

  // Client response
  const errorResponse: ErrorResponse = {
    status: 'error',
    message:
      isProduction && status === 500
        ? 'Internal Server Error'
        : processedError.message || 'Internal Server Error',
  };

  // Extra details for non-production
  if (!isProduction) {
    errorResponse.errorId = errorId;
    if (code) errorResponse.code = code;
    if (context) errorResponse.details = context;
  }

  res.status(status).json(errorResponse);
};

/**
 * Wrapper for async route handlers
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next) as Promise<void>).catch(next);
  };
};

/**
 * Common custom error subclasses
 */
export class NotFoundError extends CustomError {
  constructor(
    message = 'Resource not found',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(404, message, { ...options, severity: ErrorSeverity.LOW });
  }
}

export class UnauthorizedError extends CustomError {
  constructor(
    message = 'Unauthorized access',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(401, message, { ...options, severity: ErrorSeverity.MEDIUM });
  }
}

export class ForbiddenError extends CustomError {
  constructor(
    message = 'Access forbidden, you are not allowed to access this resource',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(403, message, { ...options, severity: ErrorSeverity.MEDIUM });
  }
}

export class ValidationError extends CustomError {
  constructor(
    message = 'Validation failed',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(400, message, { ...options, severity: ErrorSeverity.LOW });
  }
}

export class InternalServerError extends CustomError {
  constructor(
    message = 'Internal server error',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(500, message, { ...options, severity: ErrorSeverity.HIGH });
  }
}

export class BadRequestError extends CustomError {
  constructor(
    message = 'Bad request',
    options?: {
      layer?: string;
      code?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(400, message, { ...options, severity: ErrorSeverity.LOW });
  }
}
