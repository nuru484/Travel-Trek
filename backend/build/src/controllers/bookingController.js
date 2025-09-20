"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllBookings = exports.getAllBookings = exports.getUserBookings = exports.deleteBooking = exports.updateBooking = exports.getBooking = exports.createBooking = void 0;
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
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            tour: {
                select: { id: true, name: true, description: true },
            },
            hotel: {
                select: { id: true, name: true, description: true },
            },
            room: {
                select: { id: true, roomType: true, description: true },
            },
            flight: {
                select: { id: true, flightNumber: true, airline: true },
            },
            payment: {
                select: { id: true, amount: true, status: true, paymentMethod: true },
            },
        },
    });
    // Normalize into discriminated union
    let response;
    if (booking.tour) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'TOUR',
            tour: booking.tour,
            hotel: null,
            room: null,
            flight: null,
        };
    }
    else if (booking.hotel) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'HOTEL',
            hotel: booking.hotel,
            room: booking.room ?? null,
            tour: null,
            flight: null,
        };
    }
    else if (booking.flight) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'FLIGHT',
            flight: booking.flight,
            tour: null,
            hotel: null,
            room: null,
        };
    }
    else {
        throw new Error('Booking has no associated item (tour, hotel, or flight)');
    }
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Booking created successfully',
        data: response,
    });
});
// Middleware arrays with validations
exports.createBooking = [
    ...validation_1.default.create(bookingValidations_1.createBookingValidation),
    handleCreateBooking,
];
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
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            tour: {
                select: { id: true, name: true, description: true },
            },
            hotel: {
                select: { id: true, name: true, description: true },
            },
            room: {
                select: { id: true, roomType: true, description: true },
            },
            flight: {
                select: { id: true, flightNumber: true, airline: true },
            },
            payment: {
                select: { id: true, amount: true, status: true, paymentMethod: true },
            },
        },
    });
    if (!booking) {
        throw new error_handler_1.NotFoundError('Booking not found');
    }
    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
        throw new error_handler_1.UnauthorizedError('You can only view your own bookings');
    }
    // Normalize into discriminated union
    let response;
    if (booking.tour) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'TOUR',
            tour: booking.tour,
            hotel: null,
            room: null,
            flight: null,
        };
    }
    else if (booking.hotel) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'HOTEL',
            hotel: booking.hotel,
            room: booking.room ?? null,
            tour: null,
            flight: null,
        };
    }
    else if (booking.flight) {
        response = {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'FLIGHT',
            flight: booking.flight,
            tour: null,
            hotel: null,
            room: null,
        };
    }
    else {
        throw new Error('Booking has no associated item (tour, hotel, or flight)');
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Booking retrieved successfully',
        data: response,
    });
});
exports.getBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetBooking,
];
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
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            tour: {
                select: { id: true, name: true, description: true },
            },
            hotel: {
                select: { id: true, name: true, description: true },
            },
            room: {
                select: { id: true, roomType: true, description: true },
            },
            flight: {
                select: { id: true, flightNumber: true, airline: true },
            },
            payment: {
                select: { id: true, amount: true, status: true, paymentMethod: true },
            },
        },
    });
    // Normalize into discriminated union
    let response;
    if (updatedBooking.tour) {
        response = {
            id: updatedBooking.id,
            userId: updatedBooking.userId,
            user: updatedBooking.user,
            payment: updatedBooking.payment,
            status: updatedBooking.status,
            totalPrice: updatedBooking.totalPrice,
            bookingDate: updatedBooking.bookingDate,
            createdAt: updatedBooking.createdAt,
            updatedAt: updatedBooking.updatedAt,
            type: 'TOUR',
            tour: updatedBooking.tour,
            hotel: null,
            room: null,
            flight: null,
        };
    }
    else if (updatedBooking.hotel) {
        response = {
            id: updatedBooking.id,
            userId: updatedBooking.userId,
            user: updatedBooking.user,
            payment: updatedBooking.payment,
            status: updatedBooking.status,
            totalPrice: updatedBooking.totalPrice,
            bookingDate: updatedBooking.bookingDate,
            createdAt: updatedBooking.createdAt,
            updatedAt: updatedBooking.updatedAt,
            type: 'HOTEL',
            hotel: updatedBooking.hotel,
            room: updatedBooking.room ?? null,
            tour: null,
            flight: null,
        };
    }
    else if (updatedBooking.flight) {
        response = {
            id: updatedBooking.id,
            userId: updatedBooking.userId,
            user: updatedBooking.user,
            payment: updatedBooking.payment,
            status: updatedBooking.status,
            totalPrice: updatedBooking.totalPrice,
            bookingDate: updatedBooking.bookingDate,
            createdAt: updatedBooking.createdAt,
            updatedAt: updatedBooking.updatedAt,
            type: 'FLIGHT',
            flight: updatedBooking.flight,
            tour: null,
            hotel: null,
            room: null,
        };
    }
    else {
        throw new Error('Booking has no associated item (tour, hotel, or flight)');
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Booking updated successfully',
        data: response,
    });
});
exports.updateBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create(bookingValidations_1.updateBookingValidation),
    handleUpdateBooking,
];
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
exports.deleteBooking = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Booking ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleDeleteBooking,
];
/**
 * Get all bookings for a specific user
 */
