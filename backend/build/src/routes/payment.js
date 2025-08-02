"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const paymentRoutes = (0, express_1.Router)();
// Create a new payment
paymentRoutes.post('/payments', index_1.createPayment);
// Handle Paystack webhook
paymentRoutes.post('/payments/webhook', index_1.handleWebhook);
// Get a single payment by ID
paymentRoutes.get('/payments/:id', index_1.getPayment);
// Get all payments
paymentRoutes.get('/payments', index_1.getAllPayments);
exports.default = paymentRoutes;
