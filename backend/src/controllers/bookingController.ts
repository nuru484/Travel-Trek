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
import { IBookingInput, IBooking } from 'types/booking.types';
import {
  createBookingValidation,
  updateBookingValidation,
  getBookingsValidation,
} from '../validations/bookingValidations';

/**
 * Create a new booking
 */
const handleCreateBooking = asyncHandler(
  async (
    req: Request<{}, {}, IBookingInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { userId, tourId, roomId, flightId, totalPrice } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role === 'CUSTOMER' && user.id !== userId.toString()) {
      throw new UnauthorizedError('Customers can only book for themselves');
    }

    if (!tourId && !roomId && !flightId) {
      throw new BadRequestError(
        'At least one of tourId, roomId, or flightId must be provided',
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundError('User not found');

    let tour = null;
    if (tourId) {
      tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (!tour) throw new NotFoundError('Tour not found');

      const availableSlots = tour.maxGuests - tour.guestsBooked;
      if (availableSlots <= 0) {
        throw new BadRequestError('No available slots for this tour');
      }

      if (tour.status === 'CANCELLED') {
        throw new BadRequestError('This tour has been cancelled');
      }
      if (tour.status === 'COMPLETED') {
        throw new BadRequestError('This tour has already been completed');
      }
    }

    let room = null;
    if (roomId) {
      room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundError('Room not found');

      if (room.roomsAvailable <= 0) {
        throw new BadRequestError('No rooms available of this type');
      }
    }

    let flight = null;
    if (flightId) {
      flight = await prisma.flight.findUnique({ where: { id: flightId } });
      if (!flight) throw new NotFoundError('Flight not found');

      if (flight.seatsAvailable <= 0) {
        throw new BadRequestError('No seats available on this flight');
      }
    }

    const booking = await prisma.$transaction(async (tx) => {
      if (tourId && tour) {
        await tx.tour.update({
          where: { id: tourId },
          data: { guestsBooked: { increment: 1 } },
        });
      }

      if (roomId && room) {
        await tx.room.update({
          where: { id: roomId },
          data: { roomsAvailable: { decrement: 1 } },
        });
      }

      if (flightId && flight) {
        await tx.flight.update({
          where: { id: flightId },
          data: { seatsAvailable: { decrement: 1 } },
        });
      }

      return await tx.booking.create({
        data: {
          user: { connect: { id: userId } },
          tour: tourId ? { connect: { id: tourId } } : undefined,
          room: roomId ? { connect: { id: roomId } } : undefined,
          flight: flightId ? { connect: { id: flightId } } : undefined,
          totalPrice,
          status: 'PENDING',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          tour: {
            select: { id: true, name: true, description: true },
          },
          room: {
            select: {
              id: true,
              roomType: true,
              description: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          flight: {
            select: { id: true, flightNumber: true, airline: true },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
            },
          },
        },
      });
    });

    let response: IBooking;

    if (booking.tour) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'TOUR',
        tour: booking.tour,
        room: null,
        flight: null,
        hotel: null,
      };
    } else if (booking.room) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'ROOM',
        room: booking.room ?? null,
        hotel: booking.room?.hotel ?? null,
        tour: null,
        flight: null,
      };
    } else if (booking.flight) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'FLIGHT',
        flight: booking.flight,
        tour: null,
        room: null,
        hotel: null,
      };
    } else {
      throw new Error('Booking has no associated item (tour, room, or flight)');
    }

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Booking created successfully',
      data: response,
    });
  },
);

// Middleware arrays with validations
export const createBooking: RequestHandler[] = [
  ...validationMiddleware.create(createBookingValidation),
  handleCreateBooking,
];

/**
 * Get a single booking by ID
 */
const handleGetBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tour: {
          select: { id: true, name: true, description: true },
        },
        room: {
          select: {
            id: true,
            roomType: true,
            description: true,
            hotel: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        flight: {
          select: { id: true, flightNumber: true, airline: true },
        },
        payment: {
          select: { id: true, amount: true, status: true, paymentMethod: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
      throw new UnauthorizedError('You can only view your own bookings');
    }

    let response: IBooking;

    if (booking.tour) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'TOUR',
        tour: booking.tour,
        room: null,
        flight: null,
        hotel: null,
      };
    } else if (booking.room) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'ROOM',
        room: booking.room ?? null,
        hotel: booking.room?.hotel ?? null,
        tour: null,
        flight: null,
      };
    } else if (booking.flight) {
      response = {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        payment: booking.payment,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        type: 'FLIGHT',
        flight: booking.flight,
        tour: null,
        room: null,
        hotel: null,
      };
    } else {
      throw new Error('Booking has no associated item (tour, room, or flight)');
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking retrieved successfully',
      data: response,
    });
  },
);

export const getBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetBooking,
];

/**
 * Update a booking
 */
const handleUpdateBooking = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, Partial<IBookingInput>>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { userId, tourId, roomId, flightId, totalPrice, status } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can update bookings');
    }

    if (!id) {
      throw new BadRequestError('Booking ID is required');
    }

    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      throw new BadRequestError('Invalid booking ID format');
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundError('Booking not found');
    }

    if (
      status === 'PENDING' &&
      existingBooking.payment?.status === 'COMPLETED'
    ) {
      throw new BadRequestError(
        'Cannot change booking status to PENDING when payment is completed',
      );
    }

    if (
      status === 'CANCELLED' &&
      existingBooking.payment?.status === 'COMPLETED'
    ) {
      throw new BadRequestError(
        'Cannot change booking status to CANCELLED when payment is completed',
      );
    }

    if (status && status !== existingBooking.status) {
      const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED'],
        CANCELLED: [],
        COMPLETED: [],
      };

      const allowedStatuses = validTransitions[existingBooking.status] || [];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestError(
          `Cannot transition booking status from ${existingBooking.status} to ${status}`,
        );
      }
    }

    if (
      (existingBooking.status === 'COMPLETED' ||
        existingBooking.status === 'CANCELLED') &&
      (tourId || roomId || flightId || userId)
    ) {
      throw new BadRequestError(
        `Cannot modify ${existingBooking.status.toLowerCase()} bookings`,
      );
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      if (userId) {
        const targetUser = await tx.user.findUnique({
          where: { id: userId },
        });
        if (!targetUser) throw new NotFoundError('User not found');
      }

      if (tourId && tourId !== existingBooking.tourId) {
        const tour = await tx.tour.findUnique({ where: { id: tourId } });
        if (!tour) throw new NotFoundError('Tour not found');

        const availableSlots = tour.maxGuests - tour.guestsBooked;
        if (availableSlots <= 0) {
          throw new BadRequestError('No available slots for this tour');
        }

        if (tour.status === 'CANCELLED') {
          throw new BadRequestError('This tour has been cancelled');
        }
        if (tour.status === 'COMPLETED') {
          throw new BadRequestError('This tour has already been completed');
        }

        if (existingBooking.tourId) {
          await tx.tour.update({
            where: { id: existingBooking.tourId },
            data: { guestsBooked: { decrement: 1 } },
          });
        }
        await tx.tour.update({
          where: { id: tourId },
          data: { guestsBooked: { increment: 1 } },
        });
      }

      if (roomId && roomId !== existingBooking.roomId) {
        const room = await tx.room.findUnique({ where: { id: roomId } });
        if (!room) throw new NotFoundError('Room not found');

        if (room.roomsAvailable <= 0) {
          throw new BadRequestError('No rooms available of this type');
        }

        // Update availabilities
        if (existingBooking.roomId) {
          await tx.room.update({
            where: { id: existingBooking.roomId },
            data: { roomsAvailable: { increment: 1 } },
          });
        }
        await tx.room.update({
          where: { id: roomId },
          data: { roomsAvailable: { decrement: 1 } },
        });
      }

      // Handle flight changes
      if (flightId && flightId !== existingBooking.flightId) {
        const flight = await tx.flight.findUnique({
          where: { id: flightId },
        });
        if (!flight) throw new NotFoundError('Flight not found');

        if (flight.seatsAvailable <= 0) {
          throw new BadRequestError('No seats available on this flight');
        }

        // Update availabilities
        if (existingBooking.flightId) {
          await tx.flight.update({
            where: { id: existingBooking.flightId },
            data: { seatsAvailable: { increment: 1 } },
          });
        }
        await tx.flight.update({
          where: { id: flightId },
          data: { seatsAvailable: { decrement: 1 } },
        });
      }

      // Update the booking
      return await tx.booking.update({
        where: { id: bookingId },
        data: {
          user: userId ? { connect: { id: userId } } : undefined,
          tour: tourId ? { connect: { id: tourId } } : undefined,
          room: roomId ? { connect: { id: roomId } } : undefined,
          flight: flightId ? { connect: { id: flightId } } : undefined,
          totalPrice: totalPrice ?? existingBooking.totalPrice,
          status: status ?? existingBooking.status,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          tour: {
            select: { id: true, name: true, description: true },
          },
          room: {
            select: {
              id: true,
              roomType: true,
              description: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          flight: {
            select: { id: true, flightNumber: true, airline: true },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
            },
          },
        },
      });
    });

    // Response building logic remains the same...
    const baseResponse = {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      user: updatedBooking.user,
      payment: updatedBooking.payment,
      status: updatedBooking.status,
      totalPrice: updatedBooking.totalPrice,
      bookingDate: updatedBooking.bookingDate,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };

    let response: IBooking;

    if (updatedBooking.tour) {
      response = {
        ...baseResponse,
        type: 'TOUR',
        tour: updatedBooking.tour,
        room: null,
        flight: null,
        hotel: null,
      };
    } else if (updatedBooking.room) {
      response = {
        ...baseResponse,
        type: 'ROOM',
        room: updatedBooking.room,
        hotel: updatedBooking.room?.hotel ?? null,
        tour: null,
        flight: null,
      };
    } else if (updatedBooking.flight) {
      response = {
        ...baseResponse,
        type: 'FLIGHT',
        flight: updatedBooking.flight,
        tour: null,
        room: null,
        hotel: null,
      };
    } else {
      throw new Error('Booking has no associated item (tour, room, or flight)');
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking updated successfully',
      data: response,
    });
  },
);

