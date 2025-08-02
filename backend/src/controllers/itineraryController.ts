import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IItineraryInput, IItineraryResponse } from 'types/itinerary.types';

/**
 * Create a new itinerary
 */
const createItinerary = asyncHandler(
  async (
    req: Request<{}, {}, IItineraryInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { tourId, day, title, activities, description } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError(
        'Only admins and agents can create itineraries',
      );
    }

    // Validate tourId
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        tour: { connect: { id: tourId } },
        day,
        title,
        activities,
        description,
      },
    });

    const response: IItineraryResponse = {
      id: itinerary.id,
      tourId: itinerary.tourId,
      day: itinerary.day,
      title: itinerary.title,
      activities: itinerary.activities,
      description: itinerary.description,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Itinerary created successfully',
      data: response,
    });
  },
);

/**
 * Get a single itinerary by ID
 */
const getItinerary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(id) },
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary not found');
    }

    const response: IItineraryResponse = {
      id: itinerary.id,
      tourId: itinerary.tourId,
      day: itinerary.day,
      title: itinerary.title,
      activities: itinerary.activities,
      description: itinerary.description,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Itinerary retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update an itinerary
 */
const updateItinerary = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<IItineraryInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { tourId, day, title, activities, description } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError(
        'Only admins and agents can update itineraries',
      );
    }

    if (!id) {
      throw new NotFoundError('Itinerary ID is required');
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(id) },
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary not found');
    }

    // Validate tourId if provided
    if (tourId) {
      const tour = await prisma.tour.findUnique({
        where: { id: tourId },
      });
      if (!tour) {
        throw new NotFoundError('Tour not found');
      }
    }

    const updatedItinerary = await prisma.itinerary.update({
      where: { id: parseInt(id) },
      data: {
        tour: tourId ? { connect: { id: tourId } } : undefined,
        day: day ?? itinerary.day,
        title: title ?? itinerary.title,
        activities: activities ?? itinerary.activities,
        description: description ?? itinerary.description,
      },
    });

    const response: IItineraryResponse = {
      id: updatedItinerary.id,
      tourId: updatedItinerary.tourId,
      day: updatedItinerary.day,
      title: updatedItinerary.title,
      activities: updatedItinerary.activities,
      description: updatedItinerary.description,
      createdAt: updatedItinerary.createdAt,
      updatedAt: updatedItinerary.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Itinerary updated successfully',
      data: response,
    });
  },
);

/**
 * Delete an itinerary
 */
const deleteItinerary = asyncHandler(
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
      throw new UnauthorizedError(
        'Only admins and agents can delete itineraries',
      );
    }

    if (!id) {
      throw new NotFoundError('Itinerary ID is required');
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: parseInt(id) },
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary not found');
    }

    await prisma.itinerary.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Itinerary deleted successfully',
    });
  },
);

/**
 * Get all itineraries with pagination
 */
const getAllItineraries = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      prisma.itinerary.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.itinerary.count(),
    ]);

    const response: IItineraryResponse[] = itineraries.map((itinerary) => ({
      id: itinerary.id,
      tourId: itinerary.tourId,
      day: itinerary.day,
      title: itinerary.title,
      activities: itinerary.activities,
      description: itinerary.description,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
    }));

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Itineraries retrieved successfully',
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
 * Delete all itineraries
 */
const deleteAllItineraries = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all itineraries');
    }

    await prisma.itinerary.deleteMany({});

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All itineraries deleted successfully',
    });
  },
);

export {
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  getAllItineraries,
  deleteAllItineraries,
};
