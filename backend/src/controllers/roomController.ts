import { Request, Response, NextFunction, RequestHandler } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IRoomInput, IRoomResponse } from 'types/room.types';
import multerUpload from '../config/multer';
import conditionalCloudinaryUpload from '../middlewares/conditional-cloudinary-upload';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../config/constants';
import { cloudinaryService } from '../config/claudinary';

/**
 * Create a new room
 */
const handleCreateRoom = asyncHandler(
  async (
    req: Request<{}, {}, IRoomInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { hotelId, roomType, price, capacity, description, available } =
      req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can create rooms');
    }

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    // Get photo URL from middleware processing
    const photoUrl = req.body.roomPhoto;

    const room = await prisma.room.create({
      data: {
        hotel: { connect: { id: hotelId } },
        roomType,
        price,
        capacity,
        description,
        photo: typeof photoUrl === 'string' ? photoUrl : null,
        available: available ?? true,
      },
    });

    const response: IRoomResponse = {
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

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Room created successfully',
      data: response,
    });
  },
);

/**
 * Middleware array for room creation
 */
const createRoom: RequestHandler[] = [
  multerUpload.single('roomPhoto'),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'roomPhoto'),
  handleCreateRoom,
];

/**
 * Get a single room by ID
 */
const getRoom = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const response: IRoomResponse = {
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Room retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update a room with photo handling
 */
const handleUpdateRoom = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<IRoomInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { hotelId, roomType, price, capacity, description, available } =
      req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can update rooms');
    }

    if (!id) {
      throw new NotFoundError('Room ID is required');
    }

    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl: string | undefined;
    let oldPhoto: string | null = null;

    try {
      // First, get the current room to check for existing photo
      const existingRoom = await prisma.room.findUnique({
        where: { id: parseInt(id) },
        select: { photo: true },
      });

      if (!existingRoom) {
        throw new NotFoundError('Room not found');
      }

      oldPhoto = existingRoom.photo;

      // Check if hotel exists if provided
      if (hotelId) {
        const hotel = await prisma.hotel.findUnique({
          where: { id: hotelId },
        });
        if (!hotel) {
          throw new NotFoundError('Hotel not found');
        }
      }

      // Prepare update data
      const updateData: any = {};

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
      const updatedRoom = await prisma.room.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // If we successfully updated with a new photo, clean up the old one
      if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(oldPhoto);
        } catch (cleanupError) {
          console.warn('Failed to clean up old room photo:', cleanupError);
        }
      }

      const response: IRoomResponse = {
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

      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Room updated successfully',
        data: response,
      });
    } catch (error) {
      // If Cloudinary upload succeeded but DB update failed, clean up uploaded image
      if (uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error('Failed to clean up Cloudinary image:', cleanupError);
        }
      }
      next(error);
    }
  },
);

/**
 * Middleware array for room update
 */
const updateRoom: RequestHandler[] = [
  multerUpload.single('roomPhoto'),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'roomPhoto'),
  handleUpdateRoom,
];

/**
 * Delete a room with photo cleanup
 */
const deleteRoom = asyncHandler(
  async (
    req: Request<{ id?: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can delete rooms');
    }

    if (!id) {
      throw new NotFoundError('Room ID is required');
    }

    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Delete from database first
    await prisma.room.delete({
      where: { id: parseInt(id) },
    });

    // Clean up photo from Cloudinary if it exists
    if (room.photo) {
      try {
        await cloudinaryService.deleteImage(room.photo);
      } catch (cleanupError) {
        console.warn(
          'Failed to clean up room photo from Cloudinary:',
          cleanupError,
        );
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Room deleted successfully',
    });
  },
);

/**
 * Get all rooms with pagination
 */
const getAllRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.room.count(),
    ]);

    const response: IRoomResponse[] = rooms.map((room) => ({
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Rooms retrieved successfully',
      data: response,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);

/**
 * Delete all rooms with photo cleanup
 */
const deleteAllRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all rooms');
    }

    // Get all rooms with photos before deleting
    const rooms = await prisma.room.findMany({
      select: { photo: true },
      where: { photo: { not: null } },
    });

    // Delete from database first
    await prisma.room.deleteMany({});

    // Clean up photos from Cloudinary
    const cleanupPromises = rooms
      .filter((room) => room.photo)
      .map(async (room) => {
        try {
          await cloudinaryService.deleteImage(room.photo!);
        } catch (cleanupError) {
          console.warn(`Failed to clean up photo ${room.photo}:`, cleanupError);
        }
      });

    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All rooms deleted successfully',
    });
  },
);

export {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getAllRooms,
  deleteAllRooms,
};
