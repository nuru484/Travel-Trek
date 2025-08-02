// src/controllers/hotel/hotel-controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { param } from 'express-validator';
import prisma from '../config/prismaClient';
import validationMiddleware from '../middlewares/validation';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IHotelInput, IHotelResponse } from 'types/hotel.types';
import multerUpload from '../config/multer';
import conditionalCloudinaryUpload from '../middlewares/conditional-cloudinary-upload';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../config/constants';
import { cloudinaryService } from '../config/claudinary';
import {
  createHotelValidation,
  updateHotelValidation,
  getHotelsValidation,
  hotelPhotoValidation,
  hotelsByDestinationValidation,
  hotelAvailabilityValidation,
} from '../validations/hotel-validation';

/**
 * Create a new hotel
 */
const handleCreateHotel = asyncHandler(
  async (
    req: Request<{}, {}, IHotelInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const {
      name,
      description,
      address,
      city,
      country,
      phone,
      starRating,
      amenities,
      destinationId,
    } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can create hotels');
    }

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    // Get photo URL from middleware processing
    const photoUrl = req.body.hotelPhoto;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        description,
        address,
        city,
        country,
        phone,
        starRating: starRating || 3, // Default to 3 stars if not provided
        amenities: amenities || [],
        photo: typeof photoUrl === 'string' ? photoUrl : null,
        destination: { connect: { id: destinationId } },
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

    const response: IHotelResponse = {
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

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Hotel created successfully',
      data: response,
    });
  },
);

/**
 * Get a single hotel by ID
 */
const handleGetHotel = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
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
      throw new NotFoundError('Hotel not found');
    }

    const response: IHotelResponse = {
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Hotel retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update a hotel with photo handling
 */
const handleUpdateHotel = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<IHotelInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const {
      name,
      description,
      address,
      city,
      country,
      phone,
      starRating,
      amenities,
      destinationId,
    } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can update hotels');
    }

    if (!id) {
      throw new NotFoundError('Hotel ID is required');
    }

    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl: string | undefined;
    let oldPhoto: string | null = null;

    try {
      // First, get the current hotel to check for existing photo
      const existingHotel = await prisma.hotel.findUnique({
        where: { id: parseInt(id) },
        select: { photo: true },
      });

      if (!existingHotel) {
        throw new NotFoundError('Hotel not found');
      }

      oldPhoto = existingHotel.photo;

      // Check if destination exists if provided
      if (destinationId) {
        const destination = await prisma.destination.findUnique({
          where: { id: destinationId },
        });
        if (!destination) {
          throw new NotFoundError('Destination not found');
        }
      }

      // Prepare update data
      const updateData: any = {};

      // Only update fields that are provided
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (country !== undefined) updateData.country = country;
      if (phone !== undefined) updateData.phone = phone;
      if (starRating !== undefined) updateData.starRating = starRating;
      if (amenities !== undefined) updateData.amenities = amenities;
      if (destinationId !== undefined) updateData.destinationId = destinationId;

      // Handle photo - it should be a string URL after middleware processing
      if (req.body.hotelPhoto && typeof req.body.hotelPhoto === 'string') {
        updateData.photo = req.body.hotelPhoto;
        uploadedImageUrl = req.body.hotelPhoto;
      }

      // Update hotel in database
      const updatedHotel = await prisma.hotel.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // If we successfully updated with a new photo, clean up the old one
      if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(oldPhoto);
        } catch (cleanupError) {
          console.warn('Failed to clean up old hotel photo:', cleanupError);
        }
      }

      const response: IHotelResponse = {
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

      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Hotel updated successfully',
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
 * Delete a hotel with photo cleanup
 */
const handleDeleteHotel = asyncHandler(
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
      throw new UnauthorizedError('Only admins and agents can delete hotels');
    }

    if (!id) {
      throw new NotFoundError('Hotel ID is required');
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    // Delete from database first
    await prisma.hotel.delete({
      where: { id: parseInt(id) },
    });

    // Clean up photo from Cloudinary if it exists
    if (hotel.photo) {
      try {
        await cloudinaryService.deleteImage(hotel.photo);
      } catch (cleanupError) {
        console.warn(
          'Failed to clean up hotel photo from Cloudinary:',
          cleanupError,
        );
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Hotel deleted successfully',
    });
  },
);

