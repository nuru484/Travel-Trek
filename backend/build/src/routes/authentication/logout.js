"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authentication/logout.ts
const express_1 = require("express");
const index_1 = require("../../controllers/authentication/index");
const logoutRoutes = (0, express_1.Router)();
logoutRoutes.post('/logout', index_1.logout);
exports.default = logoutRoutes;
