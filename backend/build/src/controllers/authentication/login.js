"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../config/env"));
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const error_handler_1 = require("../../middlewares/error-handler");
const env_2 = require("../../config/env");
const CookieManager_1 = require("../../utils/CookieManager");
const login = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    try {
        const { password, email } = req.body;
        const user = await prismaClient_1.default.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            throw new error_handler_1.NotFoundError('Invalid credentials');
        }
        if (!password || (user && !user.password)) {
            throw new Error('Password or hash missing');
        }
        const isPasswordValid = await (0, bcrypt_1.compare)(password, user.password);
        if (!isPasswordValid) {
            throw new error_handler_1.UnauthorizedError('Invalid credentials');
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id.toString(), role: user.role }, (0, env_2.assertEnv)(env_1.default.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'), { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id.toString(), role: user.role }, (0, env_2.assertEnv)(env_1.default.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'), {
            expiresIn: '7d',
        });
        CookieManager_1.CookieManager.clearAllTokens(res);
        CookieManager_1.CookieManager.setAccessToken(res, accessToken);
        CookieManager_1.CookieManager.setRefreshToken(res, refreshToken);
        const { password: userPassWord, ...userWithoutPassword } = user;
        res.json({ message: 'Login successful', user: userWithoutPassword });
    }
    catch (error) {
        next(error);
    }
});
exports.default = login;
