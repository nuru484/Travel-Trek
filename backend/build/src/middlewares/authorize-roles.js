"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = void 0;
const error_handler_1 = require("./error-handler");
const error_handler_2 = require("./error-handler");
/**
 * Role-based authorization middleware
 *
 * @param allowedRoles - Array of roles that are permitted to access the route
 * @returns Express middleware function that validates user roles
 * @throws ForbiddenError if user's role is not in the allowed roles
 */
const authorizeRole = (allowedRoles) => (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    // Verify user object exists
    if (!req.user) {
        throw new error_handler_2.ForbiddenError('Unauthorized: User not authenticated');
    }
    // Verify role exists
    if (!req.user.role) {
        throw new error_handler_2.ForbiddenError('Unauthorized: User role not defined');
    }
    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
        throw new error_handler_2.ForbiddenError();
    }
    // User is authorized
    next();
});
exports.authorizeRole = authorizeRole;
