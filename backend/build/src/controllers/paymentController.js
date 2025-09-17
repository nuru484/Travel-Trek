"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPayments = exports.getPayment = exports.handleWebhook = exports.handleCallback = exports.createPayment = void 0;
const axios_1 = __importDefault(require("axios"));
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const error_handler_1 = require("../middlewares/error-handler");
const constants_1 = require("../config/constants");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = __importDefault(require("../config/env"));
// Paystack configuration
const PAYSTACK_SECRET_KEY = env_1.default.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_BASE_URL = 'https://api.paystack.co';
const getPaystackChannel = (paymentMethod) => {
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
const createPayment = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { bookingId, paymentMethod } = req.body;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    // Validate booking
    const booking = await prismaClient_1.default.booking.findUnique({
        where: { id: bookingId },
        include: { user: true },
    });
    if (!booking) {
        throw new error_handler_1.NotFoundError('Booking not found');
    }
    // Customers can only pay for their own bookings
    if (user.role === 'CUSTOMER' && booking.userId !== parseInt(user.id)) {
        throw new error_handler_1.UnauthorizedError('You can only pay for your own bookings');
    }
    // Only PENDING bookings can be paid for
    if (booking.status !== 'PENDING') {
        throw new Error('Only PENDING bookings can be paid for');
    }
    // Validate payment method
    if (!['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'].includes(paymentMethod)) {
        throw new Error('Invalid payment method');
    }
    // Initialize Paystack transaction
    const paystackResponse = await axios_1.default.post(`${PAYSTACK_API_BASE_URL}/transaction/initialize`, {
        email: booking.user.email,
        amount: booking.totalPrice * 100,
        currency: 'GHS',
        reference: `booking_${bookingId}_${Date.now()}`,
        channels: [getPaystackChannel(paymentMethod)],
        callback_url: process.env.PAYSTACK_CALLBACK_URL ||
            'http://localhost:3000/dashboard/payments/callback',
        metadata: { bookingId },
    }, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const { authorization_url, reference } = paystackResponse.data.data;
    // Check if payment already exists for this booking
    const existingPayment = await prismaClient_1.default.payment.findFirst({
        where: { bookingId: bookingId },
    });
    if (existingPayment && existingPayment.status === 'PENDING') {
        // Return the existing pending payment
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Payment already initialized',
            data: {
                authorization_url,
                paymentId: existingPayment.id,
                transactionReference: existingPayment.transactionReference,
            },
        });
        return;
    }
    else if (existingPayment) {
        throw new Error('A payment already exists for this booking');
    }
    // Create payment record in PENDING state
    const payment = await prismaClient_1.default.payment.create({
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
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Payment initialized successfully',
        data: {
            authorization_url,
            paymentId: payment.id,
            transactionReference: reference,
        },
    });
});
exports.createPayment = createPayment;
const handleCallback = (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { reference } = req.query;
    if (!reference) {
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'No reference provided',
        });
        return;
    }
    // Verify transaction
    const verificationResponse = await axios_1.default.get(`${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });
    const verifiedData = verificationResponse.data.data;
    const metadata = verifiedData.metadata;
    const bookingId = metadata?.bookingId;
    if (!bookingId) {
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'No bookingId found in payment metadata',
        });
        return;
    }
    const booking = await prismaClient_1.default.booking.findUnique({
        where: { id: parseInt(bookingId, 10) },
    });
    if (!booking) {
        res.status(constants_1.HTTP_STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: 'Booking not found',
        });
        return;
    }
    // If payment failed
    if (verifiedData.status !== 'success') {
        await prismaClient_1.default.payment.updateMany({
            where: { transactionReference: reference },
            data: { status: 'FAILED' },
        });
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            success: false,
            message: 'Payment verification failed',
            data: {
                reference,
                bookingId,
                paymentStatus: 'FAILED',
            },
        });
        return;
    }
    // If amount mismatch
    if (verifiedData.amount / 100 !== booking.totalPrice) {
        await prismaClient_1.default.payment.updateMany({
            where: { transactionReference: reference },
            data: { status: 'FAILED' },
        });
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            success: false,
            message: 'Payment amount does not match booking total price',
            data: {
                reference,
                bookingId,
                paymentStatus: 'FAILED',
            },
        });
        return;
    }
    // Update statuses
    await prismaClient_1.default.payment.updateMany({
        where: { transactionReference: reference },
        data: {
            status: 'COMPLETED',
            paymentDate: new Date(),
        },
    });
    await prismaClient_1.default.booking.update({
        where: { id: parseInt(bookingId) },
        data: { status: 'CONFIRMED' },
    });
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
            bookingId,
            reference,
            amount: verifiedData.amount / 100,
            paymentStatus: 'COMPLETED',
        },
    });
});
exports.handleCallback = handleCallback;
/**
 * Handle Paystack webhook for payment verification
 */
const handleWebhook = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const event = req.body;
    const hash = crypto_1.default
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
    const signature = req.headers['x-paystack-signature'];
    if (hash !== signature) {
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST).send('Invalid signature');
        return;
    }
    if (event.event === 'charge.success') {
        const { reference, amount, metadata } = event.data;
        const bookingId = metadata.bookingId;
        // Verify transaction with Paystack
        const verificationResponse = await axios_1.default.get(`${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        const verifiedData = verificationResponse.data.data;
        const booking = await prismaClient_1.default.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            throw new error_handler_1.NotFoundError('Booking not found');
        }
        // Verify amount matches booking totalPrice
        if (verifiedData.amount / 100 !== booking.totalPrice) {
            await prismaClient_1.default.payment.updateMany({
                where: { transactionReference: reference },
                data: { status: 'FAILED' },
            });
            throw new Error('Payment amount does not match booking total price');
        }
        // Update payment and booking status
        const payment = await prismaClient_1.default.payment.updateMany({
            where: { transactionReference: reference },
            data: {
                status: 'COMPLETED',
                paymentDate: new Date(),
            },
        });
        await prismaClient_1.default.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
        });
        res
            .status(constants_1.HTTP_STATUS_CODES.OK)
            .json({ message: 'Payment verified and booking confirmed' });
    }
    else {
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({ message: 'Event received' });
    }
});
exports.handleWebhook = handleWebhook;
/**
 * Get a single payment by ID
 */
const getPayment = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    const payment = await prismaClient_1.default.payment.findUnique({
        where: { id: parseInt(id) },
        include: { booking: true },
    });
    if (!payment) {
        throw new error_handler_1.NotFoundError('Payment not found');
    }
    // Customers can only view their own payments
    if (user.role === 'CUSTOMER' && payment.userId !== parseInt(user.id)) {
        throw new error_handler_1.UnauthorizedError('You can only view your own payments');
    }
    const response = {
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
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Payment retrieved successfully',
        data: response,
    });
});
exports.getPayment = getPayment;
/**
 * Get all payments with pagination
 */
const getAllPayments = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (!user) {
        throw new error_handler_1.UnauthorizedError('Unauthorized, no user provided');
    }
    const where = user.role === 'CUSTOMER' ? { userId: parseInt(user.id) } : {};
    const [payments, total] = await Promise.all([
        prismaClient_1.default.payment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient_1.default.payment.count({ where }),
    ]);
    const response = payments.map((payment) => ({
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
    }));
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'Payments retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getAllPayments = getAllPayments;
