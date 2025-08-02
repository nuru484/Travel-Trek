"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authentication/login.ts
const express_1 = require("express");
const index_1 = require("../../controllers/authentication/index");
const loginRoutes = (0, express_1.Router)();
loginRoutes.post('/login', index_1.login);
exports.default = loginRoutes;
