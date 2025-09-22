"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllDestinations = exports.getAllDestinations = exports.deleteDestination = exports.updateDestination = exports.getDestination = exports.createDestination = void 0;
const express_validator_1 = require("express-validator");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const validation_1 = __importDefault(require("../middlewares/validation"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
const destination_validation_1 = require("../validations/destination-validation");
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
 * Get a single destination by ID
 */
const handleGetDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
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
 * Delete a destination with photo cleanup
 */
const handleDeleteDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
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
    const destinationId = parseInt(id);
    const destination = await prismaClient_1.default.destination.findUnique({
        where: { id: destinationId },
        include: {
            hotels: true,
            tours: true,
            originFlights: true,
            destinationFlights: true,
        },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    // Check dependencies
    const dependentItems = [];
    if (destination.hotels.length > 0)
        dependentItems.push('Hotels');
    if (destination.tours.length > 0)
        dependentItems.push('Tours');
    if (destination.originFlights.length > 0 ||
        destination.destinationFlights.length > 0)
        dependentItems.push('Flights');
    if (dependentItems.length > 0) {
        throw new error_handler_1.BadRequestError(`This destination cannot be deleted because it has associated: ${dependentItems.join(', ')}. Please remove or reassign them before deleting the destination.`);
    }
    // Delete from database
    await prismaClient_1.default.destination.delete({
        where: { id: destinationId },
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
/**
 * Get all destinations with pagination and filtering
 */
const handleGetAllDestinations = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Extract search and filter parameters
    const search = req.query.search;
    const country = req.query.country;
    const city = req.query.city;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    // Build where clause for filtering
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (country) {
        where.country = { contains: country, mode: 'insensitive' };
    }
    if (city) {
        where.city = { contains: city, mode: 'insensitive' };
    }
    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    const [destinations, total] = await Promise.all([
        prismaClient_1.default.destination.findMany({
            where,
            skip,
            take: limit,
            orderBy,
        }),
        prismaClient_1.default.destination.count({ where }),
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
            filters: {
                search,
                country,
                city,
                sortBy,
                sortOrder,
            },
        },
    });
});
/**
 * Delete all destinations with photo cleanup
 */
const handleDeleteAllDestinations = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all destinations');
    }
    // Fetch all destinations with relations
    const destinations = await prismaClient_1.default.destination.findMany({
        include: {
            hotels: true,
            tours: true,
            originFlights: true,
            destinationFlights: true,
        },
    });
    if (destinations.length === 0) {
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'No destinations found to delete',
        });
        return;
    }
    // Check dependencies
    const blocked = [];
    for (const dest of destinations) {
        const deps = [];
        if (dest.hotels.length > 0)
            deps.push('Hotels');
        if (dest.tours.length > 0)
            deps.push('Tours');
        if (dest.originFlights.length > 0 || dest.destinationFlights.length > 0) {
            deps.push('Flights');
        }
        if (deps.length > 0) {
            blocked.push({ name: dest.name, id: dest.id, deps });
        }
    }
    if (blocked.length > 0) {
        const details = blocked
            .map((b) => `Destination "${b.name}" (ID: ${b.id}) has associated: ${b.deps.join(', ')}`)
            .join('; ');
        throw new error_handler_1.BadRequestError(`Some destinations cannot be deleted because they have dependencies. ${details}`);
    }
    // Get all photos before deleting
    const photos = destinations
        .map((dest) => dest.photo)
        .filter((photo) => Boolean(photo));
    // Delete all destinations
    await prismaClient_1.default.destination.deleteMany({});
    // Clean up photos from Cloudinary
    const cleanupPromises = photos.map(async (photo) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${photo}:`, cleanupError);
        }
    });
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All destinations deleted successfully',
    });
});
// Middleware arrays with validations
exports.createDestination = [
    multer_1.default.single('destinationPhoto'),
    ...validation_1.default.create([
        ...destination_validation_1.createDestinationValidation,
        ...destination_validation_1.destinationPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'destinationPhoto'),
    handleCreateDestination,
];
exports.getDestination = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Destination ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetDestination,
];
exports.updateDestination = [
    multer_1.default.single('destinationPhoto'),
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Destination ID must be a positive integer'),
    ...validation_1.default.create([
        ...destination_validation_1.updateDestinationValidation,
        ...destination_validation_1.destinationPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'destinationPhoto'),
    handleUpdateDestination,
];
exports.deleteDestination = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Destination ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleDeleteDestination,
];
exports.getAllDestinations = [
    ...validation_1.default.create(destination_validation_1.getDestinationsValidation),
    handleGetAllDestinations,
];
exports.deleteAllDestinations = [
    handleDeleteAllDestinations,
];
