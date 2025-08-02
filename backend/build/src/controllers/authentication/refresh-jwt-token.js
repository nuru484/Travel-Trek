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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../config/env"));
const verify_jwt_token_1 = require("../../utils/verify-jwt-token");
const error_handler_1 = require("../../middlewares/error-handler");
const env_2 = require("../../config/env");
const CookieManager_1 = require("../../utils/CookieManager");
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
/**
 * Refreshes access token using a valid refresh token
 * @param req - Express request object with user and cookies
 * @param res - Express response object
 * @param next - Express next function
 */
const refreshToken = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    // Get refresh token from cookies
    const currentRefreshToken = CookieManager_1.CookieManager.getRefreshToken(req);
    if (!currentRefreshToken) {
        throw new error_handler_1.UnauthorizedError('Unauthorised, no refresh token provided', {
            layer: 'refreshToken',
        });
    }
    // Verify token and decode user
    let decodedUser;
    try {
        decodedUser = await (0, verify_jwt_token_1.verifyJwtToken)(currentRefreshToken, (0, env_2.assertEnv)(env_1.default.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'));
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new error_handler_1.UnauthorizedError('Unauthorised, refresh token expired. Please log in again.', {
                layer: 'refreshToken',
            });
        }
        throw new error_handler_1.CustomError(401, 'Invalid refresh token');
    }
    // Generate new refresh token
    const newRefreshToken = jsonwebtoken_1.default.sign({ id: decodedUser.id, role: decodedUser.role }, (0, env_2.assertEnv)(env_1.default.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'), { expiresIn: '7d' });
    // Generate new access token
    const newAccessToken = jsonwebtoken_1.default.sign({
        id: decodedUser.id,
        role: decodedUser.role,
    }, (0, env_2.assertEnv)(env_1.default.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'), { expiresIn: '15m' });
    CookieManager_1.CookieManager.clearAllTokens(res);
    CookieManager_1.CookieManager.setAccessToken(res, newAccessToken);
    CookieManager_1.CookieManager.setRefreshToken(res, newRefreshToken);
    const user = await prismaClient_1.default.user.findUnique({
        where: { id: parseInt(decodedUser.id, 10) },
    });
    if (!user) {
        throw new error_handler_1.NotFoundError('Invalid credentials');
    }
    const { password: userPassWord, ...userWithoutPassword } = user;
    // Send tokens in response
    res.status(200).json({
        message: 'Token refreshed successfully',
        user: userWithoutPassword,
    });
});
exports.default = refreshToken;
