import { Router } from 'express';
import {
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
  getAllBookings,
  getUserBookings,
  deleteAllBookings,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const bookingRoutes = Router();

// Create a new booking
bookingRoutes.post(
  '/bookings',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  createBooking,
);

// Get a single booking by ID
bookingRoutes.get(
  '/bookings/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getBooking,
);

// Update a booking by ID
bookingRoutes.put(
  '/bookings/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  updateBooking,
);

// Delete a booking by ID
bookingRoutes.delete(
  '/bookings/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  deleteBooking,
);

// Get all bookings
bookingRoutes.get(
  '/bookings',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllBookings,
);

// Get all user bookings
bookingRoutes.get(
  '/bookings/user/:userId',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getUserBookings,
);

// Delete all bookings
bookingRoutes.delete(
  '/bookings',
  authorizeRole([UserRole.ADMIN]),
  deleteAllBookings,
);

export default bookingRoutes;
