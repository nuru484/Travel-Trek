import { Router } from 'express';
import { getDashboardStats } from '../controllers/index';

const dashboardRoutes = Router();

dashboardRoutes.get('/dashboard', getDashboardStats);

export default dashboardRoutes;