const handleGetUserBookings = (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    // Customers can only view their own bookings
    if (user.role === 'CUSTOMER' && user.id !== userId) {
        throw new error_handler_1.UnauthorizedError('You can only view your own bookings');
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Optional filters
    const status = req.query.status;
    const bookingType = req.query.type;
    const search = req.query.search;
    const tourId = req.query.tourId;
    const hotelId = req.query.hotelId;
    const flightId = req.query.flightId;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    // Build where clause
    const whereClause = {
        userId: parseInt(userId),
    };
    if (status) {
        whereClause.status = status;
    }
    if (tourId) {
        whereClause.tourId = parseInt(tourId);
    }
    if (hotelId) {
        whereClause.hotelId = parseInt(hotelId);
    }
    if (flightId) {
        whereClause.flightId = parseInt(flightId);
    }
    if (fromDate && toDate) {
        whereClause.bookingDate = {
            gte: new Date(fromDate),
            lte: new Date(toDate),
        };
    }
    else if (fromDate) {
        whereClause.bookingDate = {
            gte: new Date(fromDate),
        };
    }
    else if (toDate) {
        whereClause.bookingDate = {
            lte: new Date(toDate),
        };
    }
    // Handle booking type filter
    if (bookingType === 'TOUR') {
        whereClause.tourId = { not: null };
    }
    else if (bookingType === 'HOTEL') {
        whereClause.hotelId = { not: null };
    }
    else if (bookingType === 'FLIGHT') {
        whereClause.flightId = { not: null };
    }
    // Handle search across related entities
    if (search) {
        whereClause.OR = [
            {
                tour: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                tour: {
                    description: { contains: search, mode: 'insensitive' },
                },
            },
            {
                hotel: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                hotel: {
                    description: { contains: search, mode: 'insensitive' },
                },
            },
            {
                flight: {
                    flightNumber: { contains: search, mode: 'insensitive' },
                },
            },
            {
                flight: {
                    airline: { contains: search, mode: 'insensitive' },
                },
            },
            {
                user: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                user: {
                    email: { contains: search, mode: 'insensitive' },
                },
            },
        ];
    }
    const [bookings, total] = await Promise.all([
        prismaClient_1.default.booking.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                tour: { select: { id: true, name: true, description: true } },
                hotel: { select: { id: true, name: true, description: true } },
                room: { select: { id: true, roomType: true, description: true } },
                flight: { select: { id: true, flightNumber: true, airline: true } },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        paymentMethod: true,
                    },
                },
            },
        }),
        prismaClient_1.default.booking.count({ where: whereClause }),
    ]);
    const response = bookings.map((booking) => {
        if (booking.tour) {
            return {
                ...booking,
                type: 'TOUR',
                tour: booking.tour,
                hotel: null,
                room: null,
                flight: null,
            };
        }
        else if (booking.hotel) {
            return {
                ...booking,
                type: 'HOTEL',
                hotel: booking.hotel,
                room: booking.room ?? null,
                tour: null,
                flight: null,
            };
        }
        else if (booking.flight) {
            return {
                ...booking,
                type: 'FLIGHT',
                flight: booking.flight,
                tour: null,
                hotel: null,
                room: null,
            };
        }
        throw new Error('Booking has no associated item (tour, hotel, or flight)');
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Bookings for user ${userId} retrieved successfully`,
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getUserBookings = [
    (0, express_validator_1.param)('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetUserBookings,
];
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
    // Optional filters
    const userId = req.query.userId;
    const status = req.query.status;
    const bookingType = req.query.type;
    const search = req.query.search;
    const tourId = req.query.tourId;
    const hotelId = req.query.hotelId;
    const flightId = req.query.flightId;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    // Build where clause
    const whereClause = {};
    // Base authorization filter
    if (user.role === 'CUSTOMER') {
        whereClause.userId = parseInt(user.id);
    }
    // Additional filters
    if (userId && user.role !== 'CUSTOMER') {
        whereClause.userId = parseInt(userId);
    }
    if (status) {
        whereClause.status = status;
    }
    if (tourId) {
        whereClause.tourId = parseInt(tourId);
    }
    if (hotelId) {
        whereClause.hotelId = parseInt(hotelId);
    }
    if (flightId) {
        whereClause.flightId = parseInt(flightId);
    }
    if (fromDate && toDate) {
        whereClause.bookingDate = {
            gte: new Date(fromDate),
            lte: new Date(toDate),
        };
    }
    else if (fromDate) {
        whereClause.bookingDate = {
            gte: new Date(fromDate),
        };
    }
    else if (toDate) {
        whereClause.bookingDate = {
            lte: new Date(toDate),
        };
    }
    // Handle booking type filter
    if (bookingType === 'TOUR') {
        whereClause.tourId = { not: null };
    }
    else if (bookingType === 'HOTEL') {
        whereClause.hotelId = { not: null };
    }
    else if (bookingType === 'FLIGHT') {
        whereClause.flightId = { not: null };
    }
    // Handle search across related entities
    if (search) {
        whereClause.OR = [
            {
                tour: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                tour: {
                    description: { contains: search, mode: 'insensitive' },
                },
            },
            {
                hotel: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                hotel: {
                    description: { contains: search, mode: 'insensitive' },
                },
            },
            {
                flight: {
                    flightNumber: { contains: search, mode: 'insensitive' },
                },
            },
            {
                flight: {
                    airline: { contains: search, mode: 'insensitive' },
                },
            },
            {
                user: {
                    name: { contains: search, mode: 'insensitive' },
                },
            },
            {
                user: {
                    email: { contains: search, mode: 'insensitive' },
                },
            },
        ];
    }
    const [bookings, total] = await Promise.all([
        prismaClient_1.default.booking.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                tour: {
                    select: { id: true, name: true, description: true },
                },
                hotel: {
                    select: { id: true, name: true, description: true },
                },
                room: {
                    select: { id: true, roomType: true, description: true },
                },
                flight: {
                    select: { id: true, flightNumber: true, airline: true },
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        paymentMethod: true,
                    },
                },
            },
        }),
        prismaClient_1.default.booking.count({ where: whereClause }),
    ]);
    const response = bookings.map((booking) => {
        if (booking.tour) {
            return {
                id: booking.id,
                userId: booking.userId,
                user: booking.user,
                payment: booking.payment,
                status: booking.status,
                totalPrice: booking.totalPrice,
                bookingDate: booking.bookingDate,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                type: 'TOUR',
                tour: booking.tour,
                hotel: null,
                room: null,
                flight: null,
            };
        }
        else if (booking.hotel) {
            return {
                id: booking.id,
                userId: booking.userId,
                user: booking.user,
                payment: booking.payment,
                status: booking.status,
                totalPrice: booking.totalPrice,
                bookingDate: booking.bookingDate,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                type: 'HOTEL',
                hotel: booking.hotel,
                room: booking.room ?? null,
                tour: null,
                flight: null,
            };
        }
        else if (booking.flight) {
            return {
                id: booking.id,
                userId: booking.userId,
                user: booking.user,
                payment: booking.payment,
                status: booking.status,
                totalPrice: booking.totalPrice,
                bookingDate: booking.bookingDate,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                type: 'FLIGHT',
                flight: booking.flight,
                tour: null,
                hotel: null,
                room: null,
            };
        }
        else {
            throw new Error('Booking has no associated item (tour, hotel, or flight)');
        }
    });
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
exports.getAllBookings = [
    ...validation_1.default.create(bookingValidations_1.getBookingsValidation),
    handleGetAllBookings,
];
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
exports.deleteAllBookings = [handleDeleteAllBookings];
