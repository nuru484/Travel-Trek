"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllTourInclusions = exports.getAllTourInclusions = exports.deleteTourInclusion = exports.updateTourInclusion = exports.getTourInclusion = exports.createTourInclusion = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
/**
 * Create a new tour inclusion
 */
const createTourInclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { tourId, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create tour inclusions');
    }
    // Validate tourId
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: tourId },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const tourInclusion = await prismaClient_1.default.tourInclusion.create({
        data: {
            tour: { connect: { id: tourId } },
            description,
        },
    });
    const response = {
        id: tourInclusion.id,
        tourId: tourInclusion.tourId,
        description: tourInclusion.description,
        createdAt: tourInclusion.createdAt,
        updatedAt: tourInclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Tour inclusion created successfully',
        data: response,
    });
});
exports.createTourInclusion = createTourInclusion;
/**
 * Get a single tour inclusion by ID
 */
const getTourInclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const tourInclusion = await prismaClient_1.default.tourInclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourInclusion) {
        throw new error_handler_1.NotFoundError('Tour inclusion not found');
    }
    const response = {
        id: tourInclusion.id,
        tourId: tourInclusion.tourId,
        description: tourInclusion.description,
        createdAt: tourInclusion.createdAt,
        updatedAt: tourInclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour inclusion retrieved successfully',
        data: response,
    });
});
exports.getTourInclusion = getTourInclusion;
/**
 * Update a tour inclusion
 */
const updateTourInclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { tourId, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update tour inclusions');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour inclusion ID is required');
    }
    const tourInclusion = await prismaClient_1.default.tourInclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourInclusion) {
        throw new error_handler_1.NotFoundError('Tour inclusion not found');
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
    const updatedTourInclusion = await prismaClient_1.default.tourInclusion.update({
        where: { id: parseInt(id) },
        data: {
            tour: tourId ? { connect: { id: tourId } } : undefined,
            description: description ?? tourInclusion.description,
        },
    });
    const response = {
        id: updatedTourInclusion.id,
        tourId: updatedTourInclusion.tourId,
        description: updatedTourInclusion.description,
        createdAt: updatedTourInclusion.createdAt,
        updatedAt: updatedTourInclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour inclusion updated successfully',
        data: response,
    });
});
exports.updateTourInclusion = updateTourInclusion;
/**
 * Delete a tour inclusion
 */
const deleteTourInclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete tour inclusions');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour inclusion ID is required');
    }
    const tourInclusion = await prismaClient_1.default.tourInclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourInclusion) {
        throw new error_handler_1.NotFoundError('Tour inclusion not found');
    }
    await prismaClient_1.default.tourInclusion.delete({
        where: { id: parseInt(id) },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour inclusion deleted successfully',
    });
});
exports.deleteTourInclusion = deleteTourInclusion;
/**
 * Get all tour inclusions with pagination
 */
const getAllTourInclusions = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [tourInclusions, total] = await Promise.all([
        prismaClient_1.default.tourInclusion.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.tourInclusion.count(),
    ]);
    const response = tourInclusions.map((tourInclusion) => ({
        id: tourInclusion.id,
        tourId: tourInclusion.tourId,
        description: tourInclusion.description,
        createdAt: tourInclusion.createdAt,
        updatedAt: tourInclusion.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour inclusions retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllTourInclusions = getAllTourInclusions;
/**
 * Delete all tour inclusions
 */
const deleteAllTourInclusions = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all tour inclusions');
    }
    await prismaClient_1.default.tourInclusion.deleteMany({});
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All tour inclusions deleted successfully',
    });
});
exports.deleteAllTourInclusions = deleteAllTourInclusions;
