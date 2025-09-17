"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllHotels = exports.checkHotelAvailability = exports.getHotelsByDestination = exports.getAllHotels = exports.deleteHotel = exports.updateHotel = exports.getHotel = exports.createHotel = void 0;
const express_validator_1 = require("express-validator");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const validation_1 = __importDefault(require("../middlewares/validation"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
const hotel_validation_1 = require("../validations/hotel-validation");
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
        where: { id: Number(destinationId) },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    // Get photo URL from middleware processing
    const photoUrl = req.body.hotelPhoto;
    // Convert starRating to number and provide default
    const parsedStarRating = starRating ? Number(starRating) : 3;
    // Validate the star rating is within valid range (1-5)
    if (parsedStarRating < 1 ||
        parsedStarRating > 5 ||
        isNaN(parsedStarRating)) {
        throw new Error('Star rating must be a number between 1 and 5');
    }
    const hotel = await prismaClient_1.default.hotel.create({
        data: {
            name,
            description,
            address,
            city,
            country,
            phone,
            starRating: parsedStarRating,
            amenities: amenities || [],
            photo: typeof photoUrl === 'string' ? photoUrl : null,
            destination: { connect: { id: Number(destinationId) } },
        },
        include: {
            destination: {
                select: {
                    id: true,
                    name: true,
                    country: true,
                    city: true,
                },
            },
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
 * Get a single hotel by ID
 */
const handleGetHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: parseInt(id) },
        include: {
            destination: {
                select: {
                    id: true,
                    name: true,
                    country: true,
                    city: true,
                },
            },
            rooms: {
                select: {
                    id: true,
                    roomType: true,
                    price: true,
                    capacity: true,
                    available: true,
                },
            },
        },
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
            where: { id: Number(id) },
            select: { photo: true },
        });
        if (!existingHotel) {
            throw new error_handler_1.NotFoundError('Hotel not found');
        }
        oldPhoto = existingHotel.photo;
        // Check if destination exists if provided
        if (destinationId) {
            const destination = await prismaClient_1.default.destination.findUnique({
                where: { id: Number(destinationId) },
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
        // Handle starRating conversion - convert string to number
        if (starRating !== undefined) {
            const parsedStarRating = Number(starRating);
            // Validate the star rating is within valid range (1-5)
            if (parsedStarRating < 1 ||
                parsedStarRating > 5 ||
                isNaN(parsedStarRating)) {
                throw new Error('Star rating must be a number between 1 and 5');
            }
            updateData.starRating = parsedStarRating;
        }
        // Handle amenities - convert object to array if needed
        if (amenities !== undefined) {
            let processedAmenities;
            if (Array.isArray(amenities)) {
                // Already an array
                processedAmenities = amenities;
            }
            else if (typeof amenities === 'object' && amenities !== null) {
                // Convert object like {"0": "item1", "1": "item2"} to array
                processedAmenities = Object.values(amenities).filter((item) => typeof item === 'string');
            }
            else if (typeof amenities === 'string') {
                // Single string, convert to array
                processedAmenities = [amenities];
            }
            else {
                processedAmenities = [];
            }
            updateData.amenities = processedAmenities;
        }
        // Handle destinationId - convert string to number
        if (destinationId !== undefined) {
            const parsedDestinationId = Number(destinationId);
            if (isNaN(parsedDestinationId)) {
                throw new Error('Destination ID must be a valid number');
            }
            updateData.destinationId = parsedDestinationId;
        }
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.hotelPhoto && typeof req.body.hotelPhoto === 'string') {
            updateData.photo = req.body.hotelPhoto;
            uploadedImageUrl = req.body.hotelPhoto;
        }
        // Update hotel in database
        const updatedHotel = await prismaClient_1.default.hotel.update({
            where: { id: Number(id) },
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
 * Delete a hotel with photo cleanup
 */
const handleDeleteHotel = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
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
/**
 * Get all hotels with pagination and filtering
 */
const handleGetAllHotels = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Extract search and filter parameters
    const search = req.query.search;
    const destinationId = req.query.destinationId
        ? parseInt(req.query.destinationId)
        : undefined;
    const city = req.query.city;
    const country = req.query.country;
    const starRating = req.query.starRating
        ? parseInt(req.query.starRating)
        : undefined;
    const minStarRating = req.query.minStarRating
        ? parseInt(req.query.minStarRating)
        : undefined;
    const maxStarRating = req.query.maxStarRating
        ? parseInt(req.query.maxStarRating)
        : undefined;
    const amenities = req.query.amenities;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    // Build where clause for filtering
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (destinationId) {
        where.destinationId = destinationId;
    }
    if (city) {
        where.city = { contains: city, mode: 'insensitive' };
    }
    if (country) {
        where.country = { contains: country, mode: 'insensitive' };
    }
    if (starRating) {
        where.starRating = starRating;
    }
    if (minStarRating || maxStarRating) {
        where.starRating = {};
        if (minStarRating)
            where.starRating.gte = minStarRating;
        if (maxStarRating)
            where.starRating.lte = maxStarRating;
    }
    if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
        where.amenities = {
            hasEvery: amenitiesArray,
        };
    }
    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    const [hotels, total] = await Promise.all([
        prismaClient_1.default.hotel.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                destination: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                        city: true,
                    },
                },
            },
        }),
        prismaClient_1.default.hotel.count({ where }),
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
            filters: {
                search,
                destinationId,
                city,
                country,
                starRating,
                minStarRating,
                maxStarRating,
                amenities,
                sortBy,
                sortOrder,
            },
        },
    });
});
/**
 * Get hotels by destination
 */
