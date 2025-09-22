// src/controllers/flight/flight-controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { param } from 'express-validator';
import prisma from '../config/prismaClient';
import validationMiddleware from '../middlewares/validation';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IFlightInput, IFlightResponse } from 'types/flight.types';
import multerUpload from '../config/multer';
import conditionalCloudinaryUpload from '../middlewares/conditional-cloudinary-upload';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../config/constants';
import { cloudinaryService } from '../config/claudinary';
import {
  createFlightValidation,
  updateFlightValidation,
  getFlightsValidation,
  flightPhotoValidation,
} from '../validations/flight-validation';

/**
 * Create a new flight
 */
const handleCreateFlight = asyncHandler(
  async (
    req: Request<{}, {}, IFlightInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const {
      flightNumber,
      airline,
      departure,
      arrival,
      originId,
      destinationId,
      price,
      flightClass,
      duration,
      stops,
      seatsAvailable,
    } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can create flights');
    }

    // Check if origin and destination exist
    const [origin, destination] = await Promise.all([
      prisma.destination.findUnique({ where: { id: Number(originId) } }),
      prisma.destination.findUnique({ where: { id: Number(destinationId) } }),
    ]);

    if (!origin || !destination) {
      throw new NotFoundError('Origin or destination not found');
    }

    // Get photo URL from middleware processing
    const photoUrl = req.body.flightPhoto;

    const flight = await prisma.flight.create({
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

    const response: IFlightResponse = {
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

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Flight created successfully',
      data: response,
    });
  },
);

/**
 * Get a single flight by ID
 */
const handleGetFlight = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const flight = await prisma.flight.findUnique({
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
      throw new NotFoundError('Flight not found');
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Flight retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update a flight with photo handling
 */
const handleUpdateFlight = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<IFlightInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const {
      flightNumber,
      airline,
      departure,
      arrival,
      originId,
      destinationId,
      price,
      flightClass,
      duration,
      stops,
      seatsAvailable,
    } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can update flights');
    }

    if (!id) {
      throw new NotFoundError('Flight ID is required');
    }

    // Parse numeric values to integers
    const parsedId = parseInt(id);
    const parsedOriginId = originId ? parseInt(String(originId)) : undefined;
    const parsedDestinationId = destinationId
      ? parseInt(String(destinationId))
      : undefined;
    const parsedPrice =
      price !== undefined ? parseFloat(String(price)) : undefined;
    const parsedDuration =
      duration !== undefined ? parseInt(String(duration)) : undefined;
    const parsedStops =
      stops !== undefined ? parseInt(String(stops)) : undefined;
    const parsedSeatsAvailable =
      seatsAvailable !== undefined
        ? parseInt(String(seatsAvailable))
        : undefined;

    // Validate parsed ID
    if (isNaN(parsedId)) {
      throw new NotFoundError('Invalid flight ID');
    }

    // Validate parsed numeric fields
    if (parsedOriginId !== undefined && isNaN(parsedOriginId)) {
      throw new BadRequestError('Invalid origin ID');
    }
    if (parsedDestinationId !== undefined && isNaN(parsedDestinationId)) {
      throw new BadRequestError('Invalid destination ID');
    }
    if (parsedPrice !== undefined && isNaN(parsedPrice)) {
      throw new BadRequestError('Invalid price value');
    }
    if (parsedDuration !== undefined && isNaN(parsedDuration)) {
      throw new BadRequestError('Invalid duration value');
    }
    if (parsedStops !== undefined && isNaN(parsedStops)) {
      throw new BadRequestError('Invalid stops value');
    }
    if (parsedSeatsAvailable !== undefined && isNaN(parsedSeatsAvailable)) {
      throw new BadRequestError('Invalid seats available value');
    }

    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl: string | undefined;
    let oldPhoto: string | null = null;

    try {
      // First, get the current flight to check for existing photo
      const existingFlight = await prisma.flight.findUnique({
        where: { id: parsedId },
        select: { photo: true },
      });

      if (!existingFlight) {
        throw new NotFoundError('Flight not found');
      }

      oldPhoto = existingFlight.photo;

      // Check if origin and destination exist if provided
      if (parsedOriginId || parsedDestinationId) {
        const [origin, destination] = await Promise.all([
          parsedOriginId
            ? prisma.destination.findUnique({ where: { id: parsedOriginId } })
            : null,
          parsedDestinationId
            ? prisma.destination.findUnique({
                where: { id: parsedDestinationId },
              })
            : null,
        ]);

        if (
          (parsedOriginId && !origin) ||
          (parsedDestinationId && !destination)
        ) {
          throw new NotFoundError('Origin or destination not found');
        }
      }

      // Prepare update data
      const updateData: any = {};

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
      const updatedFlight = await prisma.flight.update({
        where: { id: parsedId },
        data: updateData,
      });

      // If we successfully updated with a new photo, clean up the old one
      if (uploadedImageUrl && oldPhoto && oldPhoto !== uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(oldPhoto);
        } catch (cleanupError) {
          console.warn('Failed to clean up old flight photo:', cleanupError);
        }
      }

      const response: IFlightResponse = {
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

      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Flight updated successfully',
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
 * Delete a flight with photo cleanup
 */
const handleDeleteFlight = asyncHandler(
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
      throw new UnauthorizedError('Only admins and agents can delete flights');
    }

    if (!id) {
      throw new NotFoundError('Flight ID is required');
    }

    const flightId = parseInt(id);

    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: { bookings: true },
    });

    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    // Check if flight has bookings
    if (flight.bookings.length > 0) {
      throw new BadRequestError(
        `This flight cannot be deleted because it has ${flight.bookings.length} associated booking(s). Please cancel or reassign those bookings first.`,
      );
    }

    // Delete from database
    await prisma.flight.delete({
      where: { id: flightId },
    });

    // Clean up photo from Cloudinary if it exists
    if (flight.photo) {
      try {
        await cloudinaryService.deleteImage(flight.photo);
      } catch (cleanupError) {
        console.warn(
          'Failed to clean up flight photo from Cloudinary:',
          cleanupError,
        );
        // Not throwing here since deletion succeeded
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Flight deleted successfully',
    });
  },
);

