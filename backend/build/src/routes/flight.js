"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const flightRoutes = (0, express_1.Router)();
// Create a new flight
flightRoutes.post('/flights', index_1.createFlight);
// Get a single flight by ID
flightRoutes.get('/flights/:id', index_1.getFlight);
// Update a flight by ID
flightRoutes.put('/flights/:id', index_1.updateFlight);
// Delete a flight by ID
flightRoutes.delete('/flights/:id', index_1.deleteFlight);
// Get all flights
flightRoutes.get('/flights', index_1.getAllFlights);
// Delete all flights
flightRoutes.delete('/flights', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllFlights);
exports.default = flightRoutes;
