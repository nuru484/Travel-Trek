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
    const { name, description, type, price, maxGuests, startDate, endDate, location, } = req.body;
    const user = req.user;
    // Convert dates and calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const tour = await prismaClient_1.default.tour.create({
        data: {
            name,
            description,
            type,
            duration: durationInDays,
            price,
            maxGuests,
            startDate: start,
            endDate: end,
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
        guestsBooked: tour.guestsBooked,
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
        guestsBooked: tour.guestsBooked,
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
    const { name, description, type, price, maxGuests, startDate, endDate, location, } = req.body;
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour ID is required');
    }
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        throw new error_handler_1.NotFoundError('Invalid tour ID');
    }
    try {
        const existingTour = await prismaClient_1.default.tour.findUnique({
            where: { id: parsedId },
            include: {
                bookings: {
                    select: { id: true },
                },
            },
        });
        if (!existingTour) {
            throw new error_handler_1.NotFoundError('Tour not found');
        }
        const now = new Date();
        const hasBookings = existingTour.bookings.length > 0;
        const bookedGuests = existingTour.guestsBooked;
        if (existingTour.startDate <= now) {
            throw new error_handler_1.BadRequestError('Cannot update tour that has already started');
        }
        if (existingTour.endDate <= now) {
            throw new error_handler_1.BadRequestError('Cannot update tour that has already ended');
        }
        const newStartDate = startDate
            ? new Date(startDate)
            : existingTour.startDate;
        const newEndDate = endDate ? new Date(endDate) : existingTour.endDate;
        if (startDate && new Date(startDate) <= now) {
            throw new error_handler_1.BadRequestError('Start date must be in the future');
        }
        if (endDate && new Date(endDate) <= now) {
            throw new error_handler_1.BadRequestError('End date must be in the future');
        }
        if (newEndDate <= newStartDate) {
            throw new error_handler_1.BadRequestError('End date must be after start date');
        }
        if (hasBookings &&
            location !== undefined &&
            location !== existingTour.location) {
            throw new error_handler_1.BadRequestError('Cannot change tour location when bookings exist. Please cancel all bookings first or create a new tour.');
        }
        if (maxGuests !== undefined) {
            if (maxGuests < bookedGuests) {
                throw new error_handler_1.BadRequestError(`Cannot reduce max guests to ${maxGuests}. ${bookedGuests} guests are already booked. Minimum capacity allowed is ${bookedGuests}.`);
            }
        }
        let calculatedDuration;
        if (startDate !== undefined || endDate !== undefined) {
            const durationInDays = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) /
                (1000 * 60 * 60 * 24));
            calculatedDuration = durationInDays;
        }
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (type !== undefined) {
            updateData.type = type;
        }
        if (calculatedDuration !== undefined) {
            updateData.duration = calculatedDuration;
        }
        if (price !== undefined) {
            updateData.price = price;
        }
        if (maxGuests !== undefined) {
            updateData.maxGuests = maxGuests;
        }
        if (startDate !== undefined) {
            updateData.startDate = newStartDate;
        }
        if (endDate !== undefined) {
            updateData.endDate = newEndDate;
        }
        if (location !== undefined) {
            updateData.location = location;
        }
        const updatedTour = await prismaClient_1.default.tour.update({
            where: { id: parsedId },
            data: updateData,
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
            guestsBooked: updatedTour.guestsBooked,
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
    }
    catch (error) {
        next(error);
    }
});
exports.updateTour = updateTour;
/**
 * Delete a tour
 */
