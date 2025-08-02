// src/controllers/booking/booking-controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { param } from 'express-validator';
import prisma from '../config/prismaClient';
import validationMiddleware from '../middlewares/validation';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import { IBookingInput, IBookingResponse } from 'types/booking.types';
import {
  createBookingValidation,
  updateBookingValidation,
  getBookingsValidation,
} from '../validations/bookingValidations';
import { validator } from '../validations/validation-factory.ts';

/**
 * Create a new booking
 */
const handleCreateBooking = asyncHandler(
  async (
    req: Request<{}, {}, IBookingInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { userId, tourId, hotelId, roomId, flightId, totalPrice } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Only CUSTOMER can book for themselves, ADMIN/AGENT can book for any user
    if (user.role === 'CUSTOMER' && user.id !== userId.toString()) {
      throw new UnauthorizedError('Customers can only book for themselves');
    }

    // Validate referenced IDs
    if (tourId) {
      const tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (!tour) throw new NotFoundError('Tour not found');
    }
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel) throw new NotFoundError('Hotel not found');
    }
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundError('Room not found');
      if (!room.available) throw new NotFoundError('Room is not available');
    }
    if (flightId) {
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
      });
      if (!flight) throw new NotFoundError('Flight not found');
      if (flight.seatsAvailable <= 0)
        throw new NotFoundError('No seats available on this flight');
    }

    // Ensure user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundError('User not found');

    const booking = await prisma.booking.create({
      data: {
        user: { connect: { id: userId } },
        tour: tourId ? { connect: { id: tourId } } : undefined,
        hotel: hotelId ? { connect: { id: hotelId } } : undefined,
        room: roomId ? { connect: { id: roomId } } : undefined,
        flight: flightId ? { connect: { id: flightId } } : undefined,
        totalPrice,
        status: 'PENDING',
      },
    });

    const response: IBookingResponse = {
      id: booking.id,
      userId: booking.userId,
      tourId: booking.tourId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      flightId: booking.flightId,
      status: booking.status,
      totalPrice: booking.totalPrice,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Booking created successfully',
      data: response,
    });
  },
);

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
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Customers can only view their own bookings
    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
      throw new UnauthorizedError('You can only view your own bookings');
    }

    const response: IBookingResponse = {
      id: booking.id,
      userId: booking.userId,
      tourId: booking.tourId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      flightId: booking.flightId,
      status: booking.status,
      totalPrice: booking.totalPrice,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking retrieved successfully',
      data: response,
    });
  },
);

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
    const { userId, tourId, hotelId, roomId, flightId, totalPrice, status } =
      req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new UnauthorizedError('Only admins and agents can update bookings');
    }

    if (!id) {
      throw new NotFoundError('Booking ID is required');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Validate updated referenced IDs
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!targetUser) throw new NotFoundError('User not found');
    }
    if (tourId) {
      const tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (!tour) throw new NotFoundError('Tour not found');
    }
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel) throw new NotFoundError('Hotel not found');
    }
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundError('Room not found');
      if (!room.available) throw new NotFoundError('Room is not available');
    }
    if (flightId) {
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
      });
      if (!flight) throw new NotFoundError('Flight not found');
      if (flight.seatsAvailable <= 0)
        throw new NotFoundError('No seats available on this flight');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: {
        user: userId ? { connect: { id: userId } } : undefined,
        tour: tourId ? { connect: { id: tourId } } : undefined,
        hotel: hotelId ? { connect: { id: hotelId } } : undefined,
        room: roomId ? { connect: { id: roomId } } : undefined,
        flight: flightId ? { connect: { id: flightId } } : undefined,
        totalPrice: totalPrice ?? booking.totalPrice,
        status: status ?? booking.status,
      },
    });

    const response: IBookingResponse = {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      tourId: updatedBooking.tourId,
      hotelId: updatedBooking.hotelId,
      roomId: updatedBooking.roomId,
      flightId: updatedBooking.flightId,
      status: updatedBooking.status,
      totalPrice: updatedBooking.totalPrice,
      bookingDate: updatedBooking.bookingDate,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking updated successfully',
      data: response,
    });
  },
);

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
      throw new NotFoundError('Booking ID is required');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    await prisma.booking.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Booking deleted successfully',
    });
  },
);

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

    const where = user.role === 'CUSTOMER' ? { userId: parseInt(user.id) } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    const response: IBookingResponse[] = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      tourId: booking.tourId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      flightId: booking.flightId,
      status: booking.status,
      totalPrice: booking.totalPrice,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

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

/**
 * Delete all bookings
 */
const handleDeleteAllBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only admins can delete all bookings');
    }

    await prisma.booking.deleteMany({});

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'All bookings deleted successfully',
    });
  },
);

// Middleware arrays with validations
export const createBooking: RequestHandler[] = [
  ...validationMiddleware.create(createBookingValidation),
  handleCreateBooking,
];

export const getBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleGetBooking,
];

export const updateBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create(updateBookingValidation),
  handleUpdateBooking,
];

export const deleteBooking: RequestHandler[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  ...validationMiddleware.create([]),
  handleDeleteBooking,
];

export const getAllBookings: RequestHandler[] = [
  ...validationMiddleware.create(getBookingsValidation),
  handleGetAllBookings,
];

export const deleteAllBookings: RequestHandler[] = [handleDeleteAllBookings];
