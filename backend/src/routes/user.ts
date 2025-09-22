// src/routes/user.ts
import { Router } from 'express';
import {
  updateUserProfile,
  getAllUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  deleteAllUsers,
} from '../controllers/index';
import { registerUser } from '../controllers/authentication/index';
import { authorizeRole } from '../middlewares/authorize-roles';
import { UserRole } from '../../types/user-profile.types';

const userRoutes = Router();

userRoutes.post(
  '/users',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  ...registerUser,
);

// Update user profile
userRoutes.put(
  '/users/:userId',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  updateUserProfile,
);

// Get all users with pagination
userRoutes.get(
  '/users',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT]),
  getAllUsers,
);

userRoutes.get(
  '/users/:userId',
  authorizeRole([UserRole.ADMIN, UserRole.AGENT, UserRole.CUSTOMER]),
  getUserById,
);

// Change user role
userRoutes.patch(
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
