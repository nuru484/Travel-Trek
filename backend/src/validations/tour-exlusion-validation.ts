// src/validations/tour-validation.ts
import { validator } from './validation-factory';
import { ValidationChain } from 'express-validator';
import prisma from '../config/prismaClient';

/**
 * Validation for creating a tour exclusion
 */
export const createTourExclusionValidation: ValidationChain[] = [
  validator.number('tourId', {
    required: true,
    min: 1,
  }),

  validator.string('description', {
    required: true,
    minLength: 10,
    maxLength: 500,
    customMessage:
      'Description must be between 10 and 500 characters and provide meaningful information',
  }),
];

/**
 * Validation for updating a tour exclusion
 */
export const updateTourExclusionValidation: ValidationChain[] = [
  validator.number('tourId', {
    required: false,
    min: 1,
  }),

  validator.string('description', {
    required: false,
    minLength: 10,
    maxLength: 500,
    customMessage:
      'Description must be between 10 and 500 characters and provide meaningful information',
  }),

  validator.custom(
    'updateFields',
    (value, req) => {
      const { tourId, description } = req.body;
      return !!(tourId || description);
    },
    'At least one field (tourId or description) must be provided for update',
    { required: false },
  ),
];

/**
 * Validation for getting tour exclusions with pagination and filtering
 */
export const getTourExclusionsValidation: ValidationChain[] = [
  validator.number('page', {
    required: false,
    min: 1,
  }),

  validator.number('limit', {
    required: false,
    min: 1,
    max: 100,
  }),

  validator.number('tourId', {
    required: false,
    min: 1,
  }),

  validator.string('search', {
    required: false,
    minLength: 1,
    maxLength: 100,
    customMessage: 'Search term must be between 1 and 100 characters',
  }),

  validator.enum(
    'sortBy',
    ['id', 'tourId', 'description', 'createdAt', 'updatedAt'],
    {
      required: false,
    },
  ),

  validator.enum('sortOrder', ['asc', 'desc'], {
    required: false,
  }),
];

/**
 * Validation for getting tour exclusions by tour ID
 */
export const getTourExclusionsByTourIdValidation: ValidationChain[] = [
  validator.number('tourId', {
    required: true,
    min: 1,
  }),

  // Verify tour exists
  validator.custom(
    'tourId',
    async (value) => {
      const tour = await prisma.tour.findUnique({
        where: { id: parseInt(value) },
      });

      if (!tour) {
        throw new Error('Tour not found');
      }

      return true;
    },
    'The specified tour does not exist',
    { required: false },
  ),

  validator.number('page', {
    required: false,
    min: 1,
  }),

  validator.number('limit', {
    required: false,
    min: 1,
    max: 100,
  }),
];

/**
 * Validation for bulk creating tour exclusions
 */
export const bulkCreateTourExclusionsValidation: ValidationChain[] = [
  validator.number('tourId', {
    required: true,
    min: 1,
  }),

  validator.array('exclusions', {
    required: true,
    minLength: 1,
    maxLength: 50,
    itemType: 'string',
  }),

  // Verify tour exists
  validator.custom(
    'tourId',
    async (value) => {
      const tour = await prisma.tour.findUnique({
        where: { id: parseInt(value) },
      });

      if (!tour) {
        throw new Error('Tour not found');
      }

      return true;
    },
    'The specified tour does not exist',
    { required: false },
  ),

  // Validate each exclusion description
  validator.custom(
    'exclusions',
    (value: string[]) => {
      if (!Array.isArray(value)) return false;

      return value.every(
        (exclusion) =>
          typeof exclusion === 'string' &&
          exclusion.trim().length >= 10 &&
          exclusion.trim().length <= 500,
      );
    },
    'Each exclusion must be between 10 and 500 characters',
    { required: false },
  ),

  // Check for duplicate exclusions in the array
  validator.custom(
    'exclusions',
    (value: string[]) => {
      if (!Array.isArray(value)) return false;

      const normalizedExclusions = value.map((exclusion) =>
        exclusion.trim().toLowerCase(),
      );
      const uniqueExclusions = new Set(normalizedExclusions);

      return uniqueExclusions.size === normalizedExclusions.length;
    },
    'Duplicate exclusions are not allowed in the array',
    { required: false },
  ),
];

/**
 * Validation for deleting multiple tour exclusions
 */
export const bulkDeleteTourExclusionsValidation: ValidationChain[] = [
  validator.array('ids', {
    required: true,
    minLength: 1,
    maxLength: 100,
    itemType: 'number',
  }),

  validator.custom(
    'ids',
    (value: number[]) => {
      if (!Array.isArray(value)) return false;

      return value.every((id) => Number.isInteger(id) && id > 0);
    },
    'All IDs must be positive integers',
    { required: false },
  ),

  validator.custom(
    'ids',
    (value: number[]) => {
      if (!Array.isArray(value)) return false;

      const uniqueIds = new Set(value);
      return uniqueIds.size === value.length;
    },
    'Duplicate IDs are not allowed',
    { required: false },
  ),
];
