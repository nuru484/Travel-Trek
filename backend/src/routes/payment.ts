import { Router } from 'express';
import {
  createPayment,
  handleWebhook,
  getPayment,
  getAllPayments,
} from '../controllers/index';

const paymentRoutes = Router();

// Create a new payment
paymentRoutes.post('/payments', createPayment);

// Handle Paystack webhook
paymentRoutes.post('/payments/webhook', handleWebhook);

// Get a single payment by ID
paymentRoutes.get('/payments/:id', getPayment);

// Get all payments
paymentRoutes.get('/payments', getAllPayments);

export default paymentRoutes;
