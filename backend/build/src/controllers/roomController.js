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
/**
 * Create a new room
 */
const handleCreateRoom = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { hotelId, roomType, price, capacity, description, available } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can create rooms');
    }
    // Check if hotel exists
    const hotel = await prismaClient_1.default.hotel.findUnique({
        where: { id: Number(hotelId) },
    });
    if (!hotel) {
        throw new error_handler_1.NotFoundError('Hotel not found');
    }
    // Get photo URL from middleware processing
    const photoUrl = req.body.roomPhoto;
    const room = await prismaClient_1.default.room.create({
        data: {
            hotel: { connect: { id: Number(hotelId) } },
            roomType,
            price: Number(price),
            capacity: Number(capacity),
            description,
            photo: typeof photoUrl === 'string' ? photoUrl : null,
            available: Boolean(available) ?? true,
        },
    });
    const response = {
        id: room.id,
        hotelId: room.hotelId,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        photo: room.photo,
        available: room.available,
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
    });
    if (!room) {
        throw new error_handler_1.NotFoundError('Room not found');
    }
    const response = {
        id: room.id,
        hotelId: room.hotelId,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        photo: room.photo,
        available: room.available,
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
    const { hotelId, roomType, price, capacity, description, available } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can update rooms');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Room ID is required');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldPhoto = null;
    try {
        // First, get the current room to check for existing photo
        const existingRoom = await prismaClient_1.default.room.findUnique({
            where: { id: parseInt(id) },
            select: { photo: true },
        });
        if (!existingRoom) {
            throw new error_handler_1.NotFoundError('Room not found');
        }
        oldPhoto = existingRoom.photo;
        // Check if hotel exists if provided
        if (hotelId) {
            const hotel = await prismaClient_1.default.hotel.findUnique({
                where: { id: hotelId },
            });
            if (!hotel) {
                throw new error_handler_1.NotFoundError('Hotel not found');
            }
        }
        // Prepare update data
        const updateData = {};
        // Only update fields that are provided
        if (hotelId !== undefined) {
            updateData.hotel = { connect: { id: hotelId } };
        }
        if (roomType !== undefined) {
            updateData.roomType = roomType;
        }
        if (price !== undefined) {
            updateData.price = price;
        }
        if (capacity !== undefined) {
            updateData.capacity = capacity;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (available !== undefined) {
            updateData.available = available;
        }
        // Handle photo - it should be a string URL after middleware processing
        if (req.body.roomPhoto && typeof req.body.roomPhoto === 'string') {
            updateData.photo = req.body.roomPhoto;
            uploadedImageUrl = req.body.roomPhoto;
        }
        // Update room in database
        const updatedRoom = await prismaClient_1.default.room.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        // If we successfully updated with a new photo, clean up the old one
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
            hotelId: updatedRoom.hotelId,
            roomType: updatedRoom.roomType,
            price: updatedRoom.price,
            capacity: updatedRoom.capacity,
            description: updatedRoom.description,
            photo: updatedRoom.photo,
            available: updatedRoom.available,
            createdAt: updatedRoom.createdAt,
            updatedAt: updatedRoom.updatedAt,
        };
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Room updated successfully',
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
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        throw new error_handler_1.UnauthorizedError('Only admins and agents can delete rooms');
    }
    if (!id) {
        throw new error_handler_1.NotFoundError('Room ID is required');
    }
    const room = await prismaClient_1.default.room.findUnique({
        where: { id: parseInt(id) },
    });
    if (!room) {
        throw new error_handler_1.NotFoundError('Room not found');
    }
    // Delete from database first
    await prismaClient_1.default.room.delete({
        where: { id: parseInt(id) },
    });
    // Clean up photo from Cloudinary if it exists
    if (room.photo) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(room.photo);
        }
        catch (cleanupError) {
            console.warn('Failed to clean up room photo from Cloudinary:', cleanupError);
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Room deleted successfully',
    });
});
exports.deleteRoom = deleteRoom;
/**
 * Get all rooms with pagination
 */
const getAllRooms = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
        prismaClient_1.default.room.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.room.count(),
    ]);
    const response = rooms.map((room) => ({
        id: room.id,
        hotelId: room.hotelId,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        photo: room.photo,
        available: room.available,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Rooms retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllRooms = getAllRooms;
/**
 * Delete all rooms with photo cleanup
 */
const deleteAllRooms = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    if (user.role !== 'ADMIN') {
        throw new error_handler_1.UnauthorizedError('Only admins can delete all rooms');
    }
    // Get all rooms with photos before deleting
    const rooms = await prismaClient_1.default.room.findMany({
        select: { photo: true },
        where: { photo: { not: null } },
    });
    // Delete from database first
    await prismaClient_1.default.room.deleteMany({});
    // Clean up photos from Cloudinary
    const cleanupPromises = rooms
        .filter((room) => room.photo)
        .map(async (room) => {
        try {
            await claudinary_1.cloudinaryService.deleteImage(room.photo);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up photo ${room.photo}:`, cleanupError);
        }
    });
    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'All rooms deleted successfully',
    });
});
exports.deleteAllRooms = deleteAllRooms;