const deleteTour = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete tours');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Tour ID is required');
    }
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        throw new error_handler_1.NotFoundError('Invalid tour ID');
    }
    const tour = await prismaClient_1.default.tour.findUnique({
        where: { id: parsedId },
        include: { bookings: true },
    });
    if (!tour) {
        throw new error_handler_1.NotFoundError('Tour not found');
    }
    const now = new Date();
    if (tour.startDate <= now) {
        throw new error_handler_1.BadRequestError('Cannot delete tour that has already started');
    }
    if (tour.endDate <= now) {
        throw new error_handler_1.BadRequestError('Cannot delete tour that has already ended');
    }
    if (tour.status === 'ONGOING') {
        throw new error_handler_1.BadRequestError('Cannot delete tour with status "ONGOING"');
    }
    if (tour.status === 'COMPLETED') {
        throw new error_handler_1.BadRequestError('Cannot delete tour with status "COMPLETED"');
    }
    // Check for existing bookings
    if (tour.bookings.length > 0) {
        throw new error_handler_1.BadRequestError('Cannot delete tour with existing bookings. Please cancel or reassign bookings first.');
    }
    if (tour.guestsBooked > 0) {
        throw new error_handler_1.BadRequestError(`Cannot delete tour with ${tour.guestsBooked} booked guest(s). Please cancel all bookings first.`);
    }
    await prismaClient_1.default.tour.delete({
        where: { id: parsedId },
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
    // Optional filters
    const type = req.query.type;
    const status = req.query.status;
    const location = req.query.location;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const minDuration = req.query.minDuration;
    const maxDuration = req.query.maxDuration;
    const minGuests = req.query.minGuests;
    const maxGuests = req.query.maxGuests;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const availableOnly = req.query.availableOnly === 'true';
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    // Build where clause
    const whereClause = {};
    // Filter by tour type
    if (type) {
        whereClause.type = type;
    }
    // Filter by tour status
    if (status) {
        whereClause.status = status;
    }
    // Filter by location (case-insensitive partial match)
    if (location) {
        whereClause.location = {
            contains: location,
            mode: 'insensitive',
        };
    }
    // Filter by price range
    if (minPrice || maxPrice) {
        whereClause.price = {};
        if (minPrice) {
            const parsedMinPrice = parseFloat(minPrice);
            if (!isNaN(parsedMinPrice)) {
                whereClause.price.gte = parsedMinPrice;
            }
        }
        if (maxPrice) {
            const parsedMaxPrice = parseFloat(maxPrice);
            if (!isNaN(parsedMaxPrice)) {
                whereClause.price.lte = parsedMaxPrice;
            }
        }
    }
    // Filter by duration range
    if (minDuration || maxDuration) {
        whereClause.duration = {};
        if (minDuration) {
            const parsedMinDuration = parseInt(minDuration);
            if (!isNaN(parsedMinDuration)) {
                whereClause.duration.gte = parsedMinDuration;
            }
        }
        if (maxDuration) {
            const parsedMaxDuration = parseInt(maxDuration);
            if (!isNaN(parsedMaxDuration)) {
                whereClause.duration.lte = parsedMaxDuration;
            }
        }
    }
    // Filter by available guests capacity
    if (minGuests || maxGuests) {
        const guestsFilter = {};
        if (minGuests) {
            const parsedMinGuests = parseInt(minGuests);
            if (!isNaN(parsedMinGuests)) {
                guestsFilter.gte = parsedMinGuests;
            }
        }
        if (maxGuests) {
            const parsedMaxGuests = parseInt(maxGuests);
            if (!isNaN(parsedMaxGuests)) {
                guestsFilter.lte = parsedMaxGuests;
            }
        }
        whereClause.maxGuests = guestsFilter;
    }
    // Filter by date range
    if (startDate || endDate) {
        if (startDate) {
            whereClause.startDate = {
                gte: new Date(startDate),
            };
        }
        if (endDate) {
            whereClause.endDate = {
                lte: new Date(endDate),
            };
        }
    }
    // Filter to show only tours with available capacity
    if (availableOnly) {
        whereClause.guestsBooked = {
            lt: prismaClient_1.default.tour.fields.maxGuests,
        };
    }
    // Search functionality (title, description, location)
    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
        ];
    }
    // Build orderBy clause
    const orderByClause = {};
    const validSortFields = [
        'createdAt',
        'updatedAt',
        'startDate',
        'endDate',
        'price',
        'duration',
        'maxGuests',
        'guestsBooked',
        'name',
    ];
    if (validSortFields.includes(sortBy)) {
        orderByClause[sortBy] = sortOrder;
    }
    else {
        orderByClause.createdAt = 'desc';
    }
    const [tours, total] = await Promise.all([
        prismaClient_1.default.tour.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: orderByClause,
            include: {
                bookings: {
                    select: {
                        id: true,
                    },
                },
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                    },
                },
                destinations: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                        reviews: true,
                        itinerary: true,
                    },
                },
            },
        }),
        prismaClient_1.default.tour.count({ where: whereClause }),
    ]);
    // Calculate average rating for each tour
    const response = tours.map((tour) => {
        const avgRating = tour.reviews.length > 0
            ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) /
                tour.reviews.length
            : 0;
        const availableSeats = tour.maxGuests - tour.guestsBooked;
        return {
            id: tour.id,
            name: tour.name,
            description: tour.description,
            type: tour.type,
            status: tour.status,
            duration: tour.duration,
            price: tour.price,
            maxGuests: tour.maxGuests,
            guestsBooked: tour.guestsBooked,
            availableSeats,
            startDate: tour.startDate,
            endDate: tour.endDate,
            location: tour.location,
            destinations: tour.destinations,
            bookingCount: tour._count.bookings,
            reviewCount: tour._count.reviews,
            itineraryCount: tour._count.itinerary,
            averageRating: parseFloat(avgRating.toFixed(1)),
            createdAt: tour.createdAt,
            updatedAt: tour.updatedAt,
        };
    });
    const paginatedResponse = {
        message: 'Tours retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json(paginatedResponse);
});
exports.getAllTours = getAllTours;
/**
 * Delete all tours
 */
