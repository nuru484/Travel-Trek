"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = void 0;
const env_1 = __importDefault(require("../config/env"));
const env_2 = require("../config/env");
const verify_jwt_token_1 = require("../utils/verify-jwt-token");
const CookieManager_1 = require("../utils/CookieManager");
const verifyAccessToken = async (req, res, next) => {
    const accessToken = CookieManager_1.CookieManager.getAccessToken(req);
    if (!accessToken) {
        return next();
    }
    try {
        const decoded = await (0, verify_jwt_token_1.verifyJwtToken)(accessToken, (0, env_2.assertEnv)(env_1.default.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'));
        req.user = decoded;
        next();
    }
    catch (error) {
        next();
    }
};
exports.verifyAccessToken = verifyAccessToken;
