"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsValidation = exports.dateRangeFilterValidation = exports.bookingStatusFilterValidation = exports.paginationQueryValidation = exports.bookingIdParamValidation = exports.updateBookingValidation = exports.createBookingValidation = void 0;
// src/validations/bookingValidations.ts
const validation_factory_1 = require("./validation-factory");
// Validation for creating a new booking
exports.createBookingValidation = [
    // User ID validation
    validation_factory_1.validator.integer('userId', {
        required: true,
        min: 1,
    }),
    // Tour ID validation (optional)
    validation_factory_1.validator.integer('tourId', {
        required: false,
        min: 1,
    }),
    // Hotel ID validation (optional)
    validation_factory_1.validator.integer('hotelId', {
        required: false,
        min: 1,
    }),
    // Room ID validation (optional)
    validation_factory_1.validator.integer('roomId', {
        required: false,
        min: 1,
    }),
    // Flight ID validation (optional)
    validation_factory_1.validator.integer('flightId', {
        required: false,
        min: 1,
    }),
    // Total price validation
    validation_factory_1.validator.number('totalPrice', {
        required: true,
        min: 0,
        allowDecimals: true,
    }),
    // Custom validation to ensure at least one booking type is provided
    validation_factory_1.validator.custom('bookingType', (value, req) => {
        const { tourId, hotelId, roomId, flightId } = req.body;
        return !!(tourId || hotelId || roomId || flightId);
    }, 'At least one of tourId, hotelId, roomId, or flightId must be provided', { required: false }),
    // Custom validation to ensure room is associated with hotel if both are provided
    validation_factory_1.validator.custom('roomHotelConsistency', (value, req) => {
        const { hotelId, roomId } = req.body;
        // If roomId is provided but hotelId is not, it's invalid
        if (roomId && !hotelId) {
            return false;
        }
        return true;
    }, 'Hotel ID must be provided when Room ID is specified', { required: false }),
];
// Validation for updating an existing booking
exports.updateBookingValidation = [
    // User ID validation (optional for updates)
    validation_factory_1.validator.integer('userId', {
        required: false,
        min: 1,
    }),
    // Tour ID validation (optional)
    validation_factory_1.validator.integer('tourId', {
        required: false,
        min: 1,
    }),
    // Hotel ID validation (optional)
    validation_factory_1.validator.integer('hotelId', {
        required: false,
        min: 1,
    }),
    // Room ID validation (optional)
    validation_factory_1.validator.integer('roomId', {
        required: false,
        min: 1,
    }),
    // Flight ID validation (optional)
    validation_factory_1.validator.integer('flightId', {
        required: false,
        min: 1,
    }),
    // Total price validation (optional for updates)
    validation_factory_1.validator.number('totalPrice', {
        required: false,
        min: 0,
        allowDecimals: true,
    }),
    // Booking status validation (optional for updates)
    validation_factory_1.validator.enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
        required: false,
    }),
    // Custom validation to ensure room is associated with hotel if both are provided
    validation_factory_1.validator.custom('roomHotelConsistency', (value, req) => {
        const { hotelId, roomId } = req.body;
        // If roomId is provided but hotelId is not, it's invalid
        if (roomId && !hotelId) {
            return false;
        }
        return true;
    }, 'Hotel ID must be provided when Room ID is specified', { required: false }),
];
// Validation for booking ID parameter
exports.bookingIdParamValidation = [
    validation_factory_1.validator.integer('id', {
        required: true,
        min: 1,
    }),
];
// Validation for pagination query parameters
exports.paginationQueryValidation = [
    validation_factory_1.validator.integer('page', {
        required: false,
        min: 1,
    }),
    validation_factory_1.validator.integer('limit', {
        required: false,
        min: 1,
        max: 100, // Prevent excessive limit values
    }),
];
// Validation for booking status filter (for future use)
exports.bookingStatusFilterValidation = [
    validation_factory_1.validator.enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
        required: false,
    }),
];
// Validation for date range filter (for future use)
exports.dateRangeFilterValidation = [
    validation_factory_1.validator.date('startDate', {
        required: false,
        maxDate: new Date(), // Can't be in the future
    }),
    validation_factory_1.validator.date('endDate', {
        required: false,
        compareDateField: 'startDate',
        compareDateOperation: 'after-or-same',
    }),
];
// Combined validation for getting bookings with filters
exports.getBookingsValidation = [
    ...exports.paginationQueryValidation,
    ...exports.bookingStatusFilterValidation,
    ...exports.dateRangeFilterValidation,
];
