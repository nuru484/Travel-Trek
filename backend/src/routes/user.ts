// src/routes/user.ts
import { Router } from 'express';
import {
  updateUserProfile,
  getAllUsers,
  changeUserRole,
  deleteUser,
  deleteAllUsers,
} from '../controllers/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const userRoutes = Router();

// Create a new tour
userRoutes.post(
  '/users/update-profile',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  updateUserProfile,
);

// Get all users with pagination
userRoutes.get('/users', authorizeRole([UserRole.ADMIN]), getAllUsers);

// Change user role
userRoutes.put(
  '/users/:userId/role',
  authorizeRole([UserRole.ADMIN]),
  changeUserRole,
);

// Delete a user
userRoutes.delete(
  '/users/:userId',
  authorizeRole([UserRole.ADMIN]),
  deleteUser,
);

// Delete all users
userRoutes.delete('/users', authorizeRole([UserRole.ADMIN]), deleteAllUsers);

export default userRoutes;
