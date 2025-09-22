"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const index_2 = require("../controllers/authentication/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const userRoutes = (0, express_1.Router)();
userRoutes.post('/users', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT]), ...index_2.registerUser);
// Update user profile
userRoutes.put('/users/:userId', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.updateUserProfile);
// Get all users with pagination
userRoutes.get('/users', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT]), index_1.getAllUsers);
userRoutes.get('/users/:userId', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getUserById);
// Change user role
userRoutes.patch('/users/:userId/role', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.changeUserRole);
// Delete a user
userRoutes.delete('/users/:userId', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteUser);
// Delete all users
userRoutes.delete('/users', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllUsers);
exports.default = userRoutes;