/**
 * Get all hotels with pagination and filtering
 */
const handleGetAllHotels = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Extract search and filter parameters
    const search = req.query.search as string;
    const destinationId = req.query.destinationId
      ? parseInt(req.query.destinationId as string)
      : undefined;
    const city = req.query.city as string;
    const country = req.query.country as string;
    const starRating = req.query.starRating
      ? parseInt(req.query.starRating as string)
      : undefined;
    const minStarRating = req.query.minStarRating
      ? parseInt(req.query.minStarRating as string)
      : undefined;
    const maxStarRating = req.query.maxStarRating
      ? parseInt(req.query.maxStarRating as string)
      : undefined;
    const amenities = req.query.amenities as string | string[];
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build where clause for filtering
    const where: any = {};

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
      if (minStarRating) where.starRating.gte = minStarRating;
      if (maxStarRating) where.starRating.lte = maxStarRating;
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      where.amenities = {
        hasEvery: amenitiesArray,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
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
      prisma.hotel.count({ where }),
    ]);

    const response: IHotelResponse[] = hotels.map((hotel) => ({
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

    res.status(HTTP_STATUS_CODES.OK).json({
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
  },
);

/**
 * Get hotels by destination
 */
const handleGetHotelsByDestination = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { destinationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: parseInt(destinationId) },
    });

    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
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
      prisma.hotel.count({
        where: { destinationId: parseInt(destinationId) },
      }),
    ]);

    const response: IHotelResponse[] = hotels.map((hotel) => ({
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

    res.status(HTTP_STATUS_CODES.OK).json({
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
  },
);

/**
 * Check hotel availability
 */
const handleCheckHotelAvailability = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    const hotel = await prisma.hotel.findUnique({
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
      throw new NotFoundError('Hotel not found');
    }

    // Filter rooms by guest capacity if specified
    let availableRooms = hotel.rooms;
    if (guests) {
      availableRooms = hotel.rooms.filter((room) => room.capacity >= guests);
    }

    // Here you would typically check for existing bookings between checkIn and checkOut dates
    // For now, we'll return all available rooms that meet the criteria

    res.status(HTTP_STATUS_CODES.OK).json({
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
  },
);

/**
 * Delete all hotels with photo cleanup
 */
const handleDeleteAllHotels = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all hotels');
    }

    // Get all hotels with photos before deleting
    const hotels = await prisma.hotel.findMany({
      select: { photo: true },
      where: { photo: { not: null } },
    });

    // Delete from database first
    await prisma.hotel.deleteMany({});

    // Clean up photos from Cloudinary
    const cleanupPromises = hotels
      .filter((hotel) => hotel.photo)
      .map(async (hotel) => {
        try {
          await cloudinaryService.deleteImage(hotel.photo!);
        } catch (cleanupError) {
          console.warn(
            `Failed to clean up photo ${hotel.photo}:`,
            cleanupError,
          );
        }
      });

    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All hotels deleted successfully',
    });
  },
);

// Middleware arrays with validations
export const createHotel: RequestHandler[] = [
  ...validationMiddleware.create([
    ...createHotelValidation,
    ...hotelPhotoValidation,
  ]),
  multerUpload.single('hotelPhoto'),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
  handleCreateHotel,
];

export const getHotel: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetHotel,
];

export const updateHotel: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create([
    ...updateHotelValidation,
    ...hotelPhotoValidation,
  ]),
  multerUpload.single('hotelPhoto'),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
  handleUpdateHotel,
];

export const deleteHotel: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleDeleteHotel,
];

export const getAllHotels: RequestHandler[] = [
  ...validationMiddleware.create(getHotelsValidation),
  handleGetAllHotels,
];

export const getHotelsByDestination: RequestHandler[] = [
  param('destinationId')
    .isInt({ min: 1 })
    .withMessage('Destination ID must be a positive integer'),
  ...validationMiddleware.create(hotelsByDestinationValidation),
  handleGetHotelsByDestination,
];

export const checkHotelAvailability: RequestHandler[] = [
  param('hotelId')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create(hotelAvailabilityValidation),
  handleCheckHotelAvailability,
];

export const deleteAllHotels: RequestHandler[] = [handleDeleteAllHotels];
