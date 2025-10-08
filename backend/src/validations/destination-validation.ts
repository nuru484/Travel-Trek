// src/validations/destination-validation.ts
import { validator } from '../validations/validation-factory';
import { ValidationChain } from 'express-validator';
import prisma from '../config/prismaClient';

// Validation for creating a new destination
export const createDestinationValidation: ValidationChain[] = [
  // Name validation
  validator.string('name', {
    required: true,
    minLength: 2,
    maxLength: 100,
    customMessage: 'Destination name must be between 2 and 100 characters',
  }),

  // Description validation (optional)
  validator.string('description', {
    required: false,
    maxLength: 1000,
    customMessage: 'Description must not exceed 1000 characters',
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

  // City validation (optional)
  validator.string('city', {
    required: false,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Custom validation to ensure name is unique (case-insensitive)
  validator.custom(
    'name',
    async (value, req) => {
      if (!value) return true;

      const { country, city } = req.body;
      const existingDestination = await prisma.destination.findFirst({
        where: {
          name: {
            equals: value,
            mode: 'insensitive',
          },
          country: {
            equals: country,
            mode: 'insensitive',
          },
          city: city
            ? {
                equals: city,
                mode: 'insensitive',
              }
            : undefined,
        },
      });

      return !existingDestination;
    },
    'A destination with this name already exists in the specified country/city',
    { required: false },
  ),
];

// Validation for updating an existing destination
export const updateDestinationValidation: ValidationChain[] = [
  // Name validation (optional for updates)
  validator.string('name', {
    required: false,
    minLength: 2,
    maxLength: 100,
    customMessage: 'Destination name must be between 2 and 100 characters',
  }),

  // Description validation (optional)
  validator.string('description', {
    required: false,
    maxLength: 1000,
    customMessage: 'Description must not exceed 1000 characters',
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

  // City validation (optional)
  validator.string('city', {
    required: false,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Custom validation to ensure updated name is unique (excluding current destination)
  validator.custom(
    'name',
    async (value, req) => {
      if (!value) return true;

      const destinationId = req.params?.id;
      if (!destinationId) return true;

      const { country, city } = req.body;

      // Get current destination data for comparison
      const currentDestination = await prisma.destination.findUnique({
        where: { id: parseInt(destinationId) },
        select: { country: true, city: true },
      });

      if (!currentDestination) return true;

      // Use provided values or fall back to current values
      const targetCountry = country || currentDestination.country;
      const targetCity = city || currentDestination.city;

      const existingDestination = await prisma.destination.findFirst({
        where: {
          id: { not: parseInt(destinationId) },
          name: {
            equals: value,
            mode: 'insensitive',
          },
          country: {
            equals: targetCountry,
            mode: 'insensitive',
          },
          city: targetCity
            ? {
                equals: targetCity,
                mode: 'insensitive',
              }
            : undefined,
        },
      });

      return !existingDestination;
    },
    'A destination with this name already exists in the specified country/city',
    { required: false },
  ),

  // Custom validation to ensure at least one field is being updated
  validator.custom(
    'updateFields',
    (value, req) => {
      const { name, description, country, city } = req.body;
      const hasFile = req.file || req.body.destinationPhoto;

      return !!(name || description || country || city || hasFile);
    },
    'At least one field must be provided for update',
    { required: false },
  ),
];

// Validation for destination ID parameter
export const destinationIdParamValidation: ValidationChain[] = [
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

// Validation for destination search/filter parameters
export const destinationSearchValidation: ValidationChain[] = [
  // Search by name (optional)
  validator.string('search', {
    required: false,
    minLength: 1,
    maxLength: 100,
    customMessage: 'Search term must be between 1 and 100 characters',
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

  // Filter by city (optional)
  validator.string('city', {
    required: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    customMessage:
      'City filter must contain only letters, spaces, hyphens, and apostrophes',
  }),

  // Sort order validation
  validator.enum(
    'sortBy',
    ['name', 'country', 'city', 'createdAt', 'updatedAt'],
    {
      required: false,
    },
  ),

  validator.enum('sortOrder', ['asc', 'desc'], {
    required: false,
  }),
];

// Combined validation for getting destinations with filters
export const getDestinationsValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  ...destinationSearchValidation,
];

// Validation for bulk operations
export const bulkDestinationValidation: ValidationChain[] = [
  validator.array('destinationIds', {
    required: true,
    minLength: 1,
    maxLength: 50, // Limit bulk operations
    itemType: 'number',
    unique: true,
  }),

  // Custom validation to ensure all IDs are positive integers
  validator.custom(
    'destinationIds',
    (value: number[]) => {
      if (!Array.isArray(value)) return false;
      return value.every((id) => Number.isInteger(id) && id > 0);
    },
    'All destination IDs must be positive integers',
    { required: false },
  ),
];

// Validation for destination photo handling
export const destinationPhotoValidation: ValidationChain[] = [
  // Custom validation for file type (this would be handled by multer, but adding for completeness)
  validator.custom(
    'destinationPhoto',
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
    'destinationPhoto',
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
