// src/controllers/hotelController.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { param } from 'express-validator';
import prisma from '../config/prismaClient';
import validationMiddleware from '../middlewares/validation';
import {
  asyncHandler,
  NotFoundError,
  BadRequestError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import {
  IHotelInput,
  IHotelResponse,
  IHotelsPaginatedResponse,
  IHotelQueryParams,
} from 'types/hotel.types';
import multerUpload from '../config/multer';
import conditionalCloudinaryUpload from '../middlewares/conditional-cloudinary-upload';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../config/constants';
import { cloudinaryService } from '../config/claudinary';
import {
  createHotelValidation,
  updateHotelValidation,
  getHotelsValidation,
  hotelPhotoValidation,
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

    const destination = await prisma.destination.findUnique({
      where: { id: Number(destinationId) },
    });

    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const photoUrl = req.body.hotelPhoto;

    const parsedStarRating = starRating ? Number(starRating) : 3;

    const hotel = await prisma.hotel.create({
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
            description: true,
            country: true,
            city: true,
          },
        },
        rooms: {
          select: {
            id: true,
            roomType: true,
            description: true,
            photo: true,
            price: true,
          },
        },
      },
    });

    const response: IHotelResponse = {
      message: 'Hotel created successfully',
      data: {
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
        rooms: hotel.rooms,
        destination: {
          id: hotel.destination?.id,
          name: hotel.destination?.name,
          description: hotel.destination?.description,
          country: hotel.destination?.country,
        },
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
      },
    };

    res.status(HTTP_STATUS_CODES.CREATED).json(response);
  },
);

export const createHotel: RequestHandler[] = [
  multerUpload.single('hotelPhoto'),
  ...validationMiddleware.create([
    ...createHotelValidation,
    ...hotelPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
  handleCreateHotel,
];

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
            description: true,
            country: true,
            city: true,
          },
        },
        rooms: {
          select: {
            id: true,
            roomType: true,
            description: true,
            photo: true,
            price: true,
          },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    const response: IHotelResponse = {
      message: 'Hotel retrieved successfully',
      data: {
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
        rooms: hotel.rooms,
        destination: hotel.destination,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
      },
    };

    res.status(HTTP_STATUS_CODES.OK).json(response);
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

    console.log(
      name,
      description,
      address,
      city,
      country,
      phone,
      starRating,
      amenities,
      destinationId,
    );

    if (!id) {
      throw new NotFoundError('Hotel ID is required');
    }

    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl: string | undefined;
    let oldPhoto: string | null = null;

    try {
      // First, get the current hotel to check for existing photo
      const existingHotel = await prisma.hotel.findUnique({
        where: { id: Number(id) },
        select: { photo: true },
      });

      if (!existingHotel) {
        throw new NotFoundError('Hotel not found');
      }

      oldPhoto = existingHotel.photo;

      // Check if destination exists if provided
      if (destinationId) {
        const destination = await prisma.destination.findUnique({
          where: { id: Number(destinationId) },
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

      // Handle starRating conversion - convert string to number
      if (starRating !== undefined) {
        const parsedStarRating = Number(starRating);

        // Validate the star rating is within valid range (1-5)
        if (
          parsedStarRating < 1 ||
          parsedStarRating > 5 ||
          isNaN(parsedStarRating)
        ) {
          throw new Error('Star rating must be a number between 1 and 5');
        }

        updateData.starRating = parsedStarRating;
      }

      // Handle amenities - convert object to array if needed
      if (amenities !== undefined) {
        let processedAmenities: string[];

        if (Array.isArray(amenities)) {
          // Already an array
          processedAmenities = amenities;
        } else if (typeof amenities === 'object' && amenities !== null) {
          // Convert object like {"0": "item1", "1": "item2"} to array
          processedAmenities = Object.values(amenities).filter(
            (item): item is string => typeof item === 'string',
          );
        } else if (typeof amenities === 'string') {
          // Single string, convert to array
          processedAmenities = [amenities];
        } else {
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

      if (req.body.hotelPhoto && typeof req.body.hotelPhoto === 'string') {
        updateData.photo = req.body.hotelPhoto;
        uploadedImageUrl = req.body.hotelPhoto;
      }

      const updatedHotel = await prisma.hotel.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              description: true,
              country: true,
              city: true,
            },
          },
          rooms: {
            select: {
              id: true,
              roomType: true,
              photo: true,
              description: true,
              price: true,
            },
          },
        },
      });

      if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(oldPhoto);
        } catch (cleanupError) {
          console.warn('Failed to clean up old hotel photo:', cleanupError);
        }
      }

      const response: IHotelResponse = {
        message: 'Hotel updated successfully',
        data: {
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
          rooms: updatedHotel.rooms,
          destination: updatedHotel.destination,
          createdAt: updatedHotel.createdAt,
          updatedAt: updatedHotel.updatedAt,
        },
      };

      res.status(HTTP_STATUS_CODES.OK).json(response);
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