const deleteAllTours = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const tours = await prismaClient_1.default.tour.findMany({
        include: { bookings: true },
    });
    if (tours.length === 0) {
        throw new error_handler_1.NotFoundError('No tours found to delete');
    }
    const now = new Date();
    const deletionResults = {
        deletable: [],
        skippedReasons: {
            hasBookings: [],
            alreadyStarted: [],
            alreadyEnded: [],
            statusOngoing: [],
            statusCompleted: [],
            hasGuestsBooked: [],
        },
    };
    // Evaluate each tour for deletion eligibility
    tours.forEach((tour) => {
        let canDelete = true;
        // Check if tour has already started (primary check)
        if (tour.startDate <= now) {
            deletionResults.skippedReasons.alreadyStarted.push(tour.id);
            canDelete = false;
        }
        // Check if tour has already ended (primary check)
        if (tour.endDate <= now) {
            deletionResults.skippedReasons.alreadyEnded.push(tour.id);
            canDelete = false;
        }
        // Check status (secondary check)
        if (tour.status === 'ONGOING') {
            deletionResults.skippedReasons.statusOngoing.push(tour.id);
            canDelete = false;
        }
        if (tour.status === 'COMPLETED') {
            deletionResults.skippedReasons.statusCompleted.push(tour.id);
            canDelete = false;
        }
        // Check for existing bookings
        if (tour.bookings.length > 0) {
            deletionResults.skippedReasons.hasBookings.push(tour.id);
            canDelete = false;
        }
        // Check if there are booked guests (additional safety check)
        if (tour.guestsBooked > 0) {
            deletionResults.skippedReasons.hasGuestsBooked.push(tour.id);
            canDelete = false;
        }
        // Add to deletable list if all checks pass
        if (canDelete) {
            deletionResults.deletable.push(tour.id);
        }
    });
    const totalSkipped = deletionResults.skippedReasons.hasBookings.length +
        deletionResults.skippedReasons.alreadyStarted.length +
        deletionResults.skippedReasons.alreadyEnded.length +
        deletionResults.skippedReasons.statusOngoing.length +
        deletionResults.skippedReasons.statusCompleted.length +
        deletionResults.skippedReasons.hasGuestsBooked.length;
    if (deletionResults.deletable.length === 0) {
        const reasons = [];
        if (deletionResults.skippedReasons.alreadyStarted.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.alreadyStarted.length} tour(s) have already started`);
        }
        if (deletionResults.skippedReasons.alreadyEnded.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.alreadyEnded.length} tour(s) have already ended`);
        }
        if (deletionResults.skippedReasons.hasBookings.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.hasBookings.length} tour(s) have existing bookings`);
        }
        if (deletionResults.skippedReasons.statusOngoing.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.statusOngoing.length} tour(s) are ongoing`);
        }
        if (deletionResults.skippedReasons.statusCompleted.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.statusCompleted.length} tour(s) are completed`);
        }
        if (deletionResults.skippedReasons.hasGuestsBooked.length > 0) {
            reasons.push(`${deletionResults.skippedReasons.hasGuestsBooked.length} tour(s) have booked guests`);
        }
        throw new error_handler_1.BadRequestError(`No tours can be deleted. ${reasons.join(', ')}.`);
    }
    // Delete safe tours
    await prismaClient_1.default.tour.deleteMany({
        where: {
            id: { in: deletionResults.deletable },
        },
    });
    // Build detailed skip summary
    const skipSummary = [];
    if (deletionResults.skippedReasons.alreadyStarted.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.alreadyStarted.length} already started`);
    }
    if (deletionResults.skippedReasons.alreadyEnded.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.alreadyEnded.length} already ended`);
    }
    if (deletionResults.skippedReasons.hasBookings.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.hasBookings.length} with bookings`);
    }
    if (deletionResults.skippedReasons.statusOngoing.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.statusOngoing.length} ongoing`);
    }
    if (deletionResults.skippedReasons.statusCompleted.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.statusCompleted.length} completed`);
    }
    if (deletionResults.skippedReasons.hasGuestsBooked.length > 0) {
        skipSummary.push(`${deletionResults.skippedReasons.hasGuestsBooked.length} with guests booked`);
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Deleted ${deletionResults.deletable.length} tour(s) successfully`,
        deleted: deletionResults.deletable.length,
        skipped: totalSkipped,
        skipDetails: skipSummary.length > 0 ? skipSummary.join(', ') : 'None',
        totalProcessed: tours.length,
    });
});
exports.deleteAllTours = deleteAllTours;
