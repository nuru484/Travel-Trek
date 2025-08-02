// src/validations/flight-validation.ts
import { validator } from './validation-factory.ts';
import { ValidationChain } from 'express-validator';
import prisma from '../config/prismaClient';

// Validation for creating a new flight
export const createFlightValidation: ValidationChain[] = [
  // Flight number validation
  validator.string('flightNumber', {
    required: true,
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z0-9]{2,3}[0-9]{1,4}$/,
    customMessage: 'Flight number must be in format like AA123, BA1234, etc.',
  }),

  // Airline validation
  validator.string('airline', {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-&.()]+$/,
    customMessage:
      'Airline must contain only letters, spaces, hyphens, ampersands, dots, and parentheses',
  }),

  // Departure date validation
  validator.date('departure', {
    required: true,
    minDate: new Date(), // Can't be in the past
  }),

  // Arrival date validation
  validator.date('arrival', {
    required: true,
    compareDateField: 'departure',
    compareDateOperation: 'after',
  }),

  // Origin ID validation
  validator.integer('originId', {
    required: true,
    min: 1,
  }),

  // Destination ID validation
  validator.integer('destinationId', {
    required: true,
    min: 1,
  }),

  // Price validation
  validator.number('price', {
    required: true,
    min: 0,
    allowDecimals: true,
  }),

  // Flight class validation
  validator.enum(
    'flightClass',
    ['Economy', 'Premium Economy', 'Business', 'First'],
    {
      required: true,
    },
  ),

  // Duration validation (in minutes)
  validator.integer('duration', {
    required: true,
    min: 30, // Minimum 30 minutes
    max: 1440, // Maximum 24 hours
  }),

  // Stops validation
  validator.integer('stops', {
    required: false,
    min: 0,
    max: 5, // Maximum 5 stops
  }),

  // Seats available validation
  validator.integer('seatsAvailable', {
    required: true,
    min: 1,
    max: 850, // Airbus A380 capacity
  }),

  // Custom validation to ensure origin and destination are different
  validator.custom(
    'destinationId',
    (value, req) => {
      const { originId } = req.body;
      return parseInt(value) !== parseInt(originId);
    },
    'Origin and destination must be different',
    { required: false },
  ),

  // Custom validation to ensure flight number is unique
  validator.custom(
    'flightNumber',
    async (value) => {
      if (!value) return true;

      const existingFlight = await prisma.flight.findUnique({
        where: { flightNumber: value },
      });

      return !existingFlight;
    },
    'Flight number already exists',
    { required: false },
  ),

  // Custom validation to ensure arrival is at least 30 minutes after departure
  validator.custom(
    'arrival',
    (value, req) => {
      if (!value || !req.body.departure) return true;

      const departureTime = new Date(req.body.departure);
      const arrivalTime = new Date(value);
      const diffInMinutes =
        (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);

      return diffInMinutes >= 30;
    },
    'Arrival time must be at least 30 minutes after departure',
    { required: false },
  ),

  // Custom validation for reasonable flight duration
  validator.custom(
    'duration',
    (value, req) => {
      if (!value || !req.body.departure || !req.body.arrival) return true;

      const departureTime = new Date(req.body.departure);
      const arrivalTime = new Date(req.body.arrival);
      const actualDuration =
        (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
      const providedDuration = parseInt(value);

      // Allow some tolerance (±60 minutes) for time zone differences
      const tolerance = 60;
      return Math.abs(actualDuration - providedDuration) <= tolerance;
    },
    'Duration should approximately match the time difference between departure and arrival',
    { required: false },
  ),
];

