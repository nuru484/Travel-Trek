"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/hotel.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const hotelRoutes = (0, express_1.Router)();
// Create a new hotel
hotelRoutes.post('/hotels', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.createHotel);
// Get a single hotel by ID
hotelRoutes.get('/hotels/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getHotel);
// Update a hotel by ID
hotelRoutes.put('/hotels/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.updateHotel);
// Delete a hotel by ID
hotelRoutes.delete('/hotels/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteHotel);
// Get all hotels
hotelRoutes.get('/hotels', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllHotels);
// Delete all hotels
hotelRoutes.delete('/hotels', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllHotels);
exports.default = hotelRoutes;
