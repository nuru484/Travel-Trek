"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlightStatistics = exports.deleteAllFlights = exports.getAllFlights = exports.deleteFlight = exports.updateFlight = exports.getFlight = exports.createFlight = void 0;
const express_validator_1 = require("express-validator");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const validation_1 = __importDefault(require("../middlewares/validation"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
const flight_validation_1 = require("../validations/flight-validation");
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
        prismaClient_1.default.destination.findUnique({ where: { id: Number(originId) } }),
        prismaClient_1.default.destination.findUnique({ where: { id: Number(destinationId) } }),
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
            origin: { connect: { id: Number(originId) } },
            destination: { connect: { id: Number(destinationId) } },
            price: +price,
            flightClass,
            duration: Number(duration),
            stops: stops ? Number(stops) : 0,
            photo: typeof photoUrl === 'string' ? photoUrl : null,
            seatsAvailable: Number(seatsAvailable),
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
 * Get a single flight by ID
 */
const handleGetFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const flight = await prismaClient_1.default.flight.findUnique({
        where: { id: parseInt(id) },
        include: {
            origin: {
                select: {
                    id: true,
                    name: true,
                    country: true,
                    city: true,
                },
            },
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
        origin: flight.origin,
        destination: flight.destination,
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
    // Parse numeric values to integers
    const parsedId = parseInt(id);
    const parsedOriginId = originId ? parseInt(String(originId)) : undefined;
    const parsedDestinationId = destinationId
        ? parseInt(String(destinationId))
        : undefined;
    const parsedPrice = price !== undefined ? parseFloat(String(price)) : undefined;
    const parsedDuration = duration !== undefined ? parseInt(String(duration)) : undefined;
    const parsedStops = stops !== undefined ? parseInt(String(stops)) : undefined;
    const parsedSeatsAvailable = seatsAvailable !== undefined
        ? parseInt(String(seatsAvailable))
        : undefined;
    // Validate parsed ID
    if (isNaN(parsedId)) {
        throw new error_handler_1.NotFoundError('Invalid flight ID');
    }
    // Validate parsed numeric fields
    if (parsedOriginId !== undefined && isNaN(parsedOriginId)) {
        throw new error_handler_1.BadRequestError('Invalid origin ID');
    }
    if (parsedDestinationId !== undefined && isNaN(parsedDestinationId)) {
        throw new error_handler_1.BadRequestError('Invalid destination ID');
    }
    if (parsedPrice !== undefined && isNaN(parsedPrice)) {
        throw new error_handler_1.BadRequestError('Invalid price value');
    }
    if (parsedDuration !== undefined && isNaN(parsedDuration)) {
        throw new error_handler_1.BadRequestError('Invalid duration value');
    }
    if (parsedStops !== undefined && isNaN(parsedStops)) {
        throw new error_handler_1.BadRequestError('Invalid stops value');
    }
    if (parsedSeatsAvailable !== undefined && isNaN(parsedSeatsAvailable)) {
        throw new error_handler_1.BadRequestError('Invalid seats available value');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // First, get the current flight to check for existing photo
        const existingFlight = await prismaClient_1.default.flight.findUnique({
            where: { id: parsedId },
            select: { photo: true },
        });
        if (!existingFlight) {
            throw new error_handler_1.NotFoundError('Flight not found');
        }
        oldPhoto = existingFlight.photo;
        // Check if origin and destination exist if provided
        if (parsedOriginId || parsedDestinationId) {
            const [origin, destination] = await Promise.all([
                parsedOriginId
                    ? prismaClient_1.default.destination.findUnique({ where: { id: parsedOriginId } })
                    : null,
                parsedDestinationId
                    ? prismaClient_1.default.destination.findUnique({
                        where: { id: parsedDestinationId },
                    })
                    : null,
            ]);
            if ((parsedOriginId && !origin) ||
                (parsedDestinationId && !destination)) {
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
        if (parsedOriginId !== undefined) {
            updateData.origin = { connect: { id: parsedOriginId } };
        }
        if (parsedDestinationId !== undefined) {
            updateData.destination = { connect: { id: parsedDestinationId } };
        }
        if (parsedPrice !== undefined) {
            updateData.price = parsedPrice;
        }
        if (flightClass !== undefined) {
            updateData.flightClass = flightClass;
        }
        if (parsedDuration !== undefined) {
            updateData.duration = parsedDuration;
        }
        if (parsedStops !== undefined) {
            updateData.stops = parsedStops;
        }
        if (parsedSeatsAvailable !== undefined) {
            updateData.seatsAvailable = parsedSeatsAvailable;
        }
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.flightPhoto && typeof req.body.flightPhoto === 'string') {
            updateData.photo = req.body.flightPhoto;
            uploadedImageUrl = req.body.flightPhoto;
        }
        // Update flight in database
        const updatedFlight = await prismaClient_1.default.flight.update({
            where: { id: parsedId },
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
 * Delete a flight with photo cleanup
 */
const handleDeleteFlight = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
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
    const flightId = parseInt(id);
    const flight = await prismaClient_1.default.flight.findUnique({
        where: { id: flightId },
        include: { bookings: true },
    });
    if (!flight) {
        throw new error_handler_1.NotFoundError('Flight not found');
    }
    // Check if flight has bookings
    if (flight.bookings.length > 0) {
        throw new error_handler_1.BadRequestError(`This flight cannot be deleted because it has ${flight.bookings.length} associated booking(s). Please cancel or reassign those bookings first.`);
    }
    // Delete from database
    await prismaClient_1.default.flight.delete({
        where: { id: flightId },
    });
    // Clean up photo from Cloudinary if it exists
    if (flight.photo) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(flight.photo);
        }
        catch (cleanupError) {
            console.warn('Failed to clean up flight photo from Cloudinary:', cleanupError);
            // Not throwing here since deletion succeeded
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Flight deleted successfully',
    });
});
/**
 * Get all flights with advanced filtering and search
 */
const handleGetAllFlights = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Extract search and filter parameters
    const { search, airline, originId, destinationId, flightClass, departureFrom, departureTo, minPrice, maxPrice, maxDuration, maxStops, minSeats, sortBy = 'departure', sortOrder = 'asc', } = req.query;
    // Build where clause for filtering
    const where = {};
    if (search) {
        where.OR = [
            { flightNumber: { contains: search, mode: 'insensitive' } },
            { airline: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (airline) {
        where.airline = { contains: airline, mode: 'insensitive' };
    }
    if (originId) {
        where.originId = parseInt(originId);
    }
    if (destinationId) {
        where.destinationId = parseInt(destinationId);
    }
    if (flightClass) {
        where.flightClass = flightClass;
    }
    if (departureFrom || departureTo) {
        where.departure = {};
        if (departureFrom) {
            where.departure.gte = new Date(departureFrom);
        }
        if (departureTo) {
            where.departure.lte = new Date(departureTo);
        }
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) {
            where.price.gte = parseFloat(minPrice);
        }
        if (maxPrice) {
            where.price.lte = parseFloat(maxPrice);
        }
    }
    if (maxDuration) {
        where.duration = { lte: parseInt(maxDuration) };
    }
    if (maxStops !== undefined) {
        where.stops = { lte: parseInt(maxStops) };
    }
    if (minSeats) {
        where.seatsAvailable = { gte: parseInt(minSeats) };
    }
    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    const [flights, total] = await Promise.all([
        prismaClient_1.default.flight.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                origin: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                        city: true,
                    },
                },
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
        prismaClient_1.default.flight.count({ where }),
    ]);
    const response = flights.map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departure: flight.departure,
        arrival: flight.arrival,
        originId: flight.originId,
        destinationId: flight.destinationId,
        origin: flight.origin,
        destination: flight.destination,
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
            filters: {
                search,
                airline,
                originId: originId ? parseInt(originId) : undefined,
                destinationId: destinationId
                    ? parseInt(destinationId)
                    : undefined,
                flightClass,
                departureFrom,
                departureTo,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                maxDuration: maxDuration
                    ? parseInt(maxDuration)
                    : undefined,
                maxStops: maxStops !== undefined ? parseInt(maxStops) : undefined,
                minSeats: minSeats ? parseInt(minSeats) : undefined,
                sortBy,
                sortOrder,
            },
        },
    });
});
/**
 * Delete all flights with photo cleanup
 */
