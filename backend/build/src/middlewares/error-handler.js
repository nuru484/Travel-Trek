"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.asyncHandler = exports.errorHandler = exports.CustomError = exports.ErrorSeverity = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("../config/env"));
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
        // Maintains proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.CustomError = CustomError;
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
        // Deep copy and sanitize object properties
        Object.entries(data).forEach(([key, value]) => {
            // Skip sensitive fields
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
 * Error handler middleware with better typing and security
 */
const errorHandler = (error, req, res, next) => {
    const isProduction = env_1.default.NODE_ENV === 'production';
    const errorId = generateErrorId();
    // Sanitize request body for logging
    const sanitizedBody = sanitizeErrorData(req.body);
    // Custom error with appropriate HTTP status and detailed info
    const isCustomError = error instanceof CustomError;
    const status = isCustomError ? error.status : 500;
    const severity = isCustomError ? error.severity : ErrorSeverity.HIGH;
    // Prepare error details for logging
    const logDetails = {
        errorId,
        message: error.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        body: sanitizedBody,
        params: req.params,
        query: req.query,
        severity,
        stack: !isProduction ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        layer: isCustomError ? error.layer : 'unknown',
        code: isCustomError ? error.code : undefined,
        context: isCustomError ? error.context : undefined,
    };
    // Log the error with appropriate level based on severity
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
    // Prepare client response
    const errorResponse = {
        status: 'error',
        message: isProduction && status === 500
            ? 'Internal Server Error'
            : error.message || 'Internal Server Error',
    };
    // Add additional error details for non-production environments
    if (!isProduction) {
        errorResponse.errorId = errorId;
        if (isCustomError) {
            errorResponse.code = error.code;
            if (error.context) {
                errorResponse.details = error.context;
            }
        }
    }
    // Send appropriate response
    res.status(status).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * Wrapper for async route handlers to automatically catch errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Create specific error types for common use cases
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
    constructor(message = 'Access forbidden, You are not allowed to access this resource', options) {
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