export const updateBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create(updateBookingValidation),
  handleUpdateBooking,
];

/**
 * Delete a booking
 */
const handleDeleteBooking = asyncHandler(
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
      throw new UnauthorizedError('Only admins and agents can delete bookings');
    }

    if (!id) {
      throw new BadRequestError('Booking ID is required');
    }

    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      throw new BadRequestError('Invalid booking ID format');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestError('Completed bookings cannot be deleted');
    }

    if (booking.payment) {
      const paymentStatus = booking.payment.status;

      if (paymentStatus === 'COMPLETED') {
        throw new BadRequestError(
          'Cannot delete booking with completed payment. Please process a refund first or update payment status to PENDING.',
        );
      }

      const allowedPaymentStatuses = [
        'PENDING',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
      ];
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        throw new BadRequestError(
          `Cannot delete booking with payment status "${paymentStatus}". Allowed statuses: ${allowedPaymentStatuses.join(', ')}`,
        );
      }
    }

    if (booking.status === 'CONFIRMED' && booking.bookingDate) {
      const bookingDate = new Date(booking.bookingDate);
      const currentDate = new Date();

      if (bookingDate < currentDate) {
        throw new BadRequestError(
          'Cannot delete past confirmed bookings. Please cancel the booking instead.',
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      if (booking.tourId) {
        const tour = await tx.tour.findUnique({
          where: { id: booking.tourId },
        });

        if (tour) {
          await tx.tour.update({
            where: { id: booking.tourId },
            data: { guestsBooked: { decrement: 1 } },
          });
        }
      }

      if (booking.roomId) {
        const room = await tx.room.findUnique({
          where: { id: booking.roomId },
        });

        if (room) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { roomsAvailable: { increment: 1 } },
          });
        }
      }

      if (booking.flightId) {
        const flight = await tx.flight.findUnique({
          where: { id: booking.flightId },
        });

        if (flight) {
          await tx.flight.update({
            where: { id: booking.flightId },
            data: { seatsAvailable: { increment: 1 } },
          });
        }
      }

      if (
        booking.payment &&
        ['PENDING', 'FAILED', 'CANCELLED'].includes(booking.payment.status)
      ) {
        await tx.payment.delete({
          where: { id: booking.payment.id },
        });
      }

      await tx.booking.delete({
        where: { id: bookingId },
      });
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking deleted successfully',
      data: {
        deletedBookingId: bookingId,
        restoredAvailability: {
          tour: booking.tourId ? true : false,
          room: booking.roomId ? true : false,
          flight: booking.flightId ? true : false,
        },
      },
    });
  },
);

