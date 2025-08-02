"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllItineraries = exports.getAllItineraries = exports.deleteItinerary = exports.updateItinerary = exports.getItinerary = exports.createItinerary = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
/**
 * Create a new itinerary
 */
const createItinerary = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { tourId, day, title, activities, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create itineraries');
    }
    // Validate tourId
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: tourId },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const itinerary = await prismaClient_1.default.itinerary.create({
        data: {
            tour: { connect: { id: tourId } },
            day,
            title,
            activities,
            description,
        },
    });
    const response = {
        id: itinerary.id,
        tourId: itinerary.tourId,
        day: itinerary.day,
        title: itinerary.title,
        activities: itinerary.activities,
        description: itinerary.description,
        createdAt: itinerary.createdAt,
        updatedAt: itinerary.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Itinerary created successfully',
        data: response,
    });
});
exports.createItinerary = createItinerary;
/**
 * Get a single itinerary by ID
 */
const getItinerary = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const itinerary = await prismaClient_1.default.itinerary.findUnique({
        where: { id: parseInt(id) },
    });
    if (!itinerary) {
        throw new error_handler_1.NotFoundError('Itinerary not found');
    }
    const response = {
        id: itinerary.id,
        tourId: itinerary.tourId,
        day: itinerary.day,
        title: itinerary.title,
        activities: itinerary.activities,
        description: itinerary.description,
        createdAt: itinerary.createdAt,
        updatedAt: itinerary.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Itinerary retrieved successfully',
        data: response,
    });
});
exports.getItinerary = getItinerary;
/**
 * Update an itinerary
 */
const updateItinerary = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { tourId, day, title, activities, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update itineraries');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Itinerary ID is required');
    }
    const itinerary = await prismaClient_1.default.itinerary.findUnique({
        where: { id: parseInt(id) },
    });
    if (!itinerary) {
        throw new error_handler_1.NotFoundError('Itinerary not found');
    }
    // Validate tourId if provided
    if (tourId) {
        const tour = await prismaClient_1.default.tour.findUnique({
            where: { id: tourId },
        });
        if (!tour) {
            throw new error_handler_1.NotFoundError('Tour not found');
        }
    }
    const updatedItinerary = await prismaClient_1.default.itinerary.update({
        where: { id: parseInt(id) },
        data: {
            tour: tourId ? { connect: { id: tourId } } : undefined,
            day: day ?? itinerary.day,
            title: title ?? itinerary.title,
            activities: activities ?? itinerary.activities,
            description: description ?? itinerary.description,
        },
    });
    const response = {
        id: updatedItinerary.id,
        tourId: updatedItinerary.tourId,
        day: updatedItinerary.day,
        title: updatedItinerary.title,
        activities: updatedItinerary.activities,
        description: updatedItinerary.description,
        createdAt: updatedItinerary.createdAt,
        updatedAt: updatedItinerary.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Itinerary updated successfully',
        data: response,
    });
});
exports.updateItinerary = updateItinerary;
/**
 * Delete an itinerary
 */
const deleteItinerary = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete itineraries');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Itinerary ID is required');
    }
    const itinerary = await prismaClient_1.default.itinerary.findUnique({
        where: { id: parseInt(id) },
    });
    if (!itinerary) {
        throw new error_handler_1.NotFoundError('Itinerary not found');
    }
    await prismaClient_1.default.itinerary.delete({
        where: { id: parseInt(id) },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Itinerary deleted successfully',
    });
});
exports.deleteItinerary = deleteItinerary;
/**
 * Get all itineraries with pagination
 */
const getAllItineraries = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [itineraries, total] = await Promise.all([
        prismaClient_1.default.itinerary.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.itinerary.count(),
    ]);
    const response = itineraries.map((itinerary) => ({
        id: itinerary.id,
        tourId: itinerary.tourId,
        day: itinerary.day,
        title: itinerary.title,
        activities: itinerary.activities,
        description: itinerary.description,
        createdAt: itinerary.createdAt,
        updatedAt: itinerary.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Itineraries retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllItineraries = getAllItineraries;
/**
 * Delete all itineraries
 */
const deleteAllItineraries = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all itineraries');
    }
    await prismaClient_1.default.itinerary.deleteMany({});
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All itineraries deleted successfully',
    });
});
exports.deleteAllItineraries = deleteAllItineraries;
