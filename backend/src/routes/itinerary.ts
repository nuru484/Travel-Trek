import { Router } from 'express';
import {
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  getAllItineraries,
  deleteAllItineraries,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const itineraryRoutes = Router();

// Create a new itinerary
itineraryRoutes.post(
  '/itineraries',
  authorizeRole([UserRole.ADMIN]),
  createItinerary,
);

// Get a single itinerary by ID
itineraryRoutes.get(
  '/itineraries/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getItinerary,
);

// Update an itinerary by ID
itineraryRoutes.put(
  '/itineraries/:id',
  authorizeRole([UserRole.ADMIN]),
  updateItinerary,
);

// Delete an itinerary by ID
itineraryRoutes.delete(
  '/itineraries/:id',
  authorizeRole([UserRole.ADMIN]),
  deleteItinerary,
);

// Get all itineraries
itineraryRoutes.get(
  '/itineraries',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllItineraries,
);

// Delete all itineraries
itineraryRoutes.delete(
  '/itineraries',
  authorizeRole([UserRole.ADMIN]),
  deleteAllItineraries,
);

export default itineraryRoutes;
