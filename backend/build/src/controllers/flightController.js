"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllFlights = exports.getAllFlights = exports.deleteFlight = exports.updateFlight = exports.getFlight = exports.createFlight = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
/**
 * Create a new flight
 */
const handleCreateFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { flightNumber, airline, departure, arrival, originId, destinationId, price, flightClass, duration, stops, seatsAvailable, } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create flights');
    }
    // Check if origin and destination exist
    const [origin, destination] = await Promise.all([
        prismaClient_1.default.destination.findUnique({ where: { id: originId } }),
        prismaClient_1.default.destination.findUnique({ where: { id: destinationId } }),
    ]);
    if (!origin || !destination) {
        throw new error_handler_1.NotFoundError('Origin or destination not found');
    }
    // Get photo URL from middleware processing
    const photoUrl = req.body.flightPhoto;
    const flight = await prismaClient_1.default.flight.create({
        data: {
            flightNumber,
            airline,
            departure: new Date(departure),
            arrival: new Date(arrival),
            origin: { connect: { id: originId } },
            destination: { connect: { id: destinationId } },
            price,
            flightClass,
            duration,
            stops: stops ?? 0,
            photo: typeof photoUrl === 'string' ? photoUrl : null,
            seatsAvailable,
        },
    });
    const response = {
        id: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departure: flight.departure,
        arrival: flight.arrival,
        originId: flight.originId,
        destinationId: flight.destinationId,
        price: flight.price,
        flightClass: flight.flightClass,
        duration: flight.duration,
        stops: flight.stops,
        photo: flight.photo,
        seatsAvailable: flight.seatsAvailable,
        createdAt: flight.createdAt,
        updatedAt: flight.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Flight created successfully',
        data: response,
    });
});
/**
 * Middleware array for flight creation
 */
const createFlight = [
    multer_1.default.single('flightPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
    handleCreateFlight,
];
exports.createFlight = createFlight;
/**
 * Get a single flight by ID
 */
const getFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const flight = await prismaClient_1.default.flight.findUnique({
        where: { id: parseInt(id) },
    });
    if (!flight) {
        throw new error_handler_1.NotFoundError('Flight not found');
    }
    const response = {
        id: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departure: flight.departure,
        arrival: flight.arrival,
        originId: flight.originId,
        destinationId: flight.destinationId,
        price: flight.price,
        flightClass: flight.flightClass,
        duration: flight.duration,
        stops: flight.stops,
        photo: flight.photo,
        seatsAvailable: flight.seatsAvailable,
        createdAt: flight.createdAt,
        updatedAt: flight.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Flight retrieved successfully',
        data: response,
    });
});
exports.getFlight = getFlight;
/**
 * Update a flight with photo handling
 */
const handleUpdateFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { flightNumber, airline, departure, arrival, originId, destinationId, price, flightClass, duration, stops, seatsAvailable, } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update flights');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Flight ID is required');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // First, get the current flight to check for existing photo
        const existingFlight = await prismaClient_1.default.flight.findUnique({
            where: { id: parseInt(id) },
            select: { photo: true },
        });
        if (!existingFlight) {
            throw new error_handler_1.NotFoundError('Flight not found');
        }
        oldPhoto = existingFlight.photo;
        // Check if origin and destination exist if provided
        if (originId || destinationId) {
            const [origin, destination] = await Promise.all([
                originId
                    ? prismaClient_1.default.destination.findUnique({ where: { id: originId } })
                    : null,
                destinationId
                    ? prismaClient_1.default.destination.findUnique({ where: { id: destinationId } })
                    : null,
            ]);
            if ((originId && !origin) || (destinationId && !destination)) {
                throw new error_handler_1.NotFoundError('Origin or destination not found');
            }
        }
        // Prepare update data
        const updateData = {};
        // Only update fields that are provided
        if (flightNumber !== undefined) {
            updateData.flightNumber = flightNumber;
        }
        if (airline !== undefined) {
            updateData.airline = airline;
        }
        if (departure !== undefined) {
            updateData.departure = new Date(departure);
        }
        if (arrival !== undefined) {
            updateData.arrival = new Date(arrival);
        }
        if (originId !== undefined) {
            updateData.origin = { connect: { id: originId } };
        }
        if (destinationId !== undefined) {
            updateData.destination = { connect: { id: destinationId } };
        }
        if (price !== undefined) {
            updateData.price = price;
        }
        if (flightClass !== undefined) {
            updateData.flightClass = flightClass;
        }
        if (duration !== undefined) {
            updateData.duration = duration;
        }
        if (stops !== undefined) {
            updateData.stops = stops;
        }
        if (seatsAvailable !== undefined) {
            updateData.seatsAvailable = seatsAvailable;
        }
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.flightPhoto && typeof req.body.flightPhoto === 'string') {
            updateData.photo = req.body.flightPhoto;
            uploadedImageUrl = req.body.flightPhoto;
        }
        // Update flight in database
        const updatedFlight = await prismaClient_1.default.flight.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        // If we successfully updated with a new photo, clean up the old one
        if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldPhoto);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up old flight photo:', cleanupError);
            }
        }
        const response = {
            id: updatedFlight.id,
            flightNumber: updatedFlight.flightNumber,
            airline: updatedFlight.airline,
            departure: updatedFlight.departure,
            arrival: updatedFlight.arrival,
            originId: updatedFlight.originId,
            destinationId: updatedFlight.destinationId,
            price: updatedFlight.price,
            flightClass: updatedFlight.flightClass,
            duration: updatedFlight.duration,
            stops: updatedFlight.stops,
            photo: updatedFlight.photo,
            seatsAvailable: updatedFlight.seatsAvailable,
            createdAt: updatedFlight.createdAt,
            updatedAt: updatedFlight.updatedAt,
        };
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Flight updated successfully',
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
 * Middleware array for flight update
 */
const updateFlight = [
    multer_1.default.single('flightPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
    handleUpdateFlight,
];
exports.updateFlight = updateFlight;
/**
 * Delete a flight with photo cleanup
 */
const deleteFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete flights');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Flight ID is required');
    }
    const flight = await prismaClient_1.default.flight.findUnique({
        where: { id: parseInt(id) },
    });
    if (!flight) {
        throw new error_handler_1.NotFoundError('Flight not found');
    }
    // Delete from database first
    await prismaClient_1.default.flight.delete({
        where: { id: parseInt(id) },
    });
    // Clean up photo from Cloudinary if it exists
    if (flight.photo) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(flight.photo);
        }
        catch (cleanupError) {
            console.warn('Failed to clean up flight photo from Cloudinary:', cleanupError);
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Flight deleted successfully',
    });
});
exports.deleteFlight = deleteFlight;
/**
 * Get all flights with pagination
 */
const getAllFlights = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [flights, total] = await Promise.all([
        prismaClient_1.default.flight.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.flight.count(),
    ]);
    const response = flights.map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departure: flight.departure,
        arrival: flight.arrival,
        originId: flight.originId,
        destinationId: flight.destinationId,
        price: flight.price,
        flightClass: flight.flightClass,
        duration: flight.duration,
        stops: flight.stops,
        photo: flight.photo,
        seatsAvailable: flight.seatsAvailable,
        createdAt: flight.createdAt,
        updatedAt: flight.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Flights retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllFlights = getAllFlights;
/**
 * Delete all flights with photo cleanup
 */
const deleteAllFlights = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all flights');
    }
    // Get all flights with photos before deleting
    const flights = await prismaClient_1.default.flight.findMany({
        select: { photo: true },
        where: { photo: { not: null } },
    });
    // Delete from database first
    await prismaClient_1.default.flight.deleteMany({});
    // Clean up photos from Cloudinary
    const cleanupPromises = flights
        .filter((flight) => flight.photo)
        .map(async (flight) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(flight.photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${flight.photo}:`, cleanupError);
        }
    });
    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All flights deleted successfully',
    });
});
exports.deleteAllFlights = deleteAllFlights;
