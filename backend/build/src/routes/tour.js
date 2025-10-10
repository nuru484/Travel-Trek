"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const tourRoutes = (0, express_1.Router)();
// Create a new tour
tourRoutes.post('/tours', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), ...index_1.createTour);
// Get a single tour by ID
tourRoutes.get('/tours/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), ...index_1.getTour);
// Update a tour by ID
tourRoutes.put('/tours/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), ...index_1.updateTour);
// Delete a tour by ID
tourRoutes.delete('/tours/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), ...index_1.deleteTour);
// Get all tours
tourRoutes.get('/tours', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), ...index_1.getAllTours);
// Delete all tours
tourRoutes.delete('/tours', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllTours);
exports.default = tourRoutes;
