"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllRooms = exports.getAllRooms = exports.deleteRoom = exports.updateRoom = exports.getRoom = exports.createRoom = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const multer_1 = __importDefault(require("../config/multer"));
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const constants_2 = require("../config/constants");
const claudinary_1 = require("../config/claudinary");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Create a new room
 */
const handleCreateRoom = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { hotelId, roomType, price, capacity, totalRooms, description, amenities, } = req.body;
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: Number(hotelId) },
        select: { id: true, name: true, description: true },
    });
    if (!hotel) {
        throw new error_handler_1.NotFoundError('Hotel not found');
    }
    // Optional: Check for duplicate room type in the same hotel
    const existingRoom = await prismaClient_1.default.room.findFirst({
        where: {
            hotelId: Number(hotelId),
            roomType: roomType.trim(),
        },
    });
    if (existingRoom) {
        throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, `Room type '${roomType}' already exists for this hotel`);
    }
    // Get photo URL from middleware processing
    const photoUrl = req.body.roomPhoto;
    // Create the room
    const room = await prismaClient_1.default.room.create({
        data: {
            hotel: { connect: { id: Number(hotelId) } },
            roomType: roomType.trim(),
            price: Number(price),
            capacity: Number(capacity),
            totalRooms: Number(totalRooms),
            roomsAvailable: Number(totalRooms),
            description: description?.trim() || null,
            amenities: amenities || [],
            photo: typeof photoUrl === 'string' ? photoUrl : null,
        },
        include: {
            hotel: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
    const response = {
        id: room.id,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        totalRooms: room.totalRooms,
        roomsAvailable: room.roomsAvailable,
        description: room.description,
        amenities: room.amenities,
        photo: room.photo,
        hotel: room.hotel,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.CREATED).json({
        message: 'Room created successfully',
        data: response,
    });
});
/**
 * Middleware array for room creation
 */
const createRoom = [
    multer_1.default.single('roomPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'roomPhoto'),
    handleCreateRoom,
];
exports.createRoom = createRoom;
/**
 * Get a single room by ID
 */
const getRoom = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const room = await prismaClient_1.default.room.findUnique({
        where: { id: parseInt(id) },
        include: {
            hotel: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
    if (!room) {
        throw new error_handler_1.NotFoundError('Room not found');
    }
    const response = {
        id: room.id,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        amenities: room.amenities,
        totalRooms: room.totalRooms,
        roomsAvailable: room.roomsAvailable,
        photo: room.photo,
        hotel: room.hotel,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Room retrieved successfully',
        data: response,
    });
});
exports.getRoom = getRoom;
/**
 * Update a room with photo handling
 */
const handleUpdateRoom = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { hotelId, roomType, price, capacity, totalRooms, description, amenities, } = req.body;
    // Validate room ID
    if (!id) {
        throw new error_handler_1.NotFoundError('Room ID is required');
    }
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        throw new error_handler_1.BadRequestError('Invalid room ID');
    }
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // Fetch existing room with bookings to validate changes
        const existingRoom = await prismaClient_1.default.room.findUnique({
            where: { id: parsedId },
            include: {
                bookings: {
                    where: {
                        OR: [{ status: 'PENDING' }, { status: 'CONFIRMED' }],
                    },
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
        });
        if (!existingRoom) {
            throw new error_handler_1.NotFoundError('Room not found');
        }
        oldPhoto = existingRoom.photo;
        const hasActiveBookings = existingRoom.bookings.length > 0;
        const bookedRoomsCount = existingRoom.totalRooms - existingRoom.roomsAvailable;
        if (hotelId !== undefined && hotelId !== existingRoom.hotelId) {
            if (hasActiveBookings) {
                throw new error_handler_1.BadRequestError('Cannot change hotel when active bookings exist. Please cancel all bookings first or create a new room.');
            }
            // Verify new hotel exists
            const hotel = await prismaClient_1.default.hotel.findUnique({
                where: { id: Number(hotelId) },
                select: { id: true, name: true, description: true },
            });
            if (!hotel) {
                throw new error_handler_1.NotFoundError('Hotel not found');
            }
        }
        // Validate room type change
        if (roomType !== undefined && roomType.trim() !== existingRoom.roomType) {
            if (hasActiveBookings) {
                throw new error_handler_1.BadRequestError('Cannot change room type when active bookings exist. Please cancel all bookings first or create a new room.');
            }
            // Check for duplicate room type in the hotel
            const duplicateRoom = await prismaClient_1.default.room.findFirst({
                where: {
                    hotelId: hotelId !== undefined ? Number(hotelId) : existingRoom.hotelId,
                    roomType: roomType.trim(),
                    id: { not: parsedId },
                },
            });
            if (duplicateRoom) {
                throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, `Room type '${roomType}' already exists for this hotel`);
            }
        }
        // Validate price change
        if (price !== undefined) {
            if (hasActiveBookings) {
                const priceChange = Math.abs((price - existingRoom.price) / existingRoom.price) * 100;
                if (priceChange > 50) {
                    console.warn(`Large price change (${priceChange.toFixed(2)}%) on room ${parsedId} with active bookings`);
                }
            }
        }
        if (capacity !== undefined) {
            if (hasActiveBookings && capacity < existingRoom.capacity) {
                throw new error_handler_1.BadRequestError('Cannot reduce room capacity when active bookings exist. Guests may have booked based on the current capacity.');
            }
        }
        if (totalRooms !== undefined) {
            if (totalRooms < bookedRoomsCount) {
                throw new error_handler_1.BadRequestError(`Cannot reduce total rooms to ${totalRooms}. ${bookedRoomsCount} rooms are currently booked. Minimum total rooms allowed is ${bookedRoomsCount}.`);
            }
        }
        // Prepare update data
        const updateData = {};
        if (hotelId !== undefined) {
            updateData.hotel = { connect: { id: Number(hotelId) } };
        }
        if (roomType !== undefined) {
            updateData.roomType = roomType.trim();
        }
        if (price !== undefined) {
            updateData.price = Number(price);
        }
        if (capacity !== undefined) {
            updateData.capacity = Number(capacity);
        }
        if (totalRooms !== undefined) {
            updateData.totalRooms = Number(totalRooms);
            updateData.roomsAvailable = Number(totalRooms) - bookedRoomsCount;
        }
        if (description !== undefined) {
            updateData.description = description?.trim() || null;
        }
        if (amenities !== undefined) {
            updateData.amenities = amenities || [];
        }
        if (req.body.roomPhoto && typeof req.body.roomPhoto === 'string') {
            updateData.photo = req.body.roomPhoto;
            uploadedImageUrl = req.body.roomPhoto;
        }
        const updatedRoom = await prismaClient_1.default.room.update({
            where: { id: parsedId },
            data: updateData,
            include: {
                hotel: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldPhoto);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up old room photo:', cleanupError);
            }
        }
        const response = {
            id: updatedRoom.id,
            roomType: updatedRoom.roomType,
            price: updatedRoom.price,
            capacity: updatedRoom.capacity,
            totalRooms: updatedRoom.totalRooms,
            roomsAvailable: updatedRoom.roomsAvailable,
            description: updatedRoom.description,
            amenities: updatedRoom.amenities,
            photo: updatedRoom.photo,
            hotel: updatedRoom.hotel,
            createdAt: updatedRoom.createdAt,
            updatedAt: updatedRoom.updatedAt,
        };
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Room updated successfully',
            data: response,
        });
    }
    catch (error) {
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
 * Middleware array for room update
 */
const updateRoom = [
    multer_1.default.single('roomPhoto'),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'roomPhoto'),
    handleUpdateRoom,
];
exports.updateRoom = updateRoom;
/**
 * Delete a room with photo cleanup
 */
