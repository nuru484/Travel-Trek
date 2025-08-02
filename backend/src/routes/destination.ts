import { Router } from 'express';
import {
  createDestination,
  getDestination,
  updateDestination,
  deleteDestination,
  getAllDestinations,
  deleteAllDestinations,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const destinationRoutes = Router();

// Create a new destination
destinationRoutes.post('/destinations', createDestination);

// Get a single destination by ID
destinationRoutes.get('/destinations/:id', getDestination);

// Update a destination by ID
destinationRoutes.put('/destinations/:id', updateDestination);

// Delete a destination by ID
destinationRoutes.delete('/destinations/:id', deleteDestination);

// Get all destinations
destinationRoutes.get('/destinations', getAllDestinations);

// Delete all destinations
destinationRoutes.delete(
  '/destinations',
  authorizeRole([UserRole.ADMIN]),
  deleteAllDestinations,
);

export default destinationRoutes;
