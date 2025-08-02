"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const tourInclusionRoutes = (0, express_1.Router)();
// Create a new tour inclusion
tourInclusionRoutes.post('/tour-inclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.createTourInclusion);
// Get a single tour inclusion by ID
tourInclusionRoutes.get('/tour-inclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getTourInclusion);
// Update a tour inclusion by ID
tourInclusionRoutes.put('/tour-inclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.updateTourInclusion);
// Delete a tour inclusion by ID
tourInclusionRoutes.delete('/tour-inclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteTourInclusion);
// Get all tour inclusions
tourInclusionRoutes.get('/tour-inclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllTourInclusions);
// Delete all tour inclusions
tourInclusionRoutes.delete('/tour-inclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllTourInclusions);
exports.default = tourInclusionRoutes;
