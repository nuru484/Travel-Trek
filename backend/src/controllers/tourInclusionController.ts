import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import {
  ITourInclusionInput,
  ITourInclusionResponse,
} from 'types/tourInclusion.types';

/**
 * Create a new tour inclusion
 */
const createTourInclusion = asyncHandler(
  async (
    req: Request<{}, {}, ITourInclusionInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { tourId, description } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError(
        'Only admins and agents can create tour inclusions',
      );
    }

    // Validate tourId
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const tourInclusion = await prisma.tourInclusion.create({
      data: {
        tour: { connect: { id: tourId } },
        description,
      },
    });

    const response: ITourInclusionResponse = {
      id: tourInclusion.id,
      tourId: tourInclusion.tourId,
      description: tourInclusion.description,
      createdAt: tourInclusion.createdAt,
      updatedAt: tourInclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Tour inclusion created successfully',
      data: response,
    });
  },
);

/**
 * Get a single tour inclusion by ID
 */
const getTourInclusion = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const tourInclusion = await prisma.tourInclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourInclusion) {
      throw new NotFoundError('Tour inclusion not found');
    }

    const response: ITourInclusionResponse = {
      id: tourInclusion.id,
      tourId: tourInclusion.tourId,
      description: tourInclusion.description,
      createdAt: tourInclusion.createdAt,
      updatedAt: tourInclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour inclusion retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update a tour inclusion
 */
const updateTourInclusion = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<ITourInclusionInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { tourId, description } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError(
        'Only admins and agents can update tour inclusions',
      );
    }

    if (!id) {
      throw new NotFoundError('Tour inclusion ID is required');
    }

    const tourInclusion = await prisma.tourInclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourInclusion) {
      throw new NotFoundError('Tour inclusion not found');
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

    const updatedTourInclusion = await prisma.tourInclusion.update({
      where: { id: parseInt(id) },
      data: {
        tour: tourId ? { connect: { id: tourId } } : undefined,
        description: description ?? tourInclusion.description,
      },
    });

    const response: ITourInclusionResponse = {
      id: updatedTourInclusion.id,
      tourId: updatedTourInclusion.tourId,
      description: updatedTourInclusion.description,
      createdAt: updatedTourInclusion.createdAt,
      updatedAt: updatedTourInclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour inclusion updated successfully',
      data: response,
    });
  },
);

/**
 * Delete a tour inclusion
 */
const deleteTourInclusion = asyncHandler(
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
        'Only admins and agents can delete tour inclusions',
      );
    }

    if (!id) {
      throw new NotFoundError('Tour inclusion ID is required');
    }

    const tourInclusion = await prisma.tourInclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourInclusion) {
      throw new NotFoundError('Tour inclusion not found');
    }

    await prisma.tourInclusion.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour inclusion deleted successfully',
    });
  },
);

/**
 * Get all tour inclusions with pagination
 */
const getAllTourInclusions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [tourInclusions, total] = await Promise.all([
      prisma.tourInclusion.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tourInclusion.count(),
    ]);

    const response: ITourInclusionResponse[] = tourInclusions.map(
      (tourInclusion) => ({
        id: tourInclusion.id,
        tourId: tourInclusion.tourId,
        description: tourInclusion.description,
        createdAt: tourInclusion.createdAt,
        updatedAt: tourInclusion.updatedAt,
      }),
    );

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour inclusions retrieved successfully',
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
 * Delete all tour inclusions
 */
const deleteAllTourInclusions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all tour inclusions');
    }

    await prisma.tourInclusion.deleteMany({});

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All tour inclusions deleted successfully',
    });
  },
);

export {
  createTourInclusion,
  getTourInclusion,
  updateTourInclusion,
  deleteTourInclusion,
  getAllTourInclusions,
  deleteAllTourInclusions,
};
