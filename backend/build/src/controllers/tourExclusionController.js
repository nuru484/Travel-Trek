"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllTourExclusions = exports.getAllTourExclusions = exports.deleteTourExclusion = exports.updateTourExclusion = exports.getTourExclusion = exports.createTourExclusion = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const validation_1 = __importDefault(require("../middlewares/validation"));
const constants_1 = require("../config/constants");
const tour_exlusion_validation_1 = require("../validations/tour-exlusion-validation");
/**
 * Create a new tour exclusion
 */
const handlerCreateTourExclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { tourId, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create tour exclusions');
    }
    // Validate tourId
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: tourId },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const tourExclusion = await prismaClient_1.default.tourExclusion.create({
        data: {
            tour: { connect: { id: tourId } },
            description,
        },
    });
    const response = {
        id: tourExclusion.id,
        tourId: tourExclusion.tourId,
        description: tourExclusion.description,
        createdAt: tourExclusion.createdAt,
        updatedAt: tourExclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Tour exclusion created successfully',
        data: response,
    });
});
exports.createTourExclusion = [
    ...validation_1.default.create([tour_exlusion_validation_1.createTourExclusionValidation]),
    handlerCreateTourExclusion,
];
/**
 * Get a single tour exclusion by ID
 */
exports.getTourExclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const tourExclusion = await prismaClient_1.default.tourExclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourExclusion) {
        throw new error_handler_1.NotFoundError('Tour exclusion not found');
    }
    const response = {
        id: tourExclusion.id,
        tourId: tourExclusion.tourId,
        description: tourExclusion.description,
        createdAt: tourExclusion.createdAt,
        updatedAt: tourExclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour exclusion retrieved successfully',
        data: response,
    });
});
/**
 * Update a tour exclusion
 */
exports.updateTourExclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { tourId, description } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update tour exclusions');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour exclusion ID is required');
    }
    const tourExclusion = await prismaClient_1.default.tourExclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourExclusion) {
        throw new error_handler_1.NotFoundError('Tour exclusion not found');
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
    const updatedTourExclusion = await prismaClient_1.default.tourExclusion.update({
        where: { id: parseInt(id) },
        data: {
            tour: tourId ? { connect: { id: tourId } } : undefined,
            description: description ?? tourExclusion.description,
        },
    });
    const response = {
        id: updatedTourExclusion.id,
        tourId: updatedTourExclusion.tourId,
        description: updatedTourExclusion.description,
        createdAt: updatedTourExclusion.createdAt,
        updatedAt: updatedTourExclusion.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour exclusion updated successfully',
        data: response,
    });
});
/**
 * Delete a tour exclusion
 */
exports.deleteTourExclusion = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete tour exclusions');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour exclusion ID is required');
    }
    const tourExclusion = await prismaClient_1.default.tourExclusion.findUnique({
        where: { id: parseInt(id) },
    });
    if (!tourExclusion) {
        throw new error_handler_1.NotFoundError('Tour exclusion not found');
    }
    await prismaClient_1.default.tourExclusion.delete({
        where: { id: parseInt(id) },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour exclusion deleted successfully',
    });
});
/**
 * Get all tour exclusions with pagination
 */
exports.getAllTourExclusions = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [tourExclusions, total] = await Promise.all([
        prismaClient_1.default.tourExclusion.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.tourExclusion.count(),
    ]);
    const response = tourExclusions.map((tourExclusion) => ({
        id: tourExclusion.id,
        tourId: tourExclusion.tourId,
        description: tourExclusion.description,
        createdAt: tourExclusion.createdAt,
        updatedAt: tourExclusion.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Tour exclusions retrieved successfully',
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
 * Delete all tour exclusions
 */
exports.deleteAllTourExclusions = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all tour exclusions');
    }
    await prismaClient_1.default.tourExclusion.deleteMany({});
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All tour exclusions deleted successfully',
    });
});