// Validation for updating an existing flight
export const updateFlightValidation: ValidationChain[] = [
  // Flight number validation (optional for updates)
  validator.string('flightNumber', {
    required: false,
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z0-9]{2,3}[0-9]{1,4}$/,
    customMessage: 'Flight number must be in format like AA123, BA1234, etc.',
  }),

  // Airline validation (optional for updates)
  validator.string('airline', {
    required: false,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-&.()]+$/,
    customMessage:
      'Airline must contain only letters, spaces, hyphens, ampersands, dots, and parentheses',
  }),

  // Departure date validation (optional for updates)
  validator.date('departure', {
    required: false,
    minDate: new Date(), // Can't be in the past
  }),

  // Arrival date validation (optional for updates)
  validator.date('arrival', {
    required: false,
    compareDateField: 'departure',
    compareDateOperation: 'after',
  }),

  // Origin ID validation (optional for updates)
  validator.integer('originId', {
    required: false,
    min: 1,
  }),

  // Destination ID validation (optional for updates)
  validator.integer('destinationId', {
    required: false,
    min: 1,
  }),

  // Price validation (optional for updates)
  validator.number('price', {
    required: false,
    min: 0,
    allowDecimals: true,
  }),

  // Flight class validation (optional for updates)
  validator.enum(
    'flightClass',
    ['Economy', 'Premium Economy', 'Business', 'First'],
    {
      required: false,
    },
  ),

  // Duration validation (optional for updates)
  validator.integer('duration', {
    required: false,
    min: 30,
    max: 1440,
  }),

  // Stops validation (optional for updates)
  validator.integer('stops', {
    required: false,
    min: 0,
    max: 5,
  }),

  // Seats available validation (optional for updates)
  validator.integer('seatsAvailable', {
    required: false,
    min: 0, // Allow 0 for fully booked flights
    max: 850,
  }),

  // Custom validation to ensure origin and destination are different (if both provided)
  validator.custom(
    'destinationId',
    async (value, req) => {
      const { originId } = req.body;
      const flightId = req.params?.id;

      if (!value && !originId) return true;

      let currentOriginId = originId;
      let currentDestinationId = value;

      // If only one is provided, get the other from database
      if (flightId && (!originId || !value)) {
        const currentFlight = await prisma.flight.findUnique({
          where: { id: parseInt(flightId) },
          select: { originId: true, destinationId: true },
        });

        if (currentFlight) {
          currentOriginId = originId || currentFlight.originId;
          currentDestinationId = value || currentFlight.destinationId;
        }
      }

      return parseInt(currentDestinationId) !== parseInt(currentOriginId);
    },
    'Origin and destination must be different',
    { required: false },
  ),

  // Custom validation to ensure updated flight number is unique (excluding current flight)
  validator.custom(
    'flightNumber',
    async (value, req) => {
      if (!value) return true;

      const flightId = req.params?.id;
      if (!flightId) return true;

      const existingFlight = await prisma.flight.findFirst({
        where: {
          flightNumber: value,
          id: { not: parseInt(flightId) },
        },
      });

      return !existingFlight;
    },
    'Flight number already exists',
    { required: false },
  ),

  // Custom validation for arrival time in updates
  validator.custom(
    'arrival',
    async (value, req) => {
      if (!value) return true;

      const { departure } = req.body;
      const flightId = req.params?.id;

      let departureTime = departure ? new Date(departure) : null;

      // If departure not provided in update, get it from database
      if (!departureTime && flightId) {
        const currentFlight = await prisma.flight.findUnique({
          where: { id: parseInt(flightId) },
          select: { departure: true },
        });

        if (currentFlight) {
          departureTime = currentFlight.departure;
        }
      }

      if (!departureTime) return true;

      const arrivalTime = new Date(value);
      const diffInMinutes =
        (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);

      return diffInMinutes >= 30;
    },
    'Arrival time must be at least 30 minutes after departure',
    { required: false },
  ),

  // Custom validation to ensure at least one field is being updated
  validator.custom(
    'updateFields',
    (value, req) => {
      const {
        flightNumber,
        airline,
        departure,
        arrival,
        originId,
        destinationId,
        price,
        flightClass,
        duration,
        stops,
        seatsAvailable,
      } = req.body;
      const hasFile = req.file || req.body.flightPhoto;

      return !!(
        flightNumber ||
        airline ||
        departure ||
        arrival ||
        originId ||
        destinationId ||
        price ||
        flightClass ||
        duration ||
        stops !== undefined ||
        seatsAvailable ||
        hasFile
      );
    },
    'At least one field must be provided for update',
    { required: false },
  ),
];

// Validation for flight ID parameter
export const flightIdParamValidation: ValidationChain[] = [
  validator.integer('id', {
    required: true,
    min: 1,
  }),
];

// Validation for pagination and search query parameters
export const flightSearchValidation: ValidationChain[] = [
  // Basic pagination
  validator.integer('page', {
    required: false,
    min: 1,
  }),

  validator.integer('limit', {
    required: false,
    min: 1,
    max: 100,
  }),

  // Flight search parameters
  validator.string('search', {
    required: false,
    minLength: 1,
    maxLength: 100,
    customMessage: 'Search term must be between 1 and 100 characters',
  }),

  validator.string('airline', {
    required: false,
    minLength: 2,
    maxLength: 100,
    customMessage: 'Airline filter must be between 2 and 100 characters',
  }),

  validator.integer('originId', {
    required: false,
    min: 1,
  }),

  validator.integer('destinationId', {
    required: false,
    min: 1,
  }),

  validator.enum(
    'flightClass',
    ['Economy', 'Premium Economy', 'Business', 'First'],
    {
      required: false,
    },
  ),

  // Date range filters
  validator.date('departureFrom', {
    required: false,
  }),

  validator.date('departureTo', {
    required: false,
    compareDateField: 'departureFrom',
    compareDateOperation: 'after-or-same',
  }),

  // Price range filters
  validator.number('minPrice', {
    required: false,
    min: 0,
    allowDecimals: true,
  }),

  validator.number('maxPrice', {
    required: false,
    min: 0,
    allowDecimals: true,
  }),

  // Duration filters
  validator.integer('maxDuration', {
    required: false,
    min: 30,
    max: 1440,
  }),

  validator.integer('maxStops', {
    required: false,
    min: 0,
    max: 5,
  }),

  // Minimum seats available
  validator.integer('minSeats', {
    required: false,
    min: 1,
    max: 850,
  }),

  // Sort parameters
  validator.enum(
    'sortBy',
    [
      'departure',
      'arrival',
      'price',
      'duration',
      'airline',
      'flightNumber',
      'createdAt',
    ],
    {
      required: false,
    },
  ),

  validator.enum('sortOrder', ['asc', 'desc'], {
    required: false,
  }),

  // Custom validation for price range
  validator.custom(
    'maxPrice',
    (value, req) => {
      const { minPrice } = req.query;
      if (!value || !minPrice) return true;

      return parseFloat(value) >= parseFloat(minPrice);
    },
    'Maximum price must be greater than or equal to minimum price',
    { required: false },
  ),
];

// Combined validation for getting flights with filters
export const getFlightsValidation: ValidationChain[] = [
  ...flightSearchValidation,
];

// Validation for flight photo handling
export const flightPhotoValidation: ValidationChain[] = [
  // Custom validation for file type
  validator.custom(
    'flightPhoto',
    (value, req) => {
      const file = req.file;
      if (!file) return true; // Photo is optional

      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      return allowedMimeTypes.includes(file.mimetype);
    },
    'Flight photo must be a valid image file (JPEG, PNG, or WebP)',
    { required: false },
  ),

  // Custom validation for file size
  validator.custom(
    'flightPhoto',
    (value, req) => {
      const file = req.file;
      if (!file) return true; // Photo is optional

      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    },
    'Flight photo size must not exceed 5MB',
    { required: false },
  ),
];
