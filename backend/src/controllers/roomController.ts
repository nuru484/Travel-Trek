import { Request, Response, NextFunction, RequestHandler } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IRoomInput, IRoom, IRoomQueryParams } from 'types/room.types';
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
    const {
      hotelId,
      roomType,
      price,
      capacity,
      description,
      amenities,
      available,
    } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can create rooms');
    }

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(hotelId) },
      select: { id: true, name: true, description: true },
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    // Get photo URL from middleware processing
    const photoUrl = req.body.roomPhoto;

    const room = await prisma.room.create({
      data: {
        hotel: { connect: { id: Number(hotelId) } },
        roomType,
        price: Number(price),
        capacity: Number(capacity),
        description,
        amenities: amenities || [],
        photo: typeof photoUrl === 'string' ? photoUrl : null,
        available: Boolean(available) ?? true,
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

    const response: IRoom = {
      id: room.id,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      description: room.description,
      amenities: room.amenities,
      photo: room.photo,
      available: room.available,
      hotel: room.hotel,
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
      throw new NotFoundError('Room not found');
    }

    const response: IRoom = {
      id: room.id,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      description: room.description,
      amenities: room.amenities,
      photo: room.photo,
      available: room.available,
      hotel: room.hotel,
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
    const {
      hotelId,
      roomType,
      price,
      capacity,
      description,
      amenities,
      available,
    } = req.body;
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
          where: { id: Number(hotelId) },
          select: { id: true, name: true, description: true },
        });

        if (!hotel) {
          throw new NotFoundError('Hotel not found');
        }
      }

      // Prepare update data
      const updateData: any = {};

      // Only update fields that are provided
      if (hotelId !== undefined) {
        updateData.hotel = { connect: { id: Number(hotelId) } };
      }
      if (roomType !== undefined) {
        updateData.roomType = roomType;
      }
      if (price !== undefined) {
        updateData.price = Number(price);
      }
      if (capacity !== undefined) {
        updateData.capacity = Number(capacity);
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (amenities !== undefined) {
        updateData.amenities = amenities;
      }
      if (available !== undefined) {
        updateData.available = Boolean(available);
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

      // If we successfully updated with a new photo, clean up the old one
      if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(oldPhoto);
        } catch (cleanupError) {
          console.warn('Failed to clean up old room photo:', cleanupError);
        }
      }

      const response: IRoom = {
        id: updatedRoom.id,
        roomType: updatedRoom.roomType,
        price: updatedRoom.price,
        capacity: updatedRoom.capacity,
        description: updatedRoom.description,
        amenities: updatedRoom.amenities,
        photo: updatedRoom.photo,
        available: updatedRoom.available,
        hotel: updatedRoom.hotel,
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
      include: { bookings: true },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.bookings.length > 0) {
      throw new BadRequestError(
        'Cannot delete room with existing bookings. Please cancel or reassign bookings first.',
      );
    }

    // Delete from database
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
 * Get all rooms with pagination and filtering
 */
const getAllRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      hotelId,
      roomType,
      available,
      minPrice,
      maxPrice,
      minCapacity,
      maxCapacity,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    }: IRoomQueryParams = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

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
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = Number(minCapacity);
      if (maxCapacity) where.capacity.lte = Number(maxCapacity);
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      where.amenities = {
        hasEvery: amenitiesArray,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'price' || sortBy === 'capacity' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
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
      prisma.room.count({ where }),
    ]);

    const response: IRoom[] = rooms.map((room) => ({
      id: room.id,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      description: room.description,
      amenities: room.amenities,
      photo: room.photo,
      available: room.available,
      hotel: room.hotel,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Rooms retrieved successfully',
      data: response,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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

    // Get all rooms with bookings + photos
    const rooms = await prisma.room.findMany({
      include: {
        bookings: true,
      },
    });

    // Filter out rooms that are safe to delete (no bookings)
    const deletableRooms = rooms.filter((room) => room.bookings.length === 0);

    if (deletableRooms.length === 0) {
      throw new BadRequestError(
        'No rooms can be deleted. All rooms are currently booked.',
      );
    }

    // Delete safe rooms
    await prisma.room.deleteMany({
      where: {
        id: { in: deletableRooms.map((r) => r.id) },
      },
    });

    // Clean up Cloudinary photos for deletable rooms
    const cleanupPromises = deletableRooms
      .filter((room) => room.photo)
      .map(async (room) => {
        try {
          await cloudinaryService.deleteImage(room.photo!);
        } catch (cleanupError) {
          console.warn(`Failed to clean up photo ${room.photo}:`, cleanupError);
        }
      });

    await Promise.allSettled(cleanupPromises);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Deleted ${deletableRooms.length} room(s) successfully`,
      skipped: rooms.length - deletableRooms.length,
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
