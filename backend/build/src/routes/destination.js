"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const destinationRoutes = (0, express_1.Router)();
// Create a new destination
destinationRoutes.post('/destinations', index_1.createDestination);
// Get a single destination by ID
destinationRoutes.get('/destinations/:id', index_1.getDestination);
// Update a destination by ID
destinationRoutes.put('/destinations/:id', index_1.updateDestination);
// Delete a destination by ID
destinationRoutes.delete('/destinations/:id', index_1.deleteDestination);
// Get all destinations
destinationRoutes.get('/destinations', index_1.getAllDestinations);
// Delete all destinations
destinationRoutes.delete('/destinations', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllDestinations);
exports.default = destinationRoutes;
