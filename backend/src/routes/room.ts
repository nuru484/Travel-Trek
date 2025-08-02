import { Router } from 'express';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getAllRooms,
  deleteAllRooms,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const roomRoutes = Router();

// Create a new room
roomRoutes.post('/rooms', authorizeRole([UserRole.ADMIN]), createRoom);

// Get a single room by ID
roomRoutes.get(
  '/rooms/:id',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getRoom,
);

// Update a room by ID
roomRoutes.put('/rooms/:id', authorizeRole([UserRole.ADMIN]), updateRoom);

// Delete a room by ID
roomRoutes.delete('/rooms/:id', authorizeRole([UserRole.ADMIN]), deleteRoom);

// Get all rooms
roomRoutes.get(
  '/rooms',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getAllRooms,
);

// Delete all rooms
roomRoutes.delete('/rooms', authorizeRole([UserRole.ADMIN]), deleteAllRooms);

export default roomRoutes;
