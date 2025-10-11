import { Request, Response, NextFunction, RequestHandler } from 'express';
import { param } from 'express-validator';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { ITourInput, ITourResponse } from 'types/tour.types';
import {
  createTourValidation,
  updateTourValidation,
  getAllToursValidation,
  tourIdParamValidation,
} from '../validations/tour-validation';
import validationMiddleware from '../middlewares/validation';

/**
 * Create a new tour
 */
const handleCreateTour = asyncHandler(
  async (
    req: Request<{}, {}, ITourInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const {
      name,
      description,
      type,
      price,
      maxGuests,
      startDate,
      endDate,
      location,
    } = req.body;
    const user = req.user;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const tour = await prisma.tour.create({
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

    const response: ITourResponse = {
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

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Tour created successfully',
      data: response,
    });
  },
);

export const createTour: RequestHandler[] = [
  ...validationMiddleware.create(createTourValidation),
  handleCreateTour,
];

/**
 * Get a single tour by ID
 */
const handleGetTour = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const response: ITourResponse = {
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

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour retrieved successfully',
      data: response,
    });
  },
);

export const getTour: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tour ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetTour,
];

/**
 * Update a tour
 */
const handleUpdateTour = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<ITourInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      price,
      maxGuests,
      startDate,
      endDate,
      location,
    } = req.body;

    if (!id) {
      throw new NotFoundError('Tour ID is required');
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new NotFoundError('Invalid tour ID');
    }

    try {
      const existingTour = await prisma.tour.findUnique({
        where: { id: parsedId },
        include: {
          bookings: {
            select: { id: true },
          },
        },
      });

      if (!existingTour) {
        throw new NotFoundError('Tour not found');
      }

      const now = new Date();
      const hasBookings = existingTour.bookings.length > 0;
      const bookedGuests = existingTour.guestsBooked;

      if (existingTour.startDate <= now) {
        throw new BadRequestError(
          'Cannot update tour that has already started',
        );
      }

      if (existingTour.endDate <= now) {
        throw new BadRequestError('Cannot update tour that has already ended');
      }

      const newStartDate = startDate
        ? new Date(startDate)
        : existingTour.startDate;
      const newEndDate = endDate ? new Date(endDate) : existingTour.endDate;

      if (startDate && new Date(startDate) <= now) {
        throw new BadRequestError('Start date must be in the future');
      }

      if (endDate && new Date(endDate) <= now) {
        throw new BadRequestError('End date must be in the future');
      }

      if (newEndDate <= newStartDate) {
        throw new BadRequestError('End date must be after start date');
      }

      if (
        hasBookings &&
        location !== undefined &&
        location !== existingTour.location
      ) {
        throw new BadRequestError(
          'Cannot change tour location when bookings exist. Please cancel all bookings first or create a new tour.',
        );
      }

      if (maxGuests !== undefined) {
        if (maxGuests < bookedGuests) {
          throw new BadRequestError(
            `Cannot reduce max guests to ${maxGuests}. ${bookedGuests} guests are already booked. Minimum capacity allowed is ${bookedGuests}.`,
          );
        }
      }

      let calculatedDuration: number | undefined;
      if (startDate !== undefined || endDate !== undefined) {
        const durationInDays = Math.ceil(
          (newEndDate.getTime() - newStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        calculatedDuration = durationInDays;
      }

      const updateData: any = {};

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

      const updatedTour = await prisma.tour.update({
        where: { id: parsedId },
        data: updateData,
      });

      const response: ITourResponse = {
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

      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Tour updated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const updateTour: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tour ID must be a positive integer'),
  ...validationMiddleware.create(updateTourValidation),
  handleUpdateTour,
];

/**
 * Delete a tour
 */
const handleDeleteTour = asyncHandler(
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
      throw new UnauthorizedError('Only admins and agents can delete tours');
    }

    if (!id) {
      throw new NotFoundError('Tour ID is required');
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new NotFoundError('Invalid tour ID');
    }

    const tour = await prisma.tour.findUnique({
      where: { id: parsedId },
      include: { bookings: true },
    });

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const now = new Date();

    if (tour.startDate <= now) {
      throw new BadRequestError('Cannot delete tour that has already started');
    }

    if (tour.endDate <= now) {
      throw new BadRequestError('Cannot delete tour that has already ended');
    }

    if (tour.status === 'ONGOING') {
      throw new BadRequestError('Cannot delete tour with status "ONGOING"');
    }

    if (tour.status === 'COMPLETED') {
      throw new BadRequestError('Cannot delete tour with status "COMPLETED"');
    }

    // Check for existing bookings
    if (tour.bookings.length > 0) {
      throw new BadRequestError(
        'Cannot delete tour with existing bookings. Please cancel or reassign bookings first.',
      );
    }

    if (tour.guestsBooked > 0) {
      throw new BadRequestError(
        `Cannot delete tour with ${tour.guestsBooked} booked guest(s). Please cancel all bookings first.`,
      );
    }

    await prisma.tour.delete({
      where: { id: parsedId },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour deleted successfully',
    });
  },
);

export const deleteTour: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tour ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleDeleteTour,
];

