"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const roomRoutes = (0, express_1.Router)();
// Create a new room
roomRoutes.post('/rooms', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.createRoom);
// Get a single room by ID
roomRoutes.get('/rooms/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getRoom);
// Update a room by ID
roomRoutes.put('/rooms/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.updateRoom);
// Delete a room by ID
roomRoutes.delete('/rooms/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteRoom);
// Get all rooms
roomRoutes.get('/rooms', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllRooms);
// Delete all rooms
roomRoutes.delete('/rooms', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllRooms);
exports.default = roomRoutes;
