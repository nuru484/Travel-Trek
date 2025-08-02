"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllBookings = exports.getAllBookings = exports.deleteBooking = exports.updateBooking = exports.getBooking = exports.createBooking = void 0;
const express_validator_1 = require("express-validator");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const validation_1 = __importDefault(require("../middlewares/validation"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const bookingValidations_1 = require("../validations/bookingValidations");
/**
 * Create a new booking
 */
const handleCreateBooking = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId, tourId, hotelId, roomId, flightId, totalPrice } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    // Only CUSTOMER can book for themselves, ADMIN/AGENT can book for any user
    if (user.role === 'CUSTOMER' && user.id !== userId.toString()) {
        throw new error_handler_1.UnauthorizedError('Customers can only book for themselves');
    }
    // Validate referenced IDs
    if (tourId) {
        const tour = await prismaClient_1.default.tour.findUnique({ where: { id: tourId } });
        if (!tour)
            throw new error_handler_1.NotFoundError('Tour not found');
    }
    if (hotelId) {
        const hotel = await prismaClient_1.default.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel)
            throw new error_handler_1.NotFoundError('Hotel not found');
    }
    if (roomId) {
        const room = await prismaClient_1.default.room.findUnique({ where: { id: roomId } });
        if (!room)
            throw new error_handler_1.NotFoundError('Room not found');
        if (!room.available)
            throw new error_handler_1.NotFoundError('Room is not available');
    }
    if (flightId) {
        const flight = await prismaClient_1.default.flight.findUnique({
            where: { id: flightId },
        });
        if (!flight)
            throw new error_handler_1.NotFoundError('Flight not found');
        if (flight.seatsAvailable <= 0)
            throw new error_handler_1.NotFoundError('No seats available on this flight');
    }
    // Ensure user exists
    const targetUser = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
    if (!targetUser)
        throw new error_handler_1.NotFoundError('User not found');
    const booking = await prismaClient_1.default.booking.create({
        data: {
            user: { connect: { id: userId } },
            tour: tourId ? { connect: { id: tourId } } : undefined,
            hotel: hotelId ? { connect: { id: hotelId } } : undefined,
            room: roomId ? { connect: { id: roomId } } : undefined,
            flight: flightId ? { connect: { id: flightId } } : undefined,
            totalPrice,
            status: 'PENDING',
        },
    });
    const response = {
        id: booking.id,
        userId: booking.userId,
        tourId: booking.tourId,
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        flightId: booking.flightId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Booking created successfully',
        data: response,
    });
});
/**
 * Get a single booking by ID
 */
const handleGetBooking = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    const booking = await prismaClient_1.default.booking.findUnique({
        where: { id: parseInt(id) },
    });
    if (!booking) {
        throw new error_handler_1.NotFoundError('Booking not found');
    }
    // Customers can only view their own bookings
    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
        throw new error_handler_1.UnauthorizedError('You can only view your own bookings');
    }
    const response = {
        id: booking.id,
        userId: booking.userId,
        tourId: booking.tourId,
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        flightId: booking.flightId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Booking retrieved successfully',
        data: response,
    });
});
/**
 * Update a booking
 */
const handleUpdateBooking = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { userId, tourId, hotelId, roomId, flightId, totalPrice, status } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update bookings');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Booking ID is required');
    }
    const booking = await prismaClient_1.default.booking.findUnique({
        where: { id: parseInt(id) },
    });
    if (!booking) {
        throw new error_handler_1.NotFoundError('Booking not found');
    }
    // Validate updated referenced IDs
    if (userId) {
        const targetUser = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!targetUser)
            throw new error_handler_1.NotFoundError('User not found');
    }
    if (tourId) {
        const tour = await prismaClient_1.default.tour.findUnique({ where: { id: tourId } });
        if (!tour)
            throw new error_handler_1.NotFoundError('Tour not found');
    }
    if (hotelId) {
        const hotel = await prismaClient_1.default.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel)
            throw new error_handler_1.NotFoundError('Hotel not found');
    }
    if (roomId) {
        const room = await prismaClient_1.default.room.findUnique({ where: { id: roomId } });
        if (!room)
            throw new error_handler_1.NotFoundError('Room not found');
        if (!room.available)
            throw new error_handler_1.NotFoundError('Room is not available');
    }
    if (flightId) {
        const flight = await prismaClient_1.default.flight.findUnique({
            where: { id: flightId },
        });
        if (!flight)
            throw new error_handler_1.NotFoundError('Flight not found');
        if (flight.seatsAvailable <= 0)
            throw new error_handler_1.NotFoundError('No seats available on this flight');
    }
    const updatedBooking = await prismaClient_1.default.booking.update({
        where: { id: parseInt(id) },
        data: {
            user: userId ? { connect: { id: userId } } : undefined,
            tour: tourId ? { connect: { id: tourId } } : undefined,
            hotel: hotelId ? { connect: { id: hotelId } } : undefined,
            room: roomId ? { connect: { id: roomId } } : undefined,
            flight: flightId ? { connect: { id: flightId } } : undefined,
            totalPrice: totalPrice ?? booking.totalPrice,
            status: status ?? booking.status,
        },
    });
    const response = {
        id: updatedBooking.id,
        userId: updatedBooking.userId,
        tourId: updatedBooking.tourId,
        hotelId: updatedBooking.hotelId,
        roomId: updatedBooking.roomId,
        flightId: updatedBooking.flightId,
        status: updatedBooking.status,
        totalPrice: updatedBooking.totalPrice,
        bookingDate: updatedBooking.bookingDate,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Booking updated successfully',
        data: response,
    });
});
/**
 * Delete a booking
 */
const handleDeleteBooking = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete bookings');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Booking ID is required');
    }
    const booking = await prismaClient_1.default.booking.findUnique({
        where: { id: parseInt(id) },
    });
    if (!booking) {
        throw new error_handler_1.NotFoundError('Booking not found');
    }
    await prismaClient_1.default.booking.delete({
        where: { id: parseInt(id) },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Booking deleted successfully',
    });
});
/**
 * Get all bookings with pagination
 */
const handleGetAllBookings = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    const where = user.role === 'CUSTOMER' ? { userId: parseInt(user.id) } : {};
    const [bookings, total] = await Promise.all([
        prismaClient_1.default.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.booking.count({ where }),
    ]);
    const response = bookings.map((booking) => ({
        id: booking.id,
        userId: booking.userId,
        tourId: booking.tourId,
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        flightId: booking.flightId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Bookings retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
/**
 * Delete all bookings
 */
const handleDeleteAllBookings = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all bookings');
    }
    await prismaClient_1.default.booking.deleteMany({});
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All bookings deleted successfully',
    });
});
// Middleware arrays with validations
exports.createBooking = [
    ...validation_1.default.create(bookingValidations_1.createBookingValidation),
    handleCreateBooking,
];
exports.getBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetBooking,
];
exports.updateBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create(bookingValidations_1.updateBookingValidation),
    handleUpdateBooking,
];
exports.deleteBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleDeleteBooking,
];
exports.getAllBookings = [
    ...validation_1.default.create(bookingValidations_1.getBookingsValidation),
    handleGetAllBookings,
];
exports.deleteAllBookings = [handleDeleteAllBookings];