/**
 * Get all tours with pagination
 */
const handleGetAllTours = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const location = req.query.location as string | undefined;
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const minDuration = req.query.minDuration as string | undefined;
    const maxDuration = req.query.maxDuration as string | undefined;
    const minGuests = req.query.minGuests as string | undefined;
    const maxGuests = req.query.maxGuests as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const availableOnly = req.query.availableOnly === 'true';
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder =
      (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const whereClause: any = {};

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
      const guestsFilter: any = {};
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
        lt: prisma.tour.fields.maxGuests,
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
    const orderByClause: any = {};
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
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
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
      prisma.tour.count({ where: whereClause }),
    ]);

    // Calculate average rating for each tour
    const response: ITourResponse[] = tours.map((tour) => {
      const avgRating =
        tour.reviews.length > 0
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

    res.status(HTTP_STATUS_CODES.OK).json(paginatedResponse);
  },
);

export const getAllTours: RequestHandler[] = [
  ...validationMiddleware.create(getAllToursValidation),
  handleGetAllTours,
];

/**
 * Delete all tours
 */
export const deleteAllTours = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tours = await prisma.tour.findMany({
      include: { bookings: true },
    });

    if (tours.length === 0) {
      throw new NotFoundError('No tours found to delete');
    }

    const now = new Date();
    const deletionResults = {
      deletable: [] as number[],
      skippedReasons: {
        hasBookings: [] as number[],
        alreadyStarted: [] as number[],
        alreadyEnded: [] as number[],
        statusOngoing: [] as number[],
        statusCompleted: [] as number[],
        hasGuestsBooked: [] as number[],
      },
    };

    tours.forEach((tour) => {
      let canDelete = true;

      if (tour.startDate <= now) {
        deletionResults.skippedReasons.alreadyStarted.push(tour.id);
        canDelete = false;
      }

      if (tour.endDate <= now) {
        deletionResults.skippedReasons.alreadyEnded.push(tour.id);
        canDelete = false;
      }

      if (tour.status === 'ONGOING') {
        deletionResults.skippedReasons.statusOngoing.push(tour.id);
        canDelete = false;
      }

      if (tour.status === 'COMPLETED') {
        deletionResults.skippedReasons.statusCompleted.push(tour.id);
        canDelete = false;
      }

      if (tour.bookings.length > 0) {
        deletionResults.skippedReasons.hasBookings.push(tour.id);
        canDelete = false;
      }

      if (tour.guestsBooked > 0) {
        deletionResults.skippedReasons.hasGuestsBooked.push(tour.id);
        canDelete = false;
      }

      if (canDelete) {
        deletionResults.deletable.push(tour.id);
      }
    });

    const totalSkipped =
      deletionResults.skippedReasons.hasBookings.length +
      deletionResults.skippedReasons.alreadyStarted.length +
      deletionResults.skippedReasons.alreadyEnded.length +
      deletionResults.skippedReasons.statusOngoing.length +
      deletionResults.skippedReasons.statusCompleted.length +
      deletionResults.skippedReasons.hasGuestsBooked.length;

    if (deletionResults.deletable.length === 0) {
      throw new BadRequestError(
        `Cannot delete tours. All ${tours.length} tour${tours.length > 1 ? 's have' : ' has'} active dependencies (bookings, ongoing status, or already started/completed). Please resolve these issues first.`,
      );
    }

    await prisma.tour.deleteMany({
      where: {
        id: { in: deletionResults.deletable },
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Deleted ${deletionResults.deletable.length} tour${deletionResults.deletable.length > 1 ? 's' : ''} successfully${totalSkipped > 0 ? `. ${totalSkipped} tour${totalSkipped > 1 ? 's' : ''} skipped due to dependencies` : ''}`,
      deleted: deletionResults.deletable.length,
      skipped: totalSkipped,
      totalProcessed: tours.length,
    });
  },
);
