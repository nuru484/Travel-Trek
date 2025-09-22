"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllTours = exports.getAllTours = exports.deleteTour = exports.updateTour = exports.getTour = exports.createTour = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
/**
 * Create a new tour
 */
const createTour = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { name, description, type, duration, price, maxGuests, startDate, endDate, location, } = req.body;
    const user = req.user;
    const tour = await prismaClient_1.default.tour.create({
        data: {
            name,
            description,
            type,
            duration,
            price,
            maxGuests,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            location,
        },
    });
    const response = {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        type: tour.type,
        status: tour.status,
        duration: tour.duration,
        price: tour.price,
        maxGuests: tour.maxGuests,
        startDate: tour.startDate,
        endDate: tour.endDate,
        location: tour.location,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Tour created successfully',
        data: response,
    });
});
exports.createTour = createTour;
/**
 * Get a single tour by ID
 */
const getTour = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const response = {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        type: tour.type,
        status: tour.status,
        duration: tour.duration,
        price: tour.price,
        maxGuests: tour.maxGuests,
        startDate: tour.startDate,
        endDate: tour.endDate,
        location: tour.location,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour retrieved successfully',
        data: response,
    });
});
exports.getTour = getTour;
/**
 * Update a tour
 */
const updateTour = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour ID is required');
    }
    const { name, description, type, duration, price, maxGuests, startDate, endDate, location, } = req.body;
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const updatedTour = await prismaClient_1.default.tour.update({
        where: { id: parseInt(id) },
        data: {
            name: name ?? tour.name,
            description: description ?? tour.description,
            type: type ?? tour.type,
            duration: duration ?? tour.duration,
            price: price ?? tour.price,
            maxGuests: maxGuests ?? tour.maxGuests,
            startDate: startDate ? new Date(startDate) : tour.startDate,
            endDate: endDate ? new Date(endDate) : tour.endDate,
            location: location ?? tour.location,
        },
    });
    const response = {
        id: updatedTour.id,
        name: updatedTour.name,
        description: updatedTour.description,
        type: updatedTour.type,
        status: updatedTour.status,
        duration: updatedTour.duration,
        price: updatedTour.price,
        maxGuests: updatedTour.maxGuests,
        startDate: updatedTour.startDate,
        endDate: updatedTour.endDate,
        location: updatedTour.location,
        createdAt: updatedTour.createdAt,
        updatedAt: updatedTour.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour updated successfully',
        data: response,
    });
});
exports.updateTour = updateTour;
/**
 * Delete a tour
 */
const deleteTour = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour ID is required');
    }
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: parseInt(id) },
        include: { bookings: true },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    if (tour.bookings.length > 0) {
        throw new error_handler_1.BadRequestError('Cannot delete tour with existing bookings. Please cancel or reassign bookings first.');
    }
    if (tour.status === 'ONGOING' || tour.status === 'COMPLETED') {
        throw new error_handler_1.BadRequestError(`Cannot delete tour with status "${tour.status}".`);
    }
    // Delete tour
    await prismaClient_1.default.tour.delete({
        where: { id: parseInt(id) },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour deleted successfully',
    });
});
exports.deleteTour = deleteTour;
/**
 * Get all tours with pagination
 */
const getAllTours = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [tours, total] = await Promise.all([
        prismaClient_1.default.tour.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.tour.count(),
    ]);
    const response = tours.map((tour) => ({
        id: tour.id,
        name: tour.name,
        description: tour.description,
        type: tour.type,
        status: tour.status,
        duration: tour.duration,
        price: tour.price,
        maxGuests: tour.maxGuests,
        startDate: tour.startDate,
        endDate: tour.endDate,
        location: tour.location,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tours retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllTours = getAllTours;
/**
 * Delete all tours
 */
const deleteAllTours = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    // Get all tours with bookings
    const tours = await prismaClient_1.default.tour.findMany({
        include: { bookings: true },
    });
    // Filter out safe tours
    const deletableTours = tours.filter((tour) => tour.bookings.length === 0 &&
        tour.status !== 'ONGOING' &&
        tour.status !== 'COMPLETED');
    if (deletableTours.length === 0) {
        throw new error_handler_1.BadRequestError('No tours can be deleted. All tours are either booked, ongoing, or completed.');
    }
    // Delete safe tours
    await prismaClient_1.default.tour.deleteMany({
        where: {
            id: { in: deletableTours.map((t) => t.id) },
        },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Deleted ${deletableTours.length} tour(s) successfully`,
        skipped: tours.length - deletableTours.length,
    });
});
exports.deleteAllTours = deleteAllTours;
