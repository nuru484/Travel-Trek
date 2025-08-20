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
hotelRoutes.post('/hotels', createHotel);

// Get a single hotel by ID
hotelRoutes.get('/hotels/:id', getHotel);

// Update a hotel by ID
hotelRoutes.put('/hotels/:id', updateHotel);

// Delete a hotel by ID
hotelRoutes.delete('/hotels/:id', deleteHotel);

// Get all hotels
hotelRoutes.get('/hotels', getAllHotels);

// Delete all hotels
hotelRoutes.delete('/hotels', authorizeRole([UserRole.ADMIN]), deleteAllHotels);

export default hotelRoutes;
