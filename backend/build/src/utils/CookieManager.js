"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieManager = void 0;
const env_1 = __importDefault(require("../config/env"));
const error_handler_1 = require("../middlewares/error-handler");
/**
 * A utility class for managing HTTP cookies in an Express application.
 * Provides methods to set, get, clear, and configure access and refresh token cookies with secure defaults.
 */
class CookieManager {
    // Default options that apply to all cookies
    static defaultOptions = {
        httpOnly: true,
        secure: env_1.default.NODE_ENV === 'production',
        domain: env_1.default.COOKIE_DOMAIN || undefined,
        sameSite: 'lax',
        path: '/',
    };
    // Specific configurations for different token types
    static tokenConfigs = {
        accessToken: {
            ...CookieManager.defaultOptions,
        },
        refreshToken: {
            ...CookieManager.defaultOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
    };
    /**
     * Sets an HTTP cookie for an access token with a 15-minute expiration.
     * @param res - The Express response object used to set the cookie.
     * @param token - The access token string to store in the cookie.
     */
    static setAccessToken(res, token) {
        this.setCookie(res, 'accessToken', token, this.tokenConfigs.accessToken);
    }
    /**
     * Sets an HTTP cookie for a refresh token with a 7-day expiration.
     * @param res - The Express response object used to set the cookie.
     * @param token - The refresh token string to store in the cookie.
     */
    static setRefreshToken(res, token) {
        this.setCookie(res, 'refreshToken', token, this.tokenConfigs.refreshToken);
    }
    /**
     * Clears a specified authentication token cookie by setting its expiration to 0.
     * @param res - The Express response object used to clear the cookie.
     * @param tokenName - The name of the token cookie to clear ('accessToken' or 'refreshToken').
     */
    static clearToken(res, tokenName) {
        this.setCookie(res, tokenName, '', {
            ...this.defaultOptions,
            maxAge: 0,
        });
    }
    /**
     * Clears both access and refresh token cookies.
     * @param res - The Express response object used to clear the cookies.
     */
    static clearAllTokens(res) {
        this.clearToken(res, 'accessToken');
        this.clearToken(res, 'refreshToken');
    }
    /**
     * Sets a generic HTTP cookie with the specified name, value, and options.
     * @param res - The Express response object used to set the cookie.
     * @param name - The name of the cookie.
     * @param value - The value to store in the cookie.
     * @param options - Optional cookie configuration (e.g., maxAge, httpOnly).
     */
    static setCookie(res, name, value, options = {}) {
        res.cookie(name, value, {
            ...this.defaultOptions,
            ...options,
        });
    }
    /**
     * Retrieves the access token from request cookies.
     * @param req - The Express request object containing the cookies.
     * @returns The access token string.
     * @throws UnauthorizedError if the access token is not found in the cookies.
     */
    static getAccessToken(req) {
        if (!req.cookies || !req.cookies.accessToken) {
            throw new error_handler_1.UnauthorizedError('Access token not found. Please login', {
                layer: 'jwt',
                code: 'MISSING_TOKEN',
                context: { token: null },
            });
        }
        return req.cookies.accessToken;
    }
    /**
     * Retrieves the refresh token from request cookies.
     * @param req - The Express request object containing the cookies.
     * @returns The refresh token string.
     * @throws UnauthorizedError if the refresh token is not found in the cookies.
     */
    static getRefreshToken(req) {
        if (!req.cookies || !req.cookies.refreshToken) {
            throw new error_handler_1.UnauthorizedError('Refresh token not found. Please login', {
                layer: 'jwt',
                code: 'MISSING_TOKEN',
                context: { token: null },
            });
        }
        return req.cookies.refreshToken;
    }
    /**
     * Retrieves a cookie by name from the request.
     * @param req - The Express request object containing the cookies.
     * @param name - The name of the cookie to retrieve.
     * @param required - If true, throws an error if the cookie is not found; otherwise, returns null.
     * @returns The cookie value as a string, or null if not found and not required.
     * @throws UnauthorizedError if the cookie is required but not found.
     */
    static getCookie(req, name, required = false) {
        const value = req.cookies?.[name] || null;
        if (required && !value) {
            throw new error_handler_1.UnauthorizedError(`Cookie ${name} not found`, {
                layer: 'cookie',
                code: 'MISSING_COOKIE',
                context: { cookieName: name },
            });
        }
        return value;
    }
}
exports.CookieManager = CookieManager;
