import { Router } from 'express';
import { getDashboardStats } from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const dashboardRoutes = Router();

dashboardRoutes.get(
  '/dashboard',
  authorizeRole([UserRole.CUSTOMER, UserRole.ADMIN, UserRole.AGENT]),
  getDashboardStats,
);

export default dashboardRoutes;