/**
 * Get all flights with advanced filtering and search
 */
const handleGetAllFlights = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Extract search and filter parameters
    const {
      search,
      airline,
      originId,
      destinationId,
      flightClass,
      departureFrom,
      departureTo,
      minPrice,
      maxPrice,
      maxDuration,
      maxStops,
      minSeats,
      sortBy = 'departure',
      sortOrder = 'asc',
    } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { flightNumber: { contains: search as string, mode: 'insensitive' } },
        { airline: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (airline) {
      where.airline = { contains: airline as string, mode: 'insensitive' };
    }

    if (originId) {
      where.originId = parseInt(originId as string);
    }

    if (destinationId) {
      where.destinationId = parseInt(destinationId as string);
    }

    if (flightClass) {
      where.flightClass = flightClass as string;
    }

    if (departureFrom || departureTo) {
      where.departure = {};
      if (departureFrom) {
        where.departure.gte = new Date(departureFrom as string);
      }
      if (departureTo) {
        where.departure.lte = new Date(departureTo as string);
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice as string);
      }
    }

    if (maxDuration) {
      where.duration = { lte: parseInt(maxDuration as string) };
    }

    if (maxStops !== undefined) {
      where.stops = { lte: parseInt(maxStops as string) };
    }

    if (minSeats) {
      where.seatsAvailable = { gte: parseInt(minSeats as string) };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [flights, total] = await Promise.all([
      prisma.flight.findMany({
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
      prisma.flight.count({ where }),
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

    res.status(HTTP_STATUS_CODES.OK).json({
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
          originId: originId ? parseInt(originId as string) : undefined,
          destinationId: destinationId
            ? parseInt(destinationId as string)
            : undefined,
          flightClass,
          departureFrom,
          departureTo,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          maxDuration: maxDuration
            ? parseInt(maxDuration as string)
            : undefined,
          maxStops:
            maxStops !== undefined ? parseInt(maxStops as string) : undefined,
          minSeats: minSeats ? parseInt(minSeats as string) : undefined,
          sortBy,
          sortOrder,
        },
      },
    });
  },
);

/**
 * Delete all flights with photo cleanup
 */
const handleDeleteAllFlights = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all flights');
    }

    // Fetch all flights with bookings
    const flights = await prisma.flight.findMany({
      include: { bookings: true },
    });

    if (flights.length === 0) {
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'No flights found to delete',
      });
      return;
    }

    // Identify flights with bookings
    const blocked: {
      id: number;
      flightNumber: string;
      bookingCount: number;
    }[] = [];

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
        .map(
          (b) =>
            `Flight "${b.flightNumber}" (ID: ${b.id}) has ${b.bookingCount} booking(s)`,
        )
        .join('; ');

      throw new BadRequestError(
        `Some flights cannot be deleted because they have active bookings. ${details}`,
      );
    }

    // Collect photos before deleting
    const photos = flights
      .map((flight) => flight.photo)
      .filter((photo): photo is string => Boolean(photo));

    // Delete all flights
    await prisma.flight.deleteMany({});

    // Clean up photos from Cloudinary
    const cleanupPromises = photos.map(async (photo) => {
      try {
        await cloudinaryService.deleteImage(photo);
      } catch (cleanupError) {
        console.warn(`Failed to clean up photo ${photo}:`, cleanupError);
      }
    });

    await Promise.allSettled(cleanupPromises);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All flights deleted successfully',
    });
  },
);

/**
 * Get flight statistics (for admin dashboard)
 */
const getFlightStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError(
        'Only admins and agents can view flight statistics',
      );
    }

    const [
      totalFlights,
      totalSeats,
      averagePrice,
      flightsByClass,
      flightsByAirline,
      upcomingFlights,
    ] = await Promise.all([
      prisma.flight.count(),
      prisma.flight.aggregate({
        _sum: {
          seatsAvailable: true,
        },
      }),
      prisma.flight.aggregate({
        _avg: {
          price: true,
        },
      }),
      prisma.flight.groupBy({
        by: ['flightClass'],
        _count: true,
      }),
      prisma.flight.groupBy({
        by: ['airline'],
        _count: true,
        orderBy: {
          _count: {
            airline: 'desc',
          },
        },
        take: 10,
      }),
      prisma.flight.count({
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Flight statistics retrieved successfully',
      data: stats,
    });
  },
);

// Middleware arrays with validations
export const createFlight: RequestHandler[] = [
  multerUpload.single('flightPhoto'),
  ...validationMiddleware.create([
    ...createFlightValidation,
    ...flightPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
  handleCreateFlight,
];

export const getFlight: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetFlight,
];

export const updateFlight: RequestHandler[] = [
  multerUpload.single('flightPhoto'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be a positive integer'),
  ...validationMiddleware.create([
    ...updateFlightValidation,
    ...flightPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
  handleUpdateFlight,
];

export const deleteFlight: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleDeleteFlight,
];

export const getAllFlights: RequestHandler[] = [
  ...validationMiddleware.create(getFlightsValidation),
  handleGetAllFlights,
];

export const deleteAllFlights: RequestHandler[] = [handleDeleteAllFlights];

export const getFlightStatistics: RequestHandler[] = [getFlightStats];
