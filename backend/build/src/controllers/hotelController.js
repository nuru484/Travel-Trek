"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllHotels = exports.getAllHotels = exports.deleteHotel = exports.updateHotel = exports.getHotel = exports.createHotel = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
/**
 * Create a new hotel
 */
const handleCreateHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { name, description, address, city, country, phone, starRating, amenities, destinationId, } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create hotels');
    }
    // Check if destination exists
    const destination = await prismaClient_1.default.destination.findUnique({
        where: { id: destinationId },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    // Get photo URL from middleware processing
    const photoUrl = req.body.hotelPhoto;
    const hotel = await prismaClient_1.default.hotel.create({
        data: {
            name,
            description,
            address,
            city,
            country,
            phone,
            starRating,
            amenities,
            photo: typeof photoUrl === 'string' ? photoUrl : null,
            destination: { connect: { id: destinationId } },
        },
    });
    const response = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        phone: hotel.phone,
        starRating: hotel.starRating,
        amenities: hotel.amenities,
        photo: hotel.photo,
        destinationId: hotel.destinationId,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Hotel created successfully',
        data: response,
    });
});
/**
 * Middleware array for hotel creation
 */
const createHotel = [
    multer_1.default.single('hotelPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
    handleCreateHotel,
];
exports.createHotel = createHotel;
/**
 * Get a single hotel by ID
 */
const getHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: parseInt(id) },
    });
    if (!hotel) {
        throw new error_handler_1.NotFoundError('Hotel not found');
    }
    const response = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        phone: hotel.phone,
        starRating: hotel.starRating,
        amenities: hotel.amenities,
        photo: hotel.photo,
        destinationId: hotel.destinationId,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Hotel retrieved successfully',
        data: response,
    });
});
exports.getHotel = getHotel;
/**
 * Update a hotel with photo handling
 */
const handleUpdateHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, address, city, country, phone, starRating, amenities, destinationId, } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update hotels');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Hotel ID is required');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // First, get the current hotel to check for existing photo
        const existingHotel = await prismaClient_1.default.hotel.findUnique({
            where: { id: parseInt(id) },
            select: { photo: true },
        });
        if (!existingHotel) {
            throw new error_handler_1.NotFoundError('Hotel not found');
        }
        oldPhoto = existingHotel.photo;
        // Check if destination exists if provided
        if (destinationId) {
            const destination = await prismaClient_1.default.destination.findUnique({
                where: { id: destinationId },
            });
            if (!destination) {
                throw new error_handler_1.NotFoundError('Destination not found');
            }
        }
        // Prepare update data
        const updateData = {};
        // Only update fields that are provided
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (address !== undefined)
            updateData.address = address;
        if (city !== undefined)
            updateData.city = city;
        if (country !== undefined)
            updateData.country = country;
        if (phone !== undefined)
            updateData.phone = phone;
        if (starRating !== undefined)
            updateData.starRating = starRating;
        if (amenities !== undefined)
            updateData.amenities = amenities;
        if (destinationId !== undefined)
            updateData.destinationId = destinationId;
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.hotelPhoto && typeof req.body.hotelPhoto === 'string') {
            updateData.photo = req.body.hotelPhoto;
            uploadedImageUrl = req.body.hotelPhoto;
        }
        // Update hotel in database
        const updatedHotel = await prismaClient_1.default.hotel.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        // If we successfully updated with a new photo, clean up the old one
        if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldPhoto);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up old hotel photo:', cleanupError);
            }
        }
        const response = {
            id: updatedHotel.id,
            name: updatedHotel.name,
            description: updatedHotel.description,
            address: updatedHotel.address,
            city: updatedHotel.city,
            country: updatedHotel.country,
            phone: updatedHotel.phone,
            starRating: updatedHotel.starRating,
            amenities: updatedHotel.amenities,
            photo: updatedHotel.photo,
            destinationId: updatedHotel.destinationId,
            createdAt: updatedHotel.createdAt,
            updatedAt: updatedHotel.updatedAt,
        };
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Hotel updated successfully',
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
 * Middleware array for hotel update
 */
const updateHotel = [
    multer_1.default.single('hotelPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
    handleUpdateHotel,
];
exports.updateHotel = updateHotel;
/**
 * Delete a hotel with photo cleanup
 */
const deleteHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete hotels');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Hotel ID is required');
    }
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: parseInt(id) },
    });
    if (!hotel) {
        throw new error_handler_1.NotFoundError('Hotel not found');
    }
    // Delete from database first
    await prismaClient_1.default.hotel.delete({
        where: { id: parseInt(id) },
    });
    // Clean up photo from Cloudinary if it exists
    if (hotel.photo) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(hotel.photo);
        }
        catch (cleanupError) {
            console.warn('Failed to clean up hotel photo from Cloudinary:', cleanupError);
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Hotel deleted successfully',
    });
});
exports.deleteHotel = deleteHotel;
/**
 * Get all hotels with pagination
 */
const getAllHotels = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [hotels, total] = await Promise.all([
        prismaClient_1.default.hotel.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.hotel.count(),
    ]);
    const response = hotels.map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        phone: hotel.phone,
        starRating: hotel.starRating,
        amenities: hotel.amenities,
        photo: hotel.photo,
        destinationId: hotel.destinationId,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Hotels retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllHotels = getAllHotels;
/**
 * Delete all hotels with photo cleanup
 */
const deleteAllHotels = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all hotels');
    }
    // Get all hotels with photos before deleting
    const hotels = await prismaClient_1.default.hotel.findMany({
        select: { photo: true },
        where: { photo: { not: null } },
    });
    // Delete from database first
    await prismaClient_1.default.hotel.deleteMany({});
    // Clean up photos from Cloudinary
    const cleanupPromises = hotels
        .filter((hotel) => hotel.photo)
        .map(async (hotel) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(hotel.photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${hotel.photo}:`, cleanupError);
        }
    });
    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All hotels deleted successfully',
    });
});
exports.deleteAllHotels = deleteAllHotels;