export const updateHotel: RequestHandler[] = [
  multerUpload.single('hotelPhoto'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create([
    ...updateHotelValidation,
    ...hotelPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'hotelPhoto'),
  handleUpdateHotel,
];

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

    if (!id) {
      throw new NotFoundError('Hotel ID is required');
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
      include: {
        rooms: true,
        destination: true,
      },
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    if (hotel.rooms.length > 0) {
      throw new BadRequestError(
        'Cannot delete hotel with existing rooms. Please remove rooms first.',
      );
    }

    if (hotel.destination) {
      throw new BadRequestError(
        `Cannot delete hotel while it is linked to destination "${hotel.destination.name}". Remove association first.`,
      );
    }

    await prisma.hotel.delete({
      where: { id: parseInt(id) },
    });

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
    const {
      page = 1,
      limit = 10,
      search,
      destinationId,
      city,
      country,
      starRating,
      minStarRating,
      maxStarRating,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    }: IHotelQueryParams = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

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
      where.destinationId = Number(destinationId);
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

    if (starRating) {
      where.starRating = Number(starRating);
    }

    if (minStarRating || maxStarRating) {
      where.starRating = {};
      if (minStarRating) where.starRating.gte = Number(minStarRating);
      if (maxStarRating) where.starRating.lte = Number(maxStarRating);
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      where.amenities = {
        hasEvery: amenitiesArray,
      };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              description: true,
              country: true,
              city: true,
            },
          },
          rooms: {
            select: {
              id: true,
              roomType: true,
              description: true,
              photo: true,
              price: true,
            },
          },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    const hotelData = hotels.map((hotel) => ({
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
      rooms: hotel.rooms,
      destination: hotel.destination,
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt,
    }));

    const response: IHotelsPaginatedResponse = {
      message: 'Hotels retrieved successfully',
      data: hotelData,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.status(HTTP_STATUS_CODES.OK).json(response);
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
              description: true,
              country: true,
              city: true,
            },
          },
          rooms: {
            select: {
              id: true,
              roomType: true,
              description: true,
              photo: true,
              price: true,
            },
          },
        },
      }),
      prisma.hotel.count({
        where: { destinationId: parseInt(destinationId) },
      }),
    ]);

    const hotelData = hotels.map((hotel) => ({
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
      rooms: hotel.rooms,
      destination: hotel.destination,
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt,
    }));

    const response: IHotelsPaginatedResponse = {
      message: 'Hotels retrieved successfully',
      data: hotelData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.status(HTTP_STATUS_CODES.OK).json(response);
  },
);

/**
 * Delete all hotels with photo cleanup
 */
const handleDeleteAllHotels = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const hotels = await prisma.hotel.findMany({
      include: {
        rooms: true,
        destination: true,
      },
    });

    const deletableHotels = hotels.filter(
      (hotel) => hotel.rooms.length === 0 && !hotel.destination,
    );

    if (deletableHotels.length === 0) {
      throw new BadRequestError(
        'No hotels can be deleted. Hotels with rooms or linked to destinations must be cleaned up first.',
      );
    }

    await prisma.hotel.deleteMany({
      where: {
        id: { in: deletableHotels.map((h) => h.id) },
      },
    });

    const cleanupPromises = deletableHotels
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

    await Promise.allSettled(cleanupPromises);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Deleted ${deletableHotels.length} hotel(s) successfully`,
      skipped: hotels.length - deletableHotels.length,
    });
  },
);

export const getHotel: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Hotel ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetHotel,
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
  handleGetHotelsByDestination,
];

export const deleteAllHotels: RequestHandler[] = [handleDeleteAllHotels];
