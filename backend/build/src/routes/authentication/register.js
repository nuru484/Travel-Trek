"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authentication/register.ts
const express_1 = require("express");
const index_1 = require("../../controllers/authentication/index");
const registerRoutes = (0, express_1.Router)();
registerRoutes.post('/register-user', ...index_1.registerUser);
exports.default = registerRoutes;
