"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const error_handler_1 = require("./error-handler");
/**
 * Middleware to check validation results and pass errors to error handler
 */
// Type guards
function isStandardValidationError(error) {
    return 'path' in error;
}
function isLegacyValidationError(error) {
    return 'param' in error;
}
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error) => {
            if (isStandardValidationError(error)) {
                return { field: error.path, message: error.msg };
            }
            if (isLegacyValidationError(error)) {
                return { field: error.param, message: error.msg };
            }
            return { field: 'unknown', message: error.msg };
        });
        const validationError = new error_handler_1.ValidationError('Validation Error', {
            layer: 'Request Validation',
            code: 'VALIDATION_ERROR',
            context: {
                errors: formattedErrors,
            },
        });
        return next(validationError);
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * Middleware factory for common CRUD operations
 */
exports.validationMiddleware = {
    // Create a middleware with the provided validators
    create: (validators) => [...validators, exports.validateRequest],
    // Create a middleware for update operations
    update: (validators) => [...validators, exports.validateRequest],
    // Create a middleware for delete operations
    delete: (validators) => [...validators, exports.validateRequest],
    // Create a middleware for custom operations
    custom: (validators) => [...validators, exports.validateRequest],
};
exports.default = exports.validationMiddleware;
