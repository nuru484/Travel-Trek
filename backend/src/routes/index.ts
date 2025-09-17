import express from 'express';
import authenticateJWT from '../middlewares/authenticate-jwt';
import { authenticationRouter } from './authentication';
import tourRoutes from './tour';
import destinationRoutes from './destination';
import hotelRoutes from './hotel';
import flightRoutes from './flight';
import bookingRoutes from './booking';
import paymentRoutes from './payment';
import roomRoutes from './room';
import itineraryRoutes from './itinerary';
import tourInclusionRoutes from './tourInclusion';
import userRoutes from './user';
import dashboardRoutes from './dashboard';

const routes = express.Router();

// Authentication routes
routes.use('/', authenticationRouter);
// Tour routes
routes.use(authenticateJWT, tourRoutes);
// Destination routes
routes.use(authenticateJWT, destinationRoutes);
// Hotel routes
routes.use(authenticateJWT, hotelRoutes);
// Flight routes
routes.use(authenticateJWT, flightRoutes);
// Booking routes
routes.use(authenticateJWT, bookingRoutes);
// Payment routes
routes.use(authenticateJWT, paymentRoutes);
// Room routes
routes.use(authenticateJWT, roomRoutes);
// Itinerary routes
routes.use(authenticateJWT, itineraryRoutes);
// Tour Inclusion routes
routes.use(authenticateJWT, tourInclusionRoutes);
// User routes
routes.use(authenticateJWT, userRoutes);

// Dashboard routes
routes.use(authenticateJWT, dashboardRoutes);

export default routes;
