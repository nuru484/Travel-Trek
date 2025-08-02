"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllDestinations = exports.getAllDestinations = exports.deleteDestination = exports.updateDestination = exports.getDestination = exports.createDestination = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
/**
 * Create a new destination
 */
const handleCreateDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { name, description, country, city } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create destinations');
    }
    // Get photo URL from middleware processing (should be a string after Cloudinary upload)
    const photoUrl = req.body.destinationPhoto;
    const destination = await prismaClient_1.default.destination.create({
        data: {
            name,
            description,
            country,
            city,
            photo: typeof photoUrl === 'string' ? photoUrl : null,
        },
    });
    const response = {
        id: destination.id,
        name: destination.name,
        description: destination.description,
        country: destination.country,
        city: destination.city,
        photo: destination.photo,
        createdAt: destination.createdAt,
        updatedAt: destination.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Destination created successfully',
        data: response,
    });
});
/**
 * Middleware array for destination creation
 */
const createDestination = [
    multer_1.default.single('destinationPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'destinationPhoto'),
    handleCreateDestination,
];
exports.createDestination = createDestination;
/**
 * Get a single destination by ID
 */
const getDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const destination = await prismaClient_1.default.destination.findUnique({
        where: { id: parseInt(id) },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    const response = {
        id: destination.id,
        name: destination.name,
        description: destination.description,
        country: destination.country,
        city: destination.city,
        photo: destination.photo,
        createdAt: destination.createdAt,
        updatedAt: destination.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Destination retrieved successfully',
        data: response,
    });
});
exports.getDestination = getDestination;
/**
 * Update a destination with photo handling
 */
const handleUpdateDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, country, city } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update destinations');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Destination ID is required');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // First, get the current destination to check for existing photo
        const existingDestination = await prismaClient_1.default.destination.findUnique({
            where: { id: parseInt(id) },
            select: { photo: true },
        });
        if (!existingDestination) {
            throw new error_handler_1.NotFoundError('Destination not found');
        }
        oldPhoto = existingDestination.photo;
        // Prepare update data
        const updateData = {};
        // Only update fields that are provided
        if (name !== undefined) {
            updateData.name = name;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (country !== undefined) {
            updateData.country = country;
        }
        if (city !== undefined) {
            updateData.city = city;
        }
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.destinationPhoto &&
            typeof req.body.destinationPhoto === 'string') {
            updateData.photo = req.body.destinationPhoto;
            uploadedImageUrl = req.body.destinationPhoto;
        }
        // Update destination in database
        const updatedDestination = await prismaClient_1.default.destination.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        // If we successfully updated with a new photo, clean up the old one
        if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldPhoto);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up old destination photo:', cleanupError);
                // Don't throw here as the main operation succeeded
            }
        }
        const response = {
            id: updatedDestination.id,
            name: updatedDestination.name,
            description: updatedDestination.description,
            country: updatedDestination.country,
            city: updatedDestination.city,
            photo: updatedDestination.photo,
            createdAt: updatedDestination.createdAt,
            updatedAt: updatedDestination.updatedAt,
        };
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Destination updated successfully',
            data: response,
        });
    }
    catch (error) {
        // If Cloudinary upload succeeded but DB update failed, clean up uploaded image
        if (uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(uploadedImageUrl);
            }
            catch (cleanupError) {
                console.error('Failed to clean up Cloudinary image:', cleanupError);
            }
        }
        next(error);
    }
});
/**
 * Middleware array for destination update
 */
const updateDestination = [
    multer_1.default.single('destinationPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'destinationPhoto'),
    handleUpdateDestination,
];
exports.updateDestination = updateDestination;
/**
 * Delete a destination with photo cleanup
 */
const deleteDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete destinations');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Destination ID is required');
    }
    const destination = await prismaClient_1.default.destination.findUnique({
        where: { id: parseInt(id) },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    // Delete from database first
    await prismaClient_1.default.destination.delete({
        where: { id: parseInt(id) },
    });
    // Clean up photo from Cloudinary if it exists
    if (destination.photo) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(destination.photo);
        }
        catch (cleanupError) {
            console.warn('Failed to clean up destination photo from Cloudinary:', cleanupError);
            // Don't throw here as the main operation succeeded
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Destination deleted successfully',
    });
});
exports.deleteDestination = deleteDestination;
/**
 * Get all destinations with pagination
 */
const getAllDestinations = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [destinations, total] = await Promise.all([
        prismaClient_1.default.destination.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.destination.count(),
    ]);
    const response = destinations.map((destination) => ({
        id: destination.id,
        name: destination.name,
        description: destination.description,
        country: destination.country,
        city: destination.city,
        photo: destination.photo,
        createdAt: destination.createdAt,
        updatedAt: destination.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Destinations retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllDestinations = getAllDestinations;
/**
 * Delete all destinations with photo cleanup
 */
const deleteAllDestinations = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all destinations');
    }
    // Get all destinations with photos before deleting
    const destinations = await prismaClient_1.default.destination.findMany({
        select: { photo: true },
        where: { photo: { not: null } },
    });
    // Delete from database first
    await prismaClient_1.default.destination.deleteMany({});
    // Clean up photos from Cloudinary
    const cleanupPromises = destinations
        .filter((dest) => dest.photo)
        .map(async (dest) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(dest.photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${dest.photo}:`, cleanupError);
        }
    });
    // Wait for all cleanup operations (but don't fail if some cleanup fails)
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All destinations deleted successfully',
    });
});
exports.deleteAllDestinations = deleteAllDestinations;
