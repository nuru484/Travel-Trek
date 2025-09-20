import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import prisma from '../config/prismaClient';
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
} from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';
import {
  IPaymentInput,
  IPayment,
  IPaymentsPaginatedResponse,
  IPaymentResponse,
  IPaymentInitializeResponse,
  IPaymentVerificationResponse,
  IUpdatePaymentStatusInput,
  IUpdatePaymentStatusResponse,
  IDeletePaymentResponse,
  IDeleteAllPaymentsResponse,
  IRefundPaymentInput,
  IRefundPaymentResponse,
  IPaymentsQueryParams,
} from 'types/payment.types';
import crypto from 'crypto';
import ENV from '../config/env';

// Paystack configuration
const PAYSTACK_SECRET_KEY = ENV.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_BASE_URL = 'https://api.paystack.co';

const getPaystackChannel = (paymentMethod: string): string => {
  switch (paymentMethod) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return 'card';
    case 'MOBILE_MONEY':
      return 'mobile_money';
    case 'BANK_TRANSFER':
      return 'bank';
    default:
      return 'card';
  }
};

/**
 * Create a payment for a booking using Paystack
 */
export const createPayment = asyncHandler(
  async (
    req: Request<{}, IPaymentInitializeResponse, IPaymentInput>,
    res: Response<IPaymentInitializeResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { bookingId, paymentMethod } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Validate booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Customers can only pay for their own bookings
    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
      throw new UnauthorizedError('You can only pay for your own bookings');
    }

    // Only PENDING bookings can be paid for
    if (booking.status !== 'PENDING') {
      throw new Error('Only PENDING bookings can be paid for');
    }

    // Validate payment method
    if (
      !['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'].includes(
        paymentMethod,
      )
    ) {
      throw new Error('Invalid payment method');
    }

    // Initialize Paystack transaction
    const paystackResponse = await axios.post(
      `${PAYSTACK_API_BASE_URL}/transaction/initialize`,
      {
        email: booking.user.email,
        amount: booking.totalPrice * 100,
        currency: 'GHS',
        reference: `booking_${bookingId}_${Date.now()}`,
        channels: [getPaystackChannel(paymentMethod)],
        callback_url:
          process.env.PAYSTACK_CALLBACK_URL ||
          'http://localhost:3000/dashboard/payments/callback',
        metadata: { bookingId },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { authorization_url, reference } = paystackResponse.data.data;

    // Check if payment already exists for this booking
    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId: bookingId },
    });

    if (existingPayment && existingPayment.status === 'PENDING') {
      // Return the existing pending payment
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Payment already initialized',
        data: {
          authorization_url,
          paymentId: existingPayment.id,
          transactionReference: existingPayment.transactionReference!,
        },
      });
      return;
    } else if (existingPayment) {
      throw new Error('A payment already exists for this booking');
    }

    // Create payment record in PENDING state
    const payment = await prisma.payment.create({
      data: {
        bookingId: bookingId,
        userId: booking.userId,
        amount: booking.totalPrice,
        currency: 'GHS',
        paymentMethod,
        status: 'PENDING',
        transactionReference: reference,
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payment initialized successfully',
      data: {
        authorization_url,
        paymentId: payment.id,
        transactionReference: reference,
      },
    });
  },
);

