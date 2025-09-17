import {
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getAllTours,
  deleteAllTours,
} from './tourController';
import {
  createDestination,
  getDestination,
  updateDestination,
  deleteDestination,
  getAllDestinations,
  deleteAllDestinations,
} from './destinationController';
import {
  createHotel,
  getHotel,
  updateHotel,
  deleteHotel,
  getAllHotels,
  deleteAllHotels,
} from './hotelController';
import {
  createFlight,
  getFlight,
  updateFlight,
  deleteFlight,
  getAllFlights,
  deleteAllFlights,
} from './flightController';

import {
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
  getAllBookings,
  deleteAllBookings,
} from './bookingController';

import {
  createPayment,
  handleCallback,
  handleWebhook,
  getPayment,
  getAllPayments,
} from './paymentController';

import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getAllRooms,
  deleteAllRooms,
} from './roomController';

import {
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  getAllItineraries,
  deleteAllItineraries,
} from './itineraryController';

import {
  createTourInclusion,
  getTourInclusion,
  updateTourInclusion,
  deleteTourInclusion,
  getAllTourInclusions,
  deleteAllTourInclusions,
} from './tourInclusionController';

import {
  createTourExclusion,
  getTourExclusion,
  updateTourExclusion,
  deleteTourExclusion,
  getAllTourExclusions,
  deleteAllTourExclusions,
} from './tourExclusionController';

import {
  updateUserProfile,
  getAllUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  deleteAllUsers,
} from './userController';
import { getDashboardStats } from './dashboardController';

export {
  // Tour controllers
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getAllTours,
  deleteAllTours,

  // Destination controllers
  createDestination,
  getDestination,
  updateDestination,
  deleteDestination,
  getAllDestinations,
  deleteAllDestinations,

  // Hotel controllers
  createHotel,
  getHotel,
  updateHotel,
  deleteHotel,
  getAllHotels,
  deleteAllHotels,

  // Flight controllers
  createFlight,
  getFlight,
  updateFlight,
  deleteFlight,
  getAllFlights,
  deleteAllFlights,

  // Booking controllers
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
  getAllBookings,
  deleteAllBookings,

  // Payment controllers
  createPayment,
  handleCallback,
  handleWebhook,
  getPayment,
  getAllPayments,

  // Room controllers
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getAllRooms,
  deleteAllRooms,

  // Itinerary controllers
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  getAllItineraries,
  deleteAllItineraries,

  // Tour Inclusion controllers
  createTourInclusion,
  getTourInclusion,
  updateTourInclusion,
  deleteTourInclusion,
  getAllTourInclusions,
  deleteAllTourInclusions,

  // Tour Exclusion controllers
  createTourExclusion,
  getTourExclusion,
  updateTourExclusion,
  deleteTourExclusion,
  getAllTourExclusions,
  deleteAllTourExclusions,

  // User controllers
  updateUserProfile,
  getAllUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  deleteAllUsers,

  // Dashboard controller
  getDashboardStats,
};