const handleGetHotelsByDestination = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { destinationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Check if destination exists
    const destination = await prismaClient_1.default.destination.findUnique({
        where: { id: parseInt(destinationId) },
    });
    if (!destination) {
        throw new error_handler_1.NotFoundError('Destination not found');
    }
    const [hotels, total] = await Promise.all([
        prismaClient_1.default.hotel.findMany({
            where: { destinationId: parseInt(destinationId) },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                destination: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                        city: true,
                    },
                },
            },
        }),
        prismaClient_1.default.hotel.count({
            where: { destinationId: parseInt(destinationId) },
        }),
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
            destination: {
                id: destination.id,
                name: destination.name,
                country: destination.country,
                city: destination.city,
            },
        },
    });
});
/**
 * Check hotel availability
 */
const handleCheckHotelAvailability = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.body;
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: parseInt(hotelId) },
        include: {
            rooms: {
                where: { available: true },
                select: {
                    id: true,
                    roomType: true,
                    price: true,
                    capacity: true,
                    description: true,
                    amenities: true,
                    photo: true,
                },
            },
        },
    });
    if (!hotel) {
        throw new error_handler_1.NotFoundError('Hotel not found');
    }
    // Filter rooms by guest capacity if specified
    let availableRooms = hotel.rooms;
    if (guests) {
        availableRooms = hotel.rooms.filter((room) => room.capacity >= guests);
    }
    // Here you would typically check for existing bookings between checkIn and checkOut dates
    // For now, we'll return all available rooms that meet the criteria
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Hotel availability checked successfully',
        data: {
            hotel: {
                id: hotel.id,
                name: hotel.name,
                address: hotel.address,
                city: hotel.city,
                country: hotel.country,
                starRating: hotel.starRating,
                amenities: hotel.amenities,
                photo: hotel.photo,
            },
            availableRooms,
            searchCriteria: {
                checkIn,
                checkOut,
                guests,
            },
        },
    });
});
/**
 * Delete all hotels with photo cleanup
 */
const handleDeleteAllHotels = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
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
// Middleware arrays with validations
exports.createHotel = [
    multer_1.default.single('hotelPhoto'),
    ...validation_1.default.create([
        ...hotel_validation_1.createHotelValidation,
        ...hotel_validation_1.hotelPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
    handleCreateHotel,
];
exports.getHotel = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Hotel ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetHotel,
];
exports.updateHotel = [
    multer_1.default.single('hotelPhoto'),
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Hotel ID must be a positive integer'),
    ...validation_1.default.create([
        ...hotel_validation_1.updateHotelValidation,
        ...hotel_validation_1.hotelPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
    handleUpdateHotel,
];
exports.deleteHotel = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Hotel ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleDeleteHotel,
];
exports.getAllHotels = [
    ...validation_1.default.create(hotel_validation_1.getHotelsValidation),
    handleGetAllHotels,
];
exports.getHotelsByDestination = [
    (0, express_validator_1.param)('destinationId')
        .isInt({ min: 1 })
        .withMessage('Destination ID must be a positive integer'),
    handleGetHotelsByDestination,
];
exports.checkHotelAvailability = [
    (0, express_validator_1.param)('hotelId')
        .isInt({ min: 1 })
        .withMessage('Hotel ID must be a positive integer'),
    ...validation_1.default.create(hotel_validation_1.hotelAvailabilityValidation),
    handleCheckHotelAvailability,
];
exports.deleteAllHotels = [handleDeleteAllHotels];
