// src/routes/hotel.ts
import { Router } from 'express';
import {
  createHotel,
  getHotel,
  updateHotel,
  deleteHotel,
  getAllHotels,
  deleteAllHotels,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const hotelRoutes = Router();

// Create a new hotel
hotelRoutes.post('/hotels', authorizeRole([UserRole.ADMIN]), createHotel);

// Get a single hotel by ID
hotelRoutes.get(
  '/hotels/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getHotel,
);

// Update a hotel by ID
hotelRoutes.put('/hotels/:id', authorizeRole([UserRole.ADMIN]), updateHotel);

// Delete a hotel by ID
hotelRoutes.delete('/hotels/:id', authorizeRole([UserRole.ADMIN]), deleteHotel);

// Get all hotels
hotelRoutes.get(
  '/hotels',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllHotels,
);

// Delete all hotels
hotelRoutes.delete('/hotels', authorizeRole([UserRole.ADMIN]), deleteAllHotels);

export default hotelRoutes;
