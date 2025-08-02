"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const itineraryRoutes = (0, express_1.Router)();
// Create a new itinerary
itineraryRoutes.post('/itineraries', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.createItinerary);
// Get a single itinerary by ID
itineraryRoutes.get('/itineraries/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getItinerary);
// Update an itinerary by ID
itineraryRoutes.put('/itineraries/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.updateItinerary);
// Delete an itinerary by ID
itineraryRoutes.delete('/itineraries/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteItinerary);
// Get all itineraries
itineraryRoutes.get('/itineraries', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllItineraries);
// Delete all itineraries
itineraryRoutes.delete('/itineraries', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllItineraries);
exports.default = itineraryRoutes;