export const deleteBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleDeleteBooking,
];

/**
 * Get all bookings for a specific user
 */
const handleGetUserBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Customers can only view their own bookings
    if (user.role === 'CUSTOMER' && user.id !== userId) {
      throw new UnauthorizedError('You can only view your own bookings');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const status = req.query.status as string | undefined;
    const bookingType = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const tourId = req.query.tourId as string | undefined;
    const roomId = req.query.roomId as string | undefined;
    const flightId = req.query.flightId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    // Build where clause
    const whereClause: any = {
      userId: parseInt(userId),
    };

    if (status) {
      whereClause.status = status;
    }

    if (tourId) {
      whereClause.tourId = parseInt(tourId);
    }

    if (roomId) {
      whereClause.roomId = parseInt(roomId);
    }

    if (flightId) {
      whereClause.flightId = parseInt(flightId);
    }

    if (fromDate && toDate) {
      whereClause.bookingDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      whereClause.bookingDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      whereClause.bookingDate = {
        lte: new Date(toDate),
      };
    }

    // Handle booking type filter
    if (bookingType === 'TOUR') {
      whereClause.tourId = { not: null };
    } else if (bookingType === 'ROOM') {
      whereClause.roomId = { not: null };
    } else if (bookingType === 'FLIGHT') {
      whereClause.flightId = { not: null };
    }

    if (search) {
      whereClause.OR = [
        {
          tour: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          tour: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            roomType: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            hotel: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          room: {
            hotel: {
              description: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          flight: {
            flightNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          flight: {
            airline: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tour: { select: { id: true, name: true, description: true } },
          room: {
            select: {
              id: true,
              roomType: true,
              description: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          flight: { select: { id: true, flightNumber: true, airline: true } },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
            },
          },
        },
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    const response: IBooking[] = bookings
      .map((booking) => {
        if (booking.tour) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'TOUR',
            tour: booking.tour,
            room: null,
            flight: null,
            hotel: null,
          };
        } else if (booking.room) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'ROOM',
            room: booking.room ? booking.room : null,
            hotel: booking.room?.hotel ? booking.room.hotel : null,
            tour: null,
            flight: null,
          };
        } else if (booking.flight) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'FLIGHT',
            flight: booking.flight,
            tour: null,
            room: null,
            hotel: null,
          };
        }

        return null;
      })
      .filter((b): b is IBooking => b !== null);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Bookings for user ${userId} retrieved successfully`,
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

export const getUserBookings: RequestHandler[] = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetUserBookings,
];

/**
 * Get all bookings with pagination
 */
const handleGetAllBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Optional filters
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;
    const bookingType = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const tourId = req.query.tourId as string | undefined;
    const roomId = req.query.roomId as string | undefined;
    const flightId = req.query.flightId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    // Build where clause
    const whereClause: any = {};

    // Base authorization filter
    if (user.role === 'CUSTOMER') {
      whereClause.userId = parseInt(user.id);
    }

    // Additional filters
    if (userId && user.role !== 'CUSTOMER') {
      whereClause.userId = parseInt(userId);
    }

    if (status) {
      whereClause.status = status;
    }

    if (tourId) {
      whereClause.tourId = parseInt(tourId);
    }

    if (roomId) {
      whereClause.roomId = parseInt(roomId);
    }

    if (flightId) {
      whereClause.flightId = parseInt(flightId);
    }

    if (fromDate && toDate) {
      whereClause.bookingDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      whereClause.bookingDate = {
        gte: new Date(fromDate),
      };
    } else if (toDate) {
      whereClause.bookingDate = {
        lte: new Date(toDate),
      };
    }

    // Handle booking type filter
    if (bookingType === 'TOUR') {
      whereClause.tourId = { not: null };
    } else if (bookingType === 'ROOM') {
      whereClause.roomId = { not: null };
    } else if (bookingType === 'FLIGHT') {
      whereClause.flightId = { not: null };
    }

    // Handle search across related entities
    if (search) {
      whereClause.OR = [
        {
          tour: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          tour: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            roomType: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
        {
          room: {
            hotel: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          room: {
            hotel: {
              description: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          flight: {
            flightNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          flight: {
            airline: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          tour: {
            select: { id: true, name: true, description: true },
          },
          room: {
            select: {
              id: true,
              roomType: true,
              description: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          flight: {
            select: { id: true, flightNumber: true, airline: true },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
            },
          },
        },
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    const response: IBooking[] = bookings
      .map((booking) => {
        if (booking.tour) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'TOUR',
            tour: booking.tour,
            room: null,
            flight: null,
            hotel: null,
          };
        } else if (booking.room) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'ROOM',
            room: booking.room ? booking.room : null,
            hotel: booking.room?.hotel ? booking.room.hotel : null,
            tour: null,
            flight: null,
          };
        } else if (booking.flight) {
          return {
            id: booking.id,
            userId: booking.userId,
            user: booking.user,
            payment: booking.payment,
            status: booking.status,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            type: 'FLIGHT',
            flight: booking.flight,
            tour: null,
            room: null,
            hotel: null,
          };
        }

        return null;
      })
      .filter((b): b is IBooking => b !== null);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Bookings retrieved successfully',
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

export const getAllBookings: RequestHandler[] = [
  ...validationMiddleware.create(getBookingsValidation),
  handleGetAllBookings,
];

/**
 * Delete all bookings
 */
const handleDeleteAllBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bookings = await prisma.booking.findMany({
      include: { payment: true },
    });

    const deletableBookings = bookings.filter(
      (booking) =>
        booking.status !== 'COMPLETED' &&
        (!booking.payment || booking.payment.status === 'REFUNDED'),
    );

    if (deletableBookings.length === 0) {
      throw new BadRequestError(
        'No bookings can be deleted. Completed or paid bookings must be refunded first.',
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const booking of deletableBookings) {
        if (booking.tourId) {
          await tx.tour.update({
            where: { id: booking.tourId },
            data: { guestsBooked: { decrement: 1 } },
          });
        }

        if (booking.roomId) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { roomsAvailable: { increment: 1 } },
          });
        }

        if (booking.flightId) {
          await tx.flight.update({
            where: { id: booking.flightId },
            data: { seatsAvailable: { increment: 1 } },
          });
        }
      }

      await tx.booking.deleteMany({
        where: {
          id: { in: deletableBookings.map((b) => b.id) },
        },
      });
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Deleted ${deletableBookings.length} booking(s) successfully`,
      skipped: bookings.length - deletableBookings.length,
    });
  },
);

export const deleteAllBookings: RequestHandler[] = [handleDeleteAllBookings];
