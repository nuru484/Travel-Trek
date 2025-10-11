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
} from '../validations/tour-validation';
import validationMiddleware from '../middlewares/validation';
import logger from '../utils/logger';

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
    // First check if there are any tours at all
    const tourCount = await prisma.tour.count();

    if (tourCount === 0) {
      throw new BadRequestError('No tours found to delete.');
    }

    const tours = await prisma.tour.findMany({
      include: {
        bookings: {
          include: {
            payment: true,
          },
        },
      },
    });

    const now = new Date();
    const deletionResults = {
      deletable: [] as number[],
      skippedReasons: {
        hasActiveBookings: [] as number[],
        hasPaidBookings: [] as number[],
        alreadyStarted: [] as number[],
        statusOngoingOrCompleted: [] as number[],
        hasGuestsBooked: [] as number[],
      },
    };

    tours.forEach((tour) => {
      let canDelete = true;

      // Check for active bookings
      const activeBookings = tour.bookings.filter((booking) =>
        ['PENDING', 'CONFIRMED'].includes(booking.status),
      );

      // Check for paid bookings
      const paidBookings = tour.bookings.filter(
        (booking) =>
          booking.payment &&
          ['COMPLETED', 'PENDING'].includes(booking.payment.status),
      );

      if (activeBookings.length > 0) {
        deletionResults.skippedReasons.hasActiveBookings.push(tour.id);
        canDelete = false;
      } else if (paidBookings.length > 0) {
        deletionResults.skippedReasons.hasPaidBookings.push(tour.id);
        canDelete = false;
      }

      if (tour.startDate <= now) {
        deletionResults.skippedReasons.alreadyStarted.push(tour.id);
        canDelete = false;
      }

      if (['ONGOING', 'COMPLETED'].includes(tour.status)) {
        deletionResults.skippedReasons.statusOngoingOrCompleted.push(tour.id);
        canDelete = false;
      }

      if (tour.guestsBooked > 0 && activeBookings.length === 0) {
        // Only flag if guests booked but no active bookings (data inconsistency)
        deletionResults.skippedReasons.hasGuestsBooked.push(tour.id);
        canDelete = false;
      }

      if (canDelete) {
        deletionResults.deletable.push(tour.id);
      }
    });

    const totalSkipped =
      deletionResults.skippedReasons.hasActiveBookings.length +
      deletionResults.skippedReasons.hasPaidBookings.length +
      deletionResults.skippedReasons.alreadyStarted.length +
      deletionResults.skippedReasons.statusOngoingOrCompleted.length +
      deletionResults.skippedReasons.hasGuestsBooked.length;

    if (deletionResults.deletable.length === 0) {
      const issues: string[] = [];

      if (deletionResults.skippedReasons.hasActiveBookings.length > 0) {
        issues.push('active bookings');
      }

      if (deletionResults.skippedReasons.hasPaidBookings.length > 0) {
        issues.push('payment records');
      }

      if (deletionResults.skippedReasons.alreadyStarted.length > 0) {
        issues.push('already started');
      }

      if (deletionResults.skippedReasons.statusOngoingOrCompleted.length > 0) {
        issues.push('ongoing/completed status');
      }

      if (deletionResults.skippedReasons.hasGuestsBooked.length > 0) {
        issues.push('guest records');
      }

      throw new BadRequestError(
        `Cannot delete tours with ${issues.join(', ')}. Please resolve these first.`,
      );
    }

    if (totalSkipped > 0) {
      logger.warn(
        `Skipping ${totalSkipped} tour(s): ` +
          `${deletionResults.skippedReasons.hasActiveBookings.length} with active bookings, ` +
          `${deletionResults.skippedReasons.hasPaidBookings.length} with payments, ` +
          `${deletionResults.skippedReasons.alreadyStarted.length} already started, ` +
          `${deletionResults.skippedReasons.statusOngoingOrCompleted.length} ongoing/completed, ` +
          `${deletionResults.skippedReasons.hasGuestsBooked.length} with guest records.`,
      );
    }

    // Delete tours in a transaction for data consistency
    await prisma.$transaction(async (tx) => {
      await tx.tour.deleteMany({
        where: {
          id: { in: deletionResults.deletable },
        },
      });
    });

    // Build concise response message
    let message = `Deleted ${deletionResults.deletable.length} tour(s) successfully`;

    if (totalSkipped > 0) {
      const skippedReasons: string[] = [];

      if (deletionResults.skippedReasons.hasActiveBookings.length > 0) {
        skippedReasons.push(
          `${deletionResults.skippedReasons.hasActiveBookings.length} with bookings`,
        );
      }

      if (deletionResults.skippedReasons.hasPaidBookings.length > 0) {
        skippedReasons.push(
          `${deletionResults.skippedReasons.hasPaidBookings.length} with payments`,
        );
      }

      if (deletionResults.skippedReasons.alreadyStarted.length > 0) {
        skippedReasons.push(
          `${deletionResults.skippedReasons.alreadyStarted.length} started`,
        );
      }

      if (deletionResults.skippedReasons.statusOngoingOrCompleted.length > 0) {
        skippedReasons.push(
          `${deletionResults.skippedReasons.statusOngoingOrCompleted.length} ongoing/completed`,
        );
      }

      if (deletionResults.skippedReasons.hasGuestsBooked.length > 0) {
        skippedReasons.push(
          `${deletionResults.skippedReasons.hasGuestsBooked.length} with guests`,
        );
      }

      message += `. Skipped: ${skippedReasons.join(', ')}`;
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message,
      deleted: deletionResults.deletable.length,
      skipped: totalSkipped,
      details: {
        deletedIds: deletionResults.deletable,
        skippedWithActiveBookings:
          deletionResults.skippedReasons.hasActiveBookings.length,
        skippedWithPayments:
          deletionResults.skippedReasons.hasPaidBookings.length,
        skippedAlreadyStarted:
          deletionResults.skippedReasons.alreadyStarted.length,
        skippedOngoingOrCompleted:
          deletionResults.skippedReasons.statusOngoingOrCompleted.length,
        skippedWithGuests:
          deletionResults.skippedReasons.hasGuestsBooked.length,
      },
    });
  },
);
