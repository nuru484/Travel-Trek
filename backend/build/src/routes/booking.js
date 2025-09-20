"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const authorize_roles_1 = require("../middlewares/authorize-roles");
const user_profile_types_1 = require("../../types/user-profile.types");
const bookingRoutes = (0, express_1.Router)();
// Create a new booking
bookingRoutes.post('/bookings', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.createBooking);
// Get a single booking by ID
bookingRoutes.get('/bookings/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getBooking);
// Update a booking by ID
bookingRoutes.put('/bookings/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT]), index_1.updateBooking);
// Delete a booking by ID
bookingRoutes.delete('/bookings/:id', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT]), index_1.deleteBooking);
// Get all bookings
bookingRoutes.get('/bookings', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getAllBookings);
// Get all user bookings
bookingRoutes.get('/bookings/user/:userId', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN, user_profile_types_1.UserRole.AGENT, user_profile_types_1.UserRole.CUSTOMER]), index_1.getUserBookings);
// Delete all bookings
bookingRoutes.delete('/bookings', (0, authorize_roles_1.authorizeRole)([user_profile_types_1.UserRole.ADMIN]), index_1.deleteAllBookings);
exports.default = bookingRoutes;
