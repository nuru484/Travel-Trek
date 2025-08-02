"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const tourExclusionRoutes = (0, express_1.Router)();
// Create a new tour exclusion
tourExclusionRoutes.post('/tour-exclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.createTourExclusion);
// Get a single tour exclusion by ID
tourExclusionRoutes.get('/tour-exclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getTourExclusion);
// Update a tour exclusion by ID
tourExclusionRoutes.put('/tour-exclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.updateTourExclusion);
// Delete a tour exclusion by ID
tourExclusionRoutes.delete('/tour-exclusions/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteTourExclusion);
// Get all tour exclusions
tourExclusionRoutes.get('/tour-exclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllTourExclusions);
// Delete all tour exclusions
tourExclusionRoutes.delete('/tour-exclusions', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllTourExclusions);
exports.default = tourExclusionRoutes;
