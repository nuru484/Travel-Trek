// src/validations/bookingValidations.ts
import { validator } from './validation-factory';
import { ValidationChain } from 'express-validator';

// Validation for creating a new booking
export const createBookingValidation: ValidationChain[] = [
  // User ID validation
  validator.integer('userId', {
    required: true,
    min: 1,
  }),

  // Tour ID validation (optional)
  validator.integer('tourId', {
    required: false,
    min: 1,
  }),

  // Hotel ID validation (optional)
  validator.integer('hotelId', {
    required: false,
    min: 1,
  }),

  // Room ID validation (optional)
  validator.integer('roomId', {
    required: false,
    min: 1,
  }),

  // Flight ID validation (optional)
  validator.integer('flightId', {
    required: false,
    min: 1,
  }),

  // Total price validation
  validator.number('totalPrice', {
    required: true,
    min: 0,
    allowDecimals: true,
  }),

  // Custom validation to ensure at least one booking type is provided
  validator.custom(
    'bookingType',
    (value, req) => {
      const { tourId, hotelId, roomId, flightId } = req.body;
      return !!(tourId || hotelId || roomId || flightId);
    },
    'At least one of tourId, hotelId, roomId, or flightId must be provided',
    { required: false },
  ),

  // Custom validation to ensure room is associated with hotel if both are provided
  validator.custom(
    'roomHotelConsistency',
    (value, req) => {
      const { hotelId, roomId } = req.body;
      // If roomId is provided but hotelId is not, it's invalid
      if (roomId && !hotelId) {
        return false;
      }
      return true;
    },
    'Hotel ID must be provided when Room ID is specified',
    { required: false },
  ),
];

// Validation for updating an existing booking
export const updateBookingValidation: ValidationChain[] = [
  // User ID validation (optional for updates)
  validator.integer('userId', {
    required: false,
    min: 1,
  }),

  // Tour ID validation (optional)
  validator.integer('tourId', {
    required: false,
    min: 1,
  }),

  // Hotel ID validation (optional)
  validator.integer('hotelId', {
    required: false,
    min: 1,
  }),

  // Room ID validation (optional)
  validator.integer('roomId', {
    required: false,
    min: 1,
  }),

  // Flight ID validation (optional)
  validator.integer('flightId', {
    required: false,
    min: 1,
  }),

  // Total price validation (optional for updates)
  validator.number('totalPrice', {
    required: false,
    min: 0,
    allowDecimals: true,
  }),

  // Booking status validation (optional for updates)
  validator.enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
    required: false,
  }),

  // Custom validation to ensure room is associated with hotel if both are provided
  validator.custom(
    'roomHotelConsistency',
    (value, req) => {
      const { hotelId, roomId } = req.body;
      // If roomId is provided but hotelId is not, it's invalid
      if (roomId && !hotelId) {
        return false;
      }
      return true;
    },
    'Hotel ID must be provided when Room ID is specified',
    { required: false },
  ),
];

// Validation for booking ID parameter
export const bookingIdParamValidation: ValidationChain[] = [
  validator.integer('id', {
    required: true,
    min: 1,
  }),
];

// Validation for pagination query parameters
export const paginationQueryValidation: ValidationChain[] = [
  validator.integer('page', {
    required: false,
    min: 1,
  }),

  validator.integer('limit', {
    required: false,
    min: 1,
    max: 100, // Prevent excessive limit values
  }),
];

// Validation for booking status filter (for future use)
export const bookingStatusFilterValidation: ValidationChain[] = [
  validator.enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
    required: false,
  }),
];

// Validation for date range filter (for future use)
export const dateRangeFilterValidation: ValidationChain[] = [
  validator.date('startDate', {
    required: false,
    maxDate: new Date(), // Can't be in the future
  }),

  validator.date('endDate', {
    required: false,
    compareDateField: 'startDate',
    compareDateOperation: 'after-or-same',
  }),
];

// Combined validation for getting bookings with filters
export const getBookingsValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  ...bookingStatusFilterValidation,
  ...dateRangeFilterValidation,
];
