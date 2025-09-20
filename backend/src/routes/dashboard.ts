import { Router } from 'express';
import { getDashboardStats } from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const dashboardRoutes = Router();

dashboardRoutes.use(
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
);

dashboardRoutes.get('/dashboard', getDashboardStats);

export default dashboardRoutes;
