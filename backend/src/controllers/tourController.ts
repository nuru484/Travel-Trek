import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  BadRequestError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { ITourInput, ITourResponse } from 'types/tour.types';

/**
 * Create a new tour
 */
const createTour = asyncHandler(
  async (
    req: Request<{}, {}, ITourInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const {
      name,
      description,
      type,
      duration,
      price,
      maxGuests,
      startDate,
      endDate,
      location,
    } = req.body;
    const user = req.user;

    const tour = await prisma.tour.create({
      data: {
        name,
        description,
        type,
        duration,
        price,
        maxGuests,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

/**
 * Get a single tour by ID
 */
const getTour = asyncHandler(
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

/**
 * Update a tour
 */
const updateTour = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<ITourInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError('Tour ID is required');
    }
    const {
      name,
      description,
      type,
      duration,
      price,
      maxGuests,
      startDate,
      endDate,
      location,
    } = req.body;

    const tour = await prisma.tour.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const updatedTour = await prisma.tour.update({
      where: { id: parseInt(id) },
      data: {
        name: name ?? tour.name,
        description: description ?? tour.description,
        type: type ?? tour.type,
        duration: duration ?? tour.duration,
        price: price ?? tour.price,
        maxGuests: maxGuests ?? tour.maxGuests,
        startDate: startDate ? new Date(startDate) : tour.startDate,
        endDate: endDate ? new Date(endDate) : tour.endDate,
        location: location ?? tour.location,
      },
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
  },
);

/**
 * Delete a tour
 */
const deleteTour = asyncHandler(
  async (
    req: Request<{ id?: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError('Tour ID is required');
    }

    const tour = await prisma.tour.findUnique({
      where: { id: parseInt(id) },
      include: { bookings: true },
    });

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    if (tour.bookings.length > 0) {
      throw new BadRequestError(
        'Cannot delete tour with existing bookings. Please cancel or reassign bookings first.',
      );
    }

    if (tour.status === 'ONGOING' || tour.status === 'COMPLETED') {
      throw new BadRequestError(
        `Cannot delete tour with status "${tour.status}".`,
      );
    }

    // Delete tour
    await prisma.tour.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour deleted successfully',
    });
  },
);

/**
 * Get all tours with pagination
 */
const getAllTours = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tour.count(),
    ]);

    const response: ITourResponse[] = tours.map((tour) => ({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      type: tour.type,
      status: tour.status,
      duration: tour.duration,
      price: tour.price,
      maxGuests: tour.maxGuests,
      startDate: tour.startDate,
      endDate: tour.endDate,
      location: tour.location,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
    }));

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tours retrieved successfully',
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
 * Delete all tours
 */
const deleteAllTours = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get all tours with bookings
    const tours = await prisma.tour.findMany({
      include: { bookings: true },
    });

    // Filter out safe tours
    const deletableTours = tours.filter(
      (tour) =>
        tour.bookings.length === 0 &&
        tour.status !== 'ONGOING' &&
        tour.status !== 'COMPLETED',
    );

    if (deletableTours.length === 0) {
      throw new BadRequestError(
        'No tours can be deleted. All tours are either booked, ongoing, or completed.',
      );
    }

    // Delete safe tours
    await prisma.tour.deleteMany({
      where: {
        id: { in: deletableTours.map((t) => t.id) },
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Deleted ${deletableTours.length} tour(s) successfully`,
      skipped: tours.length - deletableTours.length,
    });
  },
);

export {
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getAllTours,
  deleteAllTours,
};