const handleDeleteAllFlights = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all flights');
    }
    // Fetch all flights with bookings
    const flights = await prismaClient_1.default.flight.findMany({
        include: { bookings: true },
    });
    if (flights.length === 0) {
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'No flights found to delete',
        });
        return;
    }
    // Identify flights with bookings
    const blocked = [];
    for (const flight of flights) {
        if (flight.bookings.length > 0) {
            blocked.push({
                id: flight.id,
                flightNumber: flight.flightNumber,
                bookingCount: flight.bookings.length,
            });
        }
    }
    if (blocked.length > 0) {
        const details = blocked
            .map((b) => `Flight "${b.flightNumber}" (ID: ${b.id}) has ${b.bookingCount} booking(s)`)
            .join('; ');
        throw new error_handler_1.BadRequestError(`Some flights cannot be deleted because they have active bookings. ${details}`);
    }
    // Collect photos before deleting
    const photos = flights
        .map((flight) => flight.photo)
        .filter((photo) => Boolean(photo));
    // Delete all flights
    await prismaClient_1.default.flight.deleteMany({});
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
        message: 'All flights deleted successfully',
    });
});
/**
 * Get flight statistics (for admin dashboard)
 */
const getFlightStats = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can view flight statistics');
    }
    const [totalFlights, totalSeats, averagePrice, flightsByClass, flightsByAirline, upcomingFlights,] = await Promise.all([
        prismaClient_1.default.flight.count(),
        prismaClient_1.default.flight.aggregate({
            _sum: {
                seatsAvailable: true,
            },
        }),
        prismaClient_1.default.flight.aggregate({
            _avg: {
                price: true,
            },
        }),
        prismaClient_1.default.flight.groupBy({
            by: ['flightClass'],
            _count: true,
        }),
        prismaClient_1.default.flight.groupBy({
            by: ['airline'],
            _count: true,
            orderBy: {
                _count: {
                    airline: 'desc',
                },
            },
            take: 10,
        }),
        prismaClient_1.default.flight.count({
            where: {
                departure: {
                    gte: new Date(),
                },
            },
        }),
    ]);
    const stats = {
        totalFlights,
        totalSeats: totalSeats._sum.seatsAvailable || 0,
        averagePrice: Math.round((averagePrice._avg.price || 0) * 100) / 100,
        upcomingFlights,
        flightsByClass: flightsByClass.map((item) => ({
            class: item.flightClass,
            count: item._count,
        })),
        topAirlines: flightsByAirline.map((item) => ({
            airline: item.airline,
            count: item._count,
        })),
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Flight statistics retrieved successfully',
        data: stats,
    });
});
// Middleware arrays with validations
exports.createFlight = [
    multer_1.default.single('flightPhoto'),
    ...validation_1.default.create([
        ...flight_validation_1.createFlightValidation,
        ...flight_validation_1.flightPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
    handleCreateFlight,
];
exports.getFlight = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Flight ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleGetFlight,
];
exports.updateFlight = [
    multer_1.default.single('flightPhoto'),
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Flight ID must be a positive integer'),
    ...validation_1.default.create([
        ...flight_validation_1.updateFlightValidation,
        ...flight_validation_1.flightPhotoValidation,
    ]),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
    handleUpdateFlight,
];
exports.deleteFlight = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Flight ID must be a positive integer'),
    ...validation_1.default.create([]),
    handleDeleteFlight,
];
exports.getAllFlights = [
    ...validation_1.default.create(flight_validation_1.getFlightsValidation),
    handleGetAllFlights,
];
exports.deleteAllFlights = [handleDeleteAllFlights];
exports.getFlightStatistics = [getFlightStats];
