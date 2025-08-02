import { Router } from 'express';
import {
  createTourExclusion,
  getTourExclusion,
  updateTourExclusion,
  deleteTourExclusion,
  getAllTourExclusions,
  deleteAllTourExclusions,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const tourExclusionRoutes = Router();

// Create a new tour exclusion
tourExclusionRoutes.post(
  '/tour-exclusions',
  authorizeRole([UserRole.ADMIN]),
  createTourExclusion,
);

// Get a single tour exclusion by ID
tourExclusionRoutes.get(
  '/tour-exclusions/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getTourExclusion,
);

// Update a tour exclusion by ID
tourExclusionRoutes.put(
  '/tour-exclusions/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  updateTourExclusion,
);

// Delete a tour exclusion by ID
tourExclusionRoutes.delete(
  '/tour-exclusions/:id',
  authorizeRole([UserRole.ADMIN]),
  deleteTourExclusion,
);

// Get all tour exclusions
tourExclusionRoutes.get(
  '/tour-exclusions',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllTourExclusions,
);

// Delete all tour exclusions
tourExclusionRoutes.delete(
  '/tour-exclusions',
  authorizeRole([UserRole.ADMIN]),
  deleteAllTourExclusions,
);

export default tourExclusionRoutes;
