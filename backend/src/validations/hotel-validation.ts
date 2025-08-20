// src/validations/hotel-validation.ts
import { validator } from '../validations/validation-factory.ts';
import { ValidationChain } from 'express-validator';
import prisma from '../config/prismaClient';

// Validation for creating a new hotel
export const createHotelValidation: ValidationChain[] = [
  // Name validation
  validator.string('name', {
    required: true,
    minLength: 2,
    maxLength: 100,
    customMessage: 'Hotel name must be between 2 and 100 characters',
  }),

  // Description validation (optional)
  validator.string('description', {
    required: false,
    maxLength: 2000,
    customMessage: 'Description must not exceed 2000 characters',
  }),

  // Address validation
  validator.string('address', {
    required: true,
    minLength: 5,
    maxLength: 255,
    customMessage: 'Address must be between 5 and 255 characters',
  }),

  // City validation
  validator.string('city', {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Country validation
  validator.string('country', {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'Country must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Phone validation (optional)
  validator.phone('phone', {
    required: false,
    pattern: /^\+?[0-9\s\-\(\)]+$/,
  }),

  // Star rating validation
  validator.integer('starRating', {
    required: false,
    min: 1,
    max: 5,
  }),

  // Amenities validation (array of strings)
  validator.array('amenities', {
    required: false,
    maxLength: 20, // Limit number of amenities
    itemType: 'string',
    unique: true,
  }),

  // Custom validation for amenities content
  validator.custom(
    'amenities',
    (value: string[]) => {
      if (!value || !Array.isArray(value)) return true;

      return value.every((amenity) => {
        return (
          typeof amenity === 'string' &&
          amenity.trim().length > 0 &&
          amenity.length <= 50
        );
      });
    },
    'Each amenity must be a non-empty string with maximum 50 characters',
    { required: false },
  ),

  // Destination ID validation
  validator.integer('destinationId', {
    required: true,
    min: 1,
  }),

  // Custom validation to ensure destination exists
  validator.custom(
    'destinationId',
    async (value: number) => {
      if (!value) return true;

      const destination = await prisma.destination.findUnique({
        where: { id: Number(value) },
      });

      return !!destination;
    },
    'Destination does not exist',
    { required: false },
  ),

  // Custom validation to ensure hotel name is unique within the same destination
  validator.custom(
    'name',
    async (value: string, req) => {
      if (!value) return true;

      const { destinationId } = req.body;
      if (!destinationId) return true;

      const existingHotel = await prisma.hotel.findFirst({
        where: {
          name: {
            equals: value,
            mode: 'insensitive',
          },
          destinationId: parseInt(destinationId),
        },
      });

      return !existingHotel;
    },
    'A hotel with this name already exists in the selected destination',
    { required: false },
  ),
];

// Validation for updating an existing hotel
export const updateHotelValidation: ValidationChain[] = [
  // Name validation (optional for updates)
  validator.string('name', {
    required: false,
    minLength: 2,
    maxLength: 100,
    customMessage: 'Hotel name must be between 2 and 100 characters',
  }),

  // Description validation (optional)
  validator.string('description', {
    required: false,
    maxLength: 2000,
    customMessage: 'Description must not exceed 2000 characters',
  }),

  // Address validation (optional for updates)
  validator.string('address', {
    required: false,
    minLength: 5,
    maxLength: 255,
    customMessage: 'Address must be between 5 and 255 characters',
  }),

  // City validation (optional for updates)
  validator.string('city', {
    required: false,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Country validation (optional for updates)
  validator.string('country', {
    required: false,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'Country must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Phone validation (optional)
  validator.phone('phone', {
    required: false,
    pattern: /^\+?[0-9\s\-\(\)]+$/,
  }),

  // Star rating validation (optional for updates)
  validator.integer('starRating', {
    required: false,
    min: 1,
    max: 5,
  }),

  // Amenities validation (optional for updates)
  validator.array('amenities', {
    required: false,
    maxLength: 20,
    itemType: 'string',
    unique: true,
  }),

  // Custom validation for amenities content
  validator.custom(
    'amenities',
    (value: string[]) => {
      if (!value || !Array.isArray(value)) return true;

      return value.every((amenity) => {
        return (
          typeof amenity === 'string' &&
          amenity.trim().length > 0 &&
          amenity.length <= 50
        );
      });
    },
    'Each amenity must be a non-empty string with maximum 50 characters',
    { required: false },
  ),

  // Destination ID validation (optional for updates)
  validator.integer('destinationId', {
    required: false,
    min: 1,
  }),

  // Custom validation to ensure destination exists if provided
  validator.custom(
    'destinationId',
    async (value: number) => {
      if (!value) return true;

      const destination = await prisma.destination.findUnique({
        where: { id: Number(value) },
      });

      return !!destination;
    },
    'Destination does not exist',
    { required: false },
  ),
];

// Validation for hotel ID parameter
export const hotelIdParamValidation: ValidationChain[] = [
  validator.integer('id', {
    required: true,
    min: 1,
  }),
];

// Validation for pagination query parameters
export const paginationQueryValidation: ValidationChain[] = [
  validator.integer('page', {
    required: false,
    min: 1,
  }),

  validator.integer('limit', {
    required: false,
    min: 1,
    max: 100, // Prevent excessive limit values
  }),
];

// Validation for hotel search/filter parameters
export const hotelSearchValidation: ValidationChain[] = [
  // Search by name or description (optional)
  validator.string('search', {
    required: false,
    minLength: 1,
    maxLength: 100,
    customMessage: 'Search term must be between 1 and 100 characters',
  }),

  // Filter by destination ID (optional)
  validator.integer('destinationId', {
    required: false,
    min: 1,
  }),

  // Filter by city (optional)
  validator.string('city', {
    required: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City filter must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Filter by country (optional)
  validator.string('country', {
    required: false,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'Country filter must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Filter by star rating (optional)
  validator.integer('starRating', {
    required: false,
    min: 1,
    max: 5,
  }),

  // Filter by minimum star rating (optional)
  validator.integer('minStarRating', {
    required: false,
    min: 1,
    max: 5,
  }),

  // Filter by maximum star rating (optional)
  validator.integer('maxStarRating', {
    required: false,
    min: 1,
    max: 5,
  }),

  // Custom validation to ensure minStarRating <= maxStarRating
  validator.custom(
    'maxStarRating',
    (value: number, req) => {
      const minStarRating = req.query?.minStarRating;
      if (!value || !minStarRating) return true;

      return parseInt(value.toString()) >= parseInt(minStarRating.toString());
    },
    'Maximum star rating must be greater than or equal to minimum star rating',
    { required: false },
  ),

  // Filter by amenities (optional array)
  validator.array('amenities', {
    required: false,
    maxLength: 10,
    itemType: 'string',
  }),

  // Sort order validation
  validator.enum(
    'sortBy',
    ['name', 'city', 'country', 'starRating', 'createdAt', 'updatedAt'],
    {
      required: false,
    },
  ),

  validator.enum('sortOrder', ['asc', 'desc'], {
    required: false,
  }),
];

// Combined validation for getting hotels with filters
export const getHotelsValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  ...hotelSearchValidation,
];

// Validation for bulk operations
export const bulkHotelValidation: ValidationChain[] = [
  validator.array('hotelIds', {
    required: true,
    minLength: 1,
    maxLength: 50, // Limit bulk operations
    itemType: 'number',
    unique: true,
  }),

  // Custom validation to ensure all IDs are positive integers
  validator.custom(
    'hotelIds',
    (value: number[]) => {
      if (!Array.isArray(value)) return false;
      return value.every((id) => Number.isInteger(id) && id > 0);
    },
    'All hotel IDs must be positive integers',
    { required: false },
  ),
];

// Validation for hotel photo handling
export const hotelPhotoValidation: ValidationChain[] = [
  // Custom validation for file type (this would be handled by multer, but adding for completeness)
  validator.custom(
    'hotelPhoto',
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
    'Photo must be a valid image file (JPEG, PNG, or WebP)',
    { required: false },
  ),

  // Custom validation for file size (this would also be handled by multer)
  validator.custom(
    'hotelPhoto',
    (value, req) => {
      const file = req.file;
      if (!file) return true; // Photo is optional

      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    },
    'Photo size must not exceed 5MB',
    { required: false },
  ),
];

// Validation for hotel availability check
export const hotelAvailabilityValidation: ValidationChain[] = [
  validator.integer('hotelId', {
    required: true,
    min: 1,
  }),

  validator.date('checkIn', {
    required: true,
    minDate: new Date(),
  }),

  validator.date('checkOut', {
    required: true,
    compareDateField: 'checkIn',
    compareDateOperation: 'after',
  }),

  validator.integer('guests', {
    required: false,
    min: 1,
    max: 20,
  }),
];
