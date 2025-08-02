"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const env_1 = __importDefault(require("../config/env"));
const error_handler_1 = require("../middlewares/error-handler");
const env_2 = require("../config/env");
const verify_jwt_token_1 = require("../utils/verify-jwt-token");
const CookieManager_1 = require("../utils/CookieManager");
const authenticateJWT = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const token = CookieManager_1.CookieManager.getAccessToken(req);
    // Check if token exists
    if (!token) {
        throw new error_handler_1.UnauthorizedError('Access token not found', {
            layer: 'jwt',
            code: 'MISSING_TOKEN',
            context: { token },
        });
    }
    try {
        const decodedUser = await (0, verify_jwt_token_1.verifyJwtToken)(token, (0, env_2.assertEnv)(env_1.default.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'));
        req.user = decodedUser;
        next();
    }
    catch (tokenError) {
        if (tokenError instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new error_handler_1.UnauthorizedError('Access token expired.', {
                layer: 'jwt',
                code: 'EXPIRED_TOKEN',
                context: { token },
            });
        }
        if (tokenError instanceof jsonwebtoken_1.JsonWebTokenError) {
            throw new error_handler_1.UnauthorizedError('Invalid access token. Please login again', {
                layer: 'jwt',
                code: 'INVALID_TOKEN',
                context: { token },
            });
        }
        throw tokenError;
    }
});
exports.default = authenticateJWT;
