// src/routes/reports.ts
import { Router } from 'express';
import {
  getMonthlyBookingsSummary,
  getPaymentsSummary,
  getTopToursByBookings,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const reportsRoutes = Router();

// Get monthly bookings summary report
reportsRoutes.get(
  '/reports/bookings/monthly-summary',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  getMonthlyBookingsSummary,
);

// Get payments summary report
reportsRoutes.get(
  '/reports/payments/summary',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  getPaymentsSummary,
);

// Get top tours by bookings report
reportsRoutes.get(
  '/reports/tours/top-by-bookings',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  getTopToursByBookings,
);

export default reportsRoutes;
