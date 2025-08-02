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
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create tours');
    }
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
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update tours');
    }
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
    const user = req.user;
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour ID is required');
    }
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete tours');
    }
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
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
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all tours');
    }
    await prismaClient_1.default.tour.deleteMany({});
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All tours deleted successfully',
    });
});
exports.deleteAllTours = deleteAllTours;
