import { Router } from 'express';
import {
  createTourInclusion,
  getTourInclusion,
  updateTourInclusion,
  deleteTourInclusion,
  getAllTourInclusions,
  deleteAllTourInclusions,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const tourInclusionRoutes = Router();

// Create a new tour inclusion
tourInclusionRoutes.post(
  '/tour-inclusions',
  authorizeRole([UserRole.ADMIN]),
  createTourInclusion,
);

// Get a single tour inclusion by ID
tourInclusionRoutes.get(
  '/tour-inclusions/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getTourInclusion,
);

// Update a tour inclusion by ID
tourInclusionRoutes.put(
  '/tour-inclusions/:id',
  authorizeRole([UserRole.ADMIN]),
  updateTourInclusion,
);

// Delete a tour inclusion by ID
tourInclusionRoutes.delete(
  '/tour-inclusions/:id',
  authorizeRole([UserRole.ADMIN]),
  deleteTourInclusion,
);

// Get all tour inclusions
tourInclusionRoutes.get(
  '/tour-inclusions',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllTourInclusions,
);

// Delete all tour inclusions
tourInclusionRoutes.delete(
  '/tour-inclusions',
  authorizeRole([UserRole.ADMIN]),
  deleteAllTourInclusions,
);

export default tourInclusionRoutes;
