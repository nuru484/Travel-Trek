"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = exports.InternalServerError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.asyncHandler = exports.errorHandler = exports.CustomError = exports.ErrorSeverity = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("../config/env"));
const prismaErrorHandler_1 = require("./prismaErrorHandler");
/**
 * Error severity levels for better logging and monitoring
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Enhanced CustomError class with additional context for better debugging
 */
class CustomError extends Error {
    status;
    layer;
    severity;
    timestamp;
    code;
    context;
    constructor(status, message, options = {}) {
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
exports.CustomError = CustomError;
/**
 * Type guard to check if an error is a CustomError
 */
const isCustomError = (error) => {
    return error instanceof CustomError;
};
/**
 * Generate a unique error ID for tracking
 */
const generateErrorId = () => {
    return `err_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
};
/**
 * Sanitize error data for safe logging and response
 */
const sanitizeErrorData = (data) => {
    if (!data)
        return data;
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        Object.entries(data).forEach(([key, value]) => {
            if (['password', 'token', 'secret', 'auth', 'key', 'credit', 'ssn'].some((k) => key.toLowerCase().includes(k))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeErrorData(value);
            }
            else {
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
const errorHandler = (error, req, res, next) => {
    const isProduction = env_1.default.NODE_ENV === 'production';
    const errorId = generateErrorId();
    // Convert Prisma errors first
    let processedError = error;
    if ((0, prismaErrorHandler_1.isPrismaError)(error)) {
        processedError = (0, prismaErrorHandler_1.handlePrismaError)(error);
    }
    const sanitizedBody = sanitizeErrorData(req.body);
    // Default values
    let status = 500;
    let severity = ErrorSeverity.HIGH;
    let layer = 'unknown';
    let code;
    let context;
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
            logger_1.default.error(logDetails);
            break;
        case ErrorSeverity.MEDIUM:
            logger_1.default.warn(logDetails);
            break;
        case ErrorSeverity.LOW:
            logger_1.default.info(logDetails);
            break;
        default:
            logger_1.default.error(logDetails);
    }
    // Client response
    const errorResponse = {
        status: 'error',
        message: isProduction && status === 500
            ? 'Internal Server Error'
            : processedError.message || 'Internal Server Error',
    };
    if (context && code === 'VALIDATION_ERROR') {
        errorResponse.details = context;
    }
    if (!isProduction) {
        errorResponse.errorId = errorId;
        if (code)
            errorResponse.code = code;
        if (context && !errorResponse.details)
            errorResponse.details = context;
    }
    res.status(status).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * Wrapper for async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Common custom error subclasses
 */
class NotFoundError extends CustomError {
    constructor(message = 'Resource not found', options) {
        super(404, message, { ...options, severity: ErrorSeverity.LOW });
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized access', options) {
        super(401, message, { ...options, severity: ErrorSeverity.MEDIUM });
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends CustomError {
    constructor(message = 'Access forbidden, you are not allowed to access this resource', options) {
        super(403, message, { ...options, severity: ErrorSeverity.MEDIUM });
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends CustomError {
    constructor(message = 'Validation failed', options) {
        super(400, message, { ...options, severity: ErrorSeverity.LOW });
    }
}
exports.ValidationError = ValidationError;
class InternalServerError extends CustomError {
    constructor(message = 'Internal server error', options) {
        super(500, message, { ...options, severity: ErrorSeverity.HIGH });
    }
}
exports.InternalServerError = InternalServerError;
class BadRequestError extends CustomError {
    constructor(message = 'Bad request', options) {
        super(400, message, { ...options, severity: ErrorSeverity.LOW });
    }
}
exports.BadRequestError = BadRequestError;
