"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationRouter = void 0;
// src/routes/authentication/index.ts
const express_1 = require("express");
const register_1 = __importDefault(require("./register"));
const login_1 = __importDefault(require("./login"));
const refresh_token_1 = __importDefault(require("./refresh-token"));
const logout_1 = __importDefault(require("./logout"));
const authenticationRouter = (0, express_1.Router)();
exports.authenticationRouter = authenticationRouter;
authenticationRouter.use('/auth', register_1.default);
authenticationRouter.use('/auth', login_1.default);
authenticationRouter.use('/auth', refresh_token_1.default);
authenticationRouter.use('/auth', logout_1.default);
