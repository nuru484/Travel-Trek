"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetLimiter = exports.rateLimiter = exports.createRateLimiter = exports.RateLimitExceededError = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const error_handler_1 = require("./error-handler");
// Custom rate limit exceeded error
class RateLimitExceededError extends error_handler_1.CustomError {
    constructor(message = 'Rate limit exceeded') {
        super(429, message, {
            layer: 'middleware',
            severity: error_handler_1.ErrorSeverity.MEDIUM,
            code: 'RATE_LIMIT_EXCEEDED',
        });
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
// Create enhanced memory-based rate limiter
const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests, please try again later.') => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        // Advanced key generation - combine IP with user ID when available
        keyGenerator: (req) => {
            const ipKey = (0, express_rate_limit_1.ipKeyGenerator)(req.ip ?? ''); // Use ipKeyGenerator for normalized IP
            const userId = req.user?.id ? `-user-${req.user.id}` : '';
            return `${ipKey}${userId}`;
        },
        // Custom handler for rate limit exceeded
        handler: (_req, res, next) => {
            const retryAfter = Math.ceil(windowMs / 1000);
            res.set('Retry-After', String(retryAfter));
            next(new RateLimitExceededError(message));
        },
        // Skip rate limiting for certain requests
        skip: (req) => {
            // Skip health checks
            if (req.path === '/health' || req.path === '/ping')
                return true;
            // Skip for internal requests with secret header
            const bypassToken = req.get('X-Rate-Limit-Bypass');
            return bypassToken === process.env.RATE_LIMIT_BYPASS_SECRET;
        },
        // Enable trust proxy on your Express app instance for proper IP handling behind proxies
        // (Set app.set('trust proxy', true) in your main server file)
    });
};
exports.createRateLimiter = createRateLimiter;
// Different limiters for different endpoints
exports.rateLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, // 15 minutes
100, // 100 requests
'Too many authentication attempts, please try again later.');
exports.passwordResetLimiter = (0, exports.createRateLimiter)(60 * 60 * 1000, // 1 hour
5, // 5 requests
'Too many password reset attempts, please try again later.');
exports.default = exports.rateLimiter;