const deleteRoom = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new error_handler_1.NotFoundError('Room ID is required');
    }
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        throw new error_handler_1.BadRequestError('Invalid room ID');
    }
    try {
        const room = await prismaClient_1.default.room.findUnique({
            where: { id: parsedId },
            include: {
                bookings: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
                hotel: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!room) {
            throw new error_handler_1.NotFoundError('Room not found');
        }
        const now = new Date();
        // Check for active bookings (PENDING or CONFIRMED)
        const activeBookings = room.bookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED');
        if (activeBookings.length > 0) {
            throw new error_handler_1.BadRequestError(`Cannot delete room with ${activeBookings.length} active booking(s). Please cancel or complete all bookings first.`);
        }
        const ongoingBookings = room.bookings.filter((booking) => booking.status === 'CONFIRMED');
        if (ongoingBookings.length > 0) {
            throw new error_handler_1.BadRequestError(`Cannot delete room with ${ongoingBookings.length} ongoing booking(s). Guests are currently checked in.`);
        }
        const hotelRoomsCount = await prismaClient_1.default.room.count({
            where: {
                hotelId: room.hotelId,
            },
        });
        // Warn if deleting the last room or one of few rooms
        if (hotelRoomsCount <= 1) {
            logger_1.default.warn(`Deleting the last room (ID: ${parsedId}) for hotel "${room.hotel.name}" (ID: ${room.hotelId})`);
        }
        else if (hotelRoomsCount <= 3) {
            logger_1.default.warn(`Deleting room (ID: ${parsedId}) - only ${hotelRoomsCount - 1} room(s) will remain for hotel "${room.hotel.name}"`);
        }
        // Check if there are historical bookings (for record-keeping)
        const completedBookings = room.bookings.filter((booking) => booking.status === 'COMPLETED' || booking.status === 'CANCELLED');
        if (completedBookings.length > 0) {
            logger_1.default.info(`Deleting room (ID: ${parsedId}) with ${completedBookings.length} historical booking(s). Bookings will be orphaned.`);
        }
        await prismaClient_1.default.room.delete({
            where: { id: parsedId },
        });
        if (room.photo) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(room.photo);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up room photo from Cloudinary:', cleanupError);
            }
        }
        logger_1.default.info(`Room deleted successfully - ID: ${parsedId}, Type: ${room.roomType}, Hotel: ${room.hotel.name} (ID: ${room.hotelId})`);
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Room deleted successfully',
            data: {
                id: room.id,
                roomType: room.roomType,
                hotelName: room.hotel.name,
                deletedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteRoom = deleteRoom;
/**
 * Get all rooms with pagination and filtering
 */
const getAllRooms = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { page = 1, limit = 10, hotelId, roomType, available, minPrice, maxPrice, minCapacity, maxCapacity, amenities, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    // Build where clause
    const where = {};
    if (hotelId) {
        where.hotelId = Number(hotelId);
    }
    if (roomType) {
        where.roomType = {
            contains: roomType,
            mode: 'insensitive',
        };
    }
    if (available !== undefined) {
        where.available = Boolean(available);
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = Number(minPrice);
        if (maxPrice)
            where.price.lte = Number(maxPrice);
    }
    if (minCapacity || maxCapacity) {
        where.capacity = {};
        if (minCapacity)
            where.capacity.gte = Number(minCapacity);
        if (maxCapacity)
            where.capacity.lte = Number(maxCapacity);
    }
    if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
        where.amenities = {
            hasEvery: amenitiesArray,
        };
    }
    // Build orderBy clause
    const orderBy = {};
    if (sortBy === 'price' || sortBy === 'capacity' || sortBy === 'createdAt') {
        orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    }
    else {
        orderBy.createdAt = 'desc';
    }
    const [rooms, total] = await Promise.all([
        prismaClient_1.default.room.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy,
            include: {
                hotel: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        }),
        prismaClient_1.default.room.count({ where }),
    ]);
    const response = rooms.map((room) => ({
        id: room.id,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        amenities: room.amenities,
        photo: room.photo,
        totalRooms: room.totalRooms,
        roomsAvailable: room.roomsAvailable,
        hotel: room.hotel,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Rooms retrieved successfully',
        data: response,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});
exports.getAllRooms = getAllRooms;
/**
 * Delete all rooms with photo cleanup
 */
const deleteAllRooms = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const rooms = await prismaClient_1.default.room.findMany({
        include: {
            bookings: true,
        },
    });
    // Filter out rooms that are safe to delete (no bookings)
    const deletableRooms = rooms.filter((room) => room.bookings.length === 0);
    if (deletableRooms.length === 0) {
        throw new error_handler_1.BadRequestError('No rooms can be deleted. All rooms are currently booked.');
    }
    // Delete safe rooms
    await prismaClient_1.default.room.deleteMany({
        where: {
            id: { in: deletableRooms.map((r) => r.id) },
        },
    });
    // Clean up Cloudinary photos for deletable rooms
    const cleanupPromises = deletableRooms
        .filter((room) => room.photo)
        .map(async (room) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(room.photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${room.photo}:`, cleanupError);
        }
    });
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Deleted ${deletableRooms.length} room(s) successfully`,
        skipped: rooms.length - deletableRooms.length,
    });
});
exports.deleteAllRooms = deleteAllRooms;
