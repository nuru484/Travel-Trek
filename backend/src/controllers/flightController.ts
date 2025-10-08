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
      stops,
      capacity,
    } = req.body;
    const user = req.user;

    const [origin, destination] = await Promise.all([
      prisma.destination.findUnique({ where: { id: Number(originId) } }),
      prisma.destination.findUnique({ where: { id: Number(destinationId) } }),
    ]);

    if (!origin || !destination) {
      throw new NotFoundError('Origin or destination not found');
    }

    const departureDate = new Date(departure);
    const arrivalDate = new Date(arrival);
    const durationInMinutes = Math.round(
      (arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60),
    );

    if (durationInMinutes <= 0) {
      throw new BadRequestError('Arrival time must be after departure time');
    }

    const photoUrl = req.body.flightPhoto;

    const flight = await prisma.flight.create({
      data: {
        flightNumber,
        airline,
        departure: departureDate,
        arrival: arrivalDate,
        origin: { connect: { id: Number(originId) } },
        destination: { connect: { id: Number(destinationId) } },
        price: +price,
        flightClass,
        duration: durationInMinutes,
        stops: stops ? Number(stops) : 0,
        photo: typeof photoUrl === 'string' ? photoUrl : null,
        seatsAvailable: capacity,
        capacity: capacity,
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
      capacity: flight.capacity,
      createdAt: flight.createdAt,
      updatedAt: flight.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Flight created successfully',
      data: response,
    });
  },
);

export const createFlight: RequestHandler[] = [
  multerUpload.single('flightPhoto'),
  ...validationMiddleware.create([
    ...createFlightValidation,
    ...flightPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
  handleCreateFlight,
];

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
      capacity: flight.capacity,
      createdAt: flight.createdAt,
      updatedAt: flight.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Flight retrieved successfully',
      data: response,
    });
  },
);

export const getFlight: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be a positive integer'),
  handleGetFlight,
];

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
      stops,
      capacity,
    } = req.body;

    const parsedId = parseInt(id!);

    let uploadedImageUrl: string | undefined;
    let oldPhoto: string | null = null;

    try {
      const existingFlight = await prisma.flight.findUnique({
        where: { id: parsedId },
        include: {
          bookings: {
            select: { id: true },
          },
        },
      });

      if (!existingFlight) {
        throw new NotFoundError('Flight not found');
      }

      oldPhoto = existingFlight.photo;
      const now = new Date();
      const bookedSeats =
        existingFlight.capacity - existingFlight.seatsAvailable;
      const hasBookings = existingFlight.bookings.length > 0;

      if (existingFlight.departure <= now) {
        throw new BadRequestError(
          'Cannot update flight that has already departed',
        );
      }

      if (existingFlight.arrival <= now) {
        throw new BadRequestError(
          'Cannot update flight that has already arrived',
        );
      }

      const newDeparture = departure
        ? new Date(departure)
        : existingFlight.departure;
      const newArrival = arrival ? new Date(arrival) : existingFlight.arrival;

      if (departure && new Date(departure) <= now) {
        throw new BadRequestError('Departure time must be in the future');
      }

      if (arrival && new Date(arrival) <= now) {
        throw new BadRequestError('Arrival time must be in the future');
      }

      if (newArrival <= newDeparture) {
        throw new BadRequestError('Arrival time must be after departure time');
      }

      if (
        hasBookings &&
        (originId !== undefined || destinationId !== undefined)
      ) {
        if (
          originId !== existingFlight.originId ||
          destinationId !== existingFlight.destinationId
        ) {
          throw new BadRequestError(
            'Cannot change flight route (origin/destination) when bookings exist. Please cancel all bookings first or create a new flight.',
          );
        }
      }

      if (capacity !== undefined) {
        if (capacity < bookedSeats) {
          throw new BadRequestError(
            `Cannot reduce capacity to ${capacity}. ${bookedSeats} seats are already booked. Minimum capacity allowed is ${bookedSeats}.`,
          );
        }

        if (capacity > existingFlight.capacity) {
          const additionalSeats = capacity - existingFlight.capacity;
        }
      }

      if (originId || destinationId) {
        const [origin, destination] = await Promise.all([
          originId
            ? prisma.destination.findUnique({ where: { id: originId } })
            : null,
          destinationId
            ? prisma.destination.findUnique({
                where: { id: destinationId },
              })
            : null,
        ]);

        if ((originId && !origin) || (destinationId && !destination)) {
          throw new NotFoundError('Origin or destination not found');
        }
      }

      let calculatedDuration: number | undefined;
      if (departure !== undefined || arrival !== undefined) {
        const durationInMinutes = Math.round(
          (newArrival.getTime() - newDeparture.getTime()) / (1000 * 60),
        );
        calculatedDuration = durationInMinutes;
      }

      const updateData: any = {};

      if (flightNumber !== undefined) {
        updateData.flightNumber = flightNumber;
      }
      if (airline !== undefined) {
        updateData.airline = airline;
      }
      if (departure !== undefined) {
        updateData.departure = newDeparture;
      }
      if (arrival !== undefined) {
        updateData.arrival = newArrival;
      }
      if (calculatedDuration !== undefined) {
        updateData.duration = calculatedDuration;
      }
      if (originId !== undefined) {
        updateData.origin = { connect: { id: originId } };
      }
      if (destinationId !== undefined) {
        updateData.destination = { connect: { id: destinationId } };
      }
      if (prisma !== undefined) {
        updateData.price = price;
      }
      if (flightClass !== undefined) {
        updateData.flightClass = flightClass;
      }
      if (stops !== undefined) {
        updateData.stops = stops;
      }
      if (capacity !== undefined) {
        updateData.capacity = capacity;
        updateData.seatsAvailable = capacity - bookedSeats;
      }

      if (req.body.flightPhoto && typeof req.body.flightPhoto === 'string') {
        updateData.photo = req.body.flightPhoto;
        uploadedImageUrl = req.body.flightPhoto;
      }

      const updatedFlight = await prisma.flight.update({
        where: { id: parsedId },
        data: updateData,
      });

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
        capacity: updatedFlight.capacity,
        createdAt: updatedFlight.createdAt,
        updatedAt: updatedFlight.updatedAt,
      };

      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Flight updated successfully',
        data: response,
      });
    } catch (error) {
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

export const updateFlight: RequestHandler[] = [
  multerUpload.single('flightPhoto'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be an integer greater than or equal to 1'),
  ...validationMiddleware.create([
    ...updateFlightValidation,
    ...flightPhotoValidation,
  ]),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'flightPhoto'),
  handleUpdateFlight,
];

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

    const flights = await prisma.flight.findMany({
      include: { bookings: true },
    });

    if (flights.length === 0) {
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'No flights found to delete',
      });
      return;
    }

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

    const photos = flights
      .map((flight) => flight.photo)
      .filter((photo): photo is string => Boolean(photo));

    // Delete all flights
    await prisma.flight.deleteMany({});

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
