"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../../controllers/authentication/index");
const verify_access_token_1 = require("../../middlewares/verify-access-token");
const refreshRoutes = (0, express_1.Router)();
refreshRoutes.post('/refresh-token', verify_access_token_1.verifyAccessToken, index_1.refreshToken);
exports.default = refreshRoutes;