export const handleCallback = asyncHandler(
  async (
    req: Request,
    res: Response<IPaymentVerificationResponse>,
  ): Promise<void> => {
    const { reference } = req.query;

    if (!reference) {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'No reference provided',
      });
      return;
    }

    // Verify transaction
    const verificationResponse = await axios.get(
      `${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const verifiedData = verificationResponse.data.data;

    const metadata = verifiedData.metadata;
    const bookingId = metadata?.bookingId;

    if (!bookingId) {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'No bookingId found in payment metadata',
      });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
    });

    if (!booking) {
      res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // If payment failed
    if (verifiedData.status !== 'success') {
      await prisma.payment.updateMany({
        where: { transactionReference: reference as string },
        data: { status: 'FAILED' },
      });

      res.status(HTTP_STATUS_CODES.OK).json({
        success: false,
        message: 'Payment verification failed',
        data: {
          reference: reference as string,
          bookingId,
          paymentStatus: 'FAILED',
          amount: verifiedData.amount / 100,
        },
      });
      return;
    }

    // If amount mismatch
    if (verifiedData.amount / 100 !== booking.totalPrice) {
      await prisma.payment.updateMany({
        where: { transactionReference: reference as string },
        data: { status: 'FAILED' },
      });

      res.status(HTTP_STATUS_CODES.OK).json({
        success: false,
        message: 'Payment amount does not match booking total price',
        data: {
          reference: reference as string,
          bookingId,
          paymentStatus: 'FAILED',
          amount: verifiedData.amount / 100,
        },
      });
      return;
    }

    // Update statuses
    await prisma.payment.updateMany({
      where: { transactionReference: reference as string },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
      },
    });

    await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status: 'CONFIRMED' },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingId,
        reference: reference as string,
        amount: verifiedData.amount / 100,
        paymentStatus: 'COMPLETED',
      },
    });
  },
);

/**
 * Handle Paystack webhook for payment verification
 */
export const handleWebhook = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = req.body;

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signature = req.headers['x-paystack-signature'] as string;

    if (hash !== signature) {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST).send('Invalid signature');
      return;
    }

    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      const bookingId = metadata.bookingId;

      // Verify transaction with Paystack
      const verificationResponse = await axios.get(
        `${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const verifiedData = verificationResponse.data.data;
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Verify amount matches booking totalPrice
      if (verifiedData.amount / 100 !== booking.totalPrice) {
        await prisma.payment.updateMany({
          where: { transactionReference: reference },
          data: { status: 'FAILED' },
        });
        throw new Error('Payment amount does not match booking total price');
      }

      // Update payment and booking status
      await prisma.payment.updateMany({
        where: { transactionReference: reference },
        data: {
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      res
        .status(HTTP_STATUS_CODES.OK)
        .json({ message: 'Payment verified and booking confirmed' });
    } else {
      res.status(HTTP_STATUS_CODES.OK).json({ message: 'Event received' });
    }
  },
);

/**
 * Get a single payment by ID
 */
export const getPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: {
          include: {
            tour: true,
            hotel: true,
            room: true,
            flight: {
              include: {
                origin: true,
                destination: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Customers can only view their own payments
    if (user.role === 'CUSTOMER' && payment.userId !== parseInt(user.id)) {
      throw new UnauthorizedError('You can only view your own payments');
    }

    // Determine booked item based on booking type
    let bookedItem;
    if (payment.booking.tour) {
      bookedItem = {
        id: payment.booking.tour.id,
        name: payment.booking.tour.name,
        description: payment.booking.tour.description,
        type: 'TOUR' as const,
      };
    } else if (payment.booking.hotel) {
      bookedItem = {
        id: payment.booking.hotel.id,
        name: payment.booking.hotel.name,
        description: payment.booking.hotel.description,
        type: 'HOTEL' as const,
      };
    } else if (payment.booking.room) {
      bookedItem = {
        id: payment.booking.room.id,
        name: payment.booking.room.roomType,
        description: payment.booking.room.description,
        type: 'ROOM' as const,
      };
    } else if (payment.booking.flight) {
      bookedItem = {
        id: payment.booking.flight.id,
        name: `${payment.booking.flight.origin} to ${payment.booking.flight.destination}`,
        description: payment.booking.flight.airline,
        type: 'FLIGHT' as const,
      };
    } else {
      bookedItem = {
        id: payment.booking.id,
        name: 'Unknown Item',
        description: null,
        type: 'TOUR' as const,
      };
    }

    const response: IPayment = {
      id: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionReference: payment.transactionReference ?? '',
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      bookedItem,
      user: {
        id: payment.user.id,
        name: payment.user.name,
        email: payment.user.email,
      },
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payment retrieved successfully',
      data: response,
    });
  },
);

/**
 * Get all payments with pagination
 */
export const getAllPayments = asyncHandler(
  async (
    req: Request<{}, IPaymentsPaginatedResponse, {}, IPaymentsQueryParams>,
    res: Response<IPaymentsPaginatedResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      userId: queryUserId,
      search,
    } = req.query;

    const pageNum = parseInt(page.toString()) || 1;
    const limitNum = parseInt(limit.toString()) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Build where clause
    const where: any =
      user.role === 'CUSTOMER' ? { userId: parseInt(user.id) } : {};

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (queryUserId && user.role === 'ADMIN') {
      where.userId = parseInt(queryUserId.toString());
    }

    if (search) {
      where.OR = [
        { transactionReference: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              tour: true,
              hotel: true,
              room: true,
              flight: {
                include: {
                  origin: true,
                  destination: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const response: IPayment[] = payments.map((payment) => {
      // Determine booked item based on booking type
      let bookedItem;
      if (payment.booking.tour) {
        bookedItem = {
          id: payment.booking.tour.id,
          name: payment.booking.tour.name,
          description: payment.booking.tour.description,
          type: 'TOUR' as const,
        };
      } else if (payment.booking.hotel) {
        bookedItem = {
          id: payment.booking.hotel.id,
          name: payment.booking.hotel.name,
          description: payment.booking.hotel.description,
          type: 'HOTEL' as const,
        };
      } else if (payment.booking.room) {
        bookedItem = {
          id: payment.booking.room.id,
          name: payment.booking.room.roomType,
          description: payment.booking.room.description,
          type: 'ROOM' as const,
        };
      } else if (payment.booking.flight) {
        bookedItem = {
          id: payment.booking.flight.id,
          name: `${payment.booking.flight.origin} to ${payment.booking.flight.destination}`,
          description: payment.booking.flight.airline,
          type: 'FLIGHT' as const,
        };
      } else {
        bookedItem = {
          id: payment.booking.id,
          name: 'Unknown Item',
          description: null,
          type: 'TOUR' as const,
        };
      }

      return {
        id: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionReference: payment.transactionReference ?? '',
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        bookedItem,
        user: {
          id: payment.user.id,
          name: payment.user.name,
          email: payment.user.email,
        },
      };
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payments retrieved successfully',
      data: response,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  },
);

/**
 * Get all payments for a specific user
 */
export const getUserPayments = asyncHandler(
  async (
    req: Request,
    res: Response<IPaymentsPaginatedResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { userId } = req.params;
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;
    const status = req.query.status as string | undefined;
    const paymentMethod = req.query.paymentMethod as string | undefined;

    const pageNum = parseInt(page.toString()) || 1;
    const limitNum = parseInt(limit.toString()) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    const targetUserId = parseInt(userId);

    // Customers can only view their own payments
    if (user.role === 'CUSTOMER' && parseInt(user.id) !== targetUserId) {
      throw new UnauthorizedError('You can only view your own payments');
    }

    // Build where clause
    const where: any = { userId: targetUserId };

    if (
      status &&
      ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)
    ) {
      where.status = status;
    }

    if (
      paymentMethod &&
      ['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'].includes(
        paymentMethod,
      )
    ) {
      where.paymentMethod = paymentMethod;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              tour: true,
              hotel: true,
              room: true,
              flight: {
                include: {
                  origin: true,
                  destination: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const response: IPayment[] = payments.map((payment) => {
      // Determine booked item based on booking type
      let bookedItem;
      if (payment.booking.tour) {
        bookedItem = {
          id: payment.booking.tour.id,
          name: payment.booking.tour.name,
          description: payment.booking.tour.description,
          type: 'TOUR' as const,
        };
      } else if (payment.booking.hotel) {
        bookedItem = {
          id: payment.booking.hotel.id,
          name: payment.booking.hotel.name,
          description: payment.booking.hotel.description,
          type: 'HOTEL' as const,
        };
      } else if (payment.booking.room) {
        bookedItem = {
          id: payment.booking.room.id,
          name: payment.booking.room.roomType,
          description: payment.booking.room.description,
          type: 'ROOM' as const,
        };
      } else if (payment.booking.flight) {
        bookedItem = {
          id: payment.booking.flight.id,
          name: `${payment.booking.flight.origin} to ${payment.booking.flight.destination}`,
          description: payment.booking.flight.airline,
          type: 'FLIGHT' as const,
        };
      } else {
        bookedItem = {
          id: payment.booking.id,
          name: 'Unknown Item',
          description: null,
          type: 'TOUR' as const,
        };
      }

      return {
        id: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionReference: payment.transactionReference ?? '',
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        bookedItem,
        user: {
          id: payment.user.id,
          name: payment.user.name,
          email: payment.user.email,
        },
      };
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Payments for user ${targetUserId} retrieved successfully`,
      data: response,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  },
);

/**
 * Update payment status
 */
export const updatePaymentStatus = asyncHandler(
  async (
    req: Request,
    res: Response<IUpdatePaymentStatusResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Only ADMIN can update payment status
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError(
        'Only administrators can update payment status',
      );
    }

    // Validate status
    if (!['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)) {
      throw new Error('Invalid payment status');
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Prevent invalid status transitions
    if (payment.status === 'COMPLETED' && status === 'PENDING') {
      throw new Error('Cannot change completed payment back to pending');
    }

    if (payment.status === 'REFUNDED' && status !== 'REFUNDED') {
      throw new Error('Cannot change status of refunded payment');
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status,
        paymentDate: status === 'COMPLETED' ? new Date() : payment.paymentDate,
        updatedAt: new Date(),
      },
    });

    // Update booking status based on payment status
    let bookingStatus = payment.booking.status;

    if (status === 'COMPLETED') {
      bookingStatus = 'CONFIRMED';
    } else if (status === 'FAILED' || status === 'REFUNDED') {
      bookingStatus = 'CANCELLED';
    } else if (status === 'PENDING') {
      bookingStatus = 'PENDING';
    }

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: bookingStatus },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payment status updated successfully',
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        bookingStatus,
        updatedAt: updatedPayment.updatedAt,
      },
    });
  },
);

/**
 * Delete a single payment
 */
export const deletePayment = asyncHandler(
  async (
    req: Request,
    res: Response<IDeletePaymentResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Only ADMIN can delete payments
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only administrators can delete payments');
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Prevent deletion of completed payments (for audit purposes)
    if (payment.status === 'COMPLETED') {
      throw new Error(
        'Cannot delete completed payments. Consider refunding instead.',
      );
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: parseInt(id) },
    });

    // Update booking status back to PENDING if payment is deleted
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PENDING' },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payment deleted successfully',
      data: {
        paymentId: parseInt(id),
        bookingId: payment.bookingId,
      },
    });
  },
);

/**
 * Delete all payments (with optional filters)
 */
export const deleteAllPayments = asyncHandler(
  async (
    req: Request<{}, IDeleteAllPaymentsResponse>,
    res: Response<IDeleteAllPaymentsResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Only ADMIN can delete all payments
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError(
        'Only administrators can delete all payments',
      );
    }

    // Extract filter parameters from query
    const status = req.query.status as string;
    const paymentMethod = req.query.paymentMethod as string;
    const userId = req.query.userId as string;
    const beforeDate = req.query.beforeDate as string;

    // Build where clause based on filters
    const where: any = {};

    // Status filter - only allow deletion of non-completed payments
    if (status && ['PENDING', 'FAILED', 'REFUNDED'].includes(status)) {
      where.status = status;
    } else {
      // Default: only delete PENDING, FAILED, or REFUNDED payments
      where.status = {
        in: ['PENDING', 'FAILED', 'REFUNDED'],
      };
    }

    // Payment method filter
    if (
      paymentMethod &&
      ['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'].includes(
        paymentMethod,
      )
    ) {
      where.paymentMethod = paymentMethod;
    }

    // User filter
    if (userId) {
      where.userId = parseInt(userId);
    }

    // Date filter - delete payments created before a specific date
    if (beforeDate) {
      const date = new Date(beforeDate);
      if (isNaN(date.getTime())) {
        throw new Error(
          'Invalid beforeDate format. Use ISO 8601 format (YYYY-MM-DD)',
        );
      }
      where.createdAt = {
        lt: date,
      };
    }

    // Get the payments to be deleted (for returning booking IDs)
    const paymentsToDelete = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        bookingId: true,
        status: true,
      },
    });

    if (paymentsToDelete.length === 0) {
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'No payments found matching the criteria',
        data: {
          deletedCount: 0,
          bookingsAffected: [],
          filters: {
            status,
            paymentMethod,
            userId: userId ? parseInt(userId) : undefined,
            beforeDate,
          },
        },
      });
      return;
    }

    // Prevent deletion if any completed payments are included
    const completedPayments = paymentsToDelete.filter(
      (p) => p.status === 'COMPLETED',
    );
    if (completedPayments.length > 0) {
      throw new Error(
        `Cannot delete ${completedPayments.length} completed payment(s). Remove completed payments from selection or refund them instead.`,
      );
    }

    // Delete the payments
    const deleteResult = await prisma.payment.deleteMany({
      where,
    });

    // Update booking statuses back to PENDING for affected bookings
    const bookingIds = paymentsToDelete.map((p) => p.bookingId);

    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
      },
      data: {
        status: 'PENDING',
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `${deleteResult.count} payment(s) deleted successfully`,
      data: {
        deletedCount: deleteResult.count,
        bookingsAffected: bookingIds,
        filters: {
          status,
          paymentMethod,
          userId: userId ? parseInt(userId) : undefined,
          beforeDate,
        },
      },
    });
  },
);

/**
 * Refund a payment (safer alternative to deletion for completed payments)
 */
export const refundPayment = asyncHandler(
  async (
    req: Request,
    res: Response<IRefundPaymentResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized, no user provided');
    }

    // Only ADMIN can refund payments
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Only administrators can refund payments');
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Only completed payments can be refunded
    if (payment.status !== 'COMPLETED') {
      throw new Error('Only completed payments can be refunded');
    }

    // Update payment to REFUNDED status
    const refundedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
      },
    });

    // Update booking status to CANCELLED
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CANCELLED' },
    });

    // Here you would typically integrate with Paystack's refund API
    // For now, we'll just log the refund request
    console.log(`Refund requested for payment ${id}:`, {
      transactionReference: payment.transactionReference,
      amount: payment.amount,
      reason: reason || 'No reason provided',
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: 'Payment refunded successfully',
      data: {
        paymentId: refundedPayment.id,
        status: refundedPayment.status,
        bookingStatus: 'CANCELLED',
        refundAmount: payment.amount,
        reason: reason || 'No reason provided',
        updatedAt: refundedPayment.updatedAt,
      },
    });
  },
);
