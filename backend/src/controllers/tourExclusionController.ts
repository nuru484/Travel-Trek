// src/controllers/tourExclusionController.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import validationMiddleware from '../middlewares/validation';
import { HTTP_STATUS_CODES } from '../config/constants';
import {
  ITourExclusionInput,
  ITourExclusionResponse,
} from 'types/tourExclusion.types';
import { createTourExclusionValidation } from '../validations/tour-exlusion-validation';

/**
 * Create a new tour exclusion
 */
const handlerCreateTourExclusion = asyncHandler(
  async (
    req: Request<{}, {}, ITourExclusionInput>,
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
        'Only admins and agents can create tour exclusions',
      );
    }

    // Validate tourId
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const tourExclusion = await prisma.tourExclusion.create({
      data: {
        tour: { connect: { id: tourId } },
        description,
      },
    });

    const response: ITourExclusionResponse = {
      id: tourExclusion.id,
      tourId: tourExclusion.tourId,
      description: tourExclusion.description,
      createdAt: tourExclusion.createdAt,
      updatedAt: tourExclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Tour exclusion created successfully',
      data: response,
    });
  },
);

export const createTourExclusion: RequestHandler[] = [
  ...validationMiddleware.create([createTourExclusionValidation]),
  handlerCreateTourExclusion,
];

/**
 * Get a single tour exclusion by ID
 */
export const getTourExclusion = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const tourExclusion = await prisma.tourExclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourExclusion) {
      throw new NotFoundError('Tour exclusion not found');
    }

    const response: ITourExclusionResponse = {
      id: tourExclusion.id,
      tourId: tourExclusion.tourId,
      description: tourExclusion.description,
      createdAt: tourExclusion.createdAt,
      updatedAt: tourExclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour exclusion retrieved successfully',
      data: response,
    });
  },
);

/**
 * Update a tour exclusion
 */
export const updateTourExclusion = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<ITourExclusionInput>>,
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
        'Only admins and agents can update tour exclusions',
      );
    }

    if (!id) {
      throw new NotFoundError('Tour exclusion ID is required');
    }

    const tourExclusion = await prisma.tourExclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourExclusion) {
      throw new NotFoundError('Tour exclusion not found');
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

    const updatedTourExclusion = await prisma.tourExclusion.update({
      where: { id: parseInt(id) },
      data: {
        tour: tourId ? { connect: { id: tourId } } : undefined,
        description: description ?? tourExclusion.description,
      },
    });

    const response: ITourExclusionResponse = {
      id: updatedTourExclusion.id,
      tourId: updatedTourExclusion.tourId,
      description: updatedTourExclusion.description,
      createdAt: updatedTourExclusion.createdAt,
      updatedAt: updatedTourExclusion.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour exclusion updated successfully',
      data: response,
    });
  },
);

/**
 * Delete a tour exclusion
 */
export const deleteTourExclusion = asyncHandler(
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
        'Only admins and agents can delete tour exclusions',
      );
    }

    if (!id) {
      throw new NotFoundError('Tour exclusion ID is required');
    }

    const tourExclusion = await prisma.tourExclusion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tourExclusion) {
      throw new NotFoundError('Tour exclusion not found');
    }

    await prisma.tourExclusion.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour exclusion deleted successfully',
    });
  },
);

/**
 * Get all tour exclusions with pagination
 */
export const getAllTourExclusions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [tourExclusions, total] = await Promise.all([
      prisma.tourExclusion.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tourExclusion.count(),
    ]);

    const response: ITourExclusionResponse[] = tourExclusions.map(
      (tourExclusion) => ({
        id: tourExclusion.id,
        tourId: tourExclusion.tourId,
        description: tourExclusion.description,
        createdAt: tourExclusion.createdAt,
        updatedAt: tourExclusion.updatedAt,
      }),
    );

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Tour exclusions retrieved successfully',
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
 * Delete all tour exclusions
 */
export const deleteAllTourExclusions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all tour exclusions');
    }

    await prisma.tourExclusion.deleteMany({});

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All tour exclusions deleted successfully',
    });
  },
);
