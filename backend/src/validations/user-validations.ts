// src/validations/user-validations.ts
import { validator } from './validation-factory.ts';
import { ValidationChain } from 'express-validator';

// Validator for updating an existing user
export const updateUserProfileValidation: ValidationChain[] = [
  validator.string('name', {
    required: false,
    maxLength: 100,
    customMessage: 'Name must be a string up to 100 characters',
  }),
  validator.email('email', {
    required: false,
    maxLength: 255,
  }),
  validator.password('password', {
    required: false,
    minLength: 5,
    // maxLength: 255,
    // requireUppercase: true,
    // requireLowercase: true,
    // requireNumbers: true,
    // requireSpecialChars: true,
    customMessage: 'Password must be a strong password',
  }),
  validator.enum('role', ['ADMIN', 'CUSTOMER', 'AGENT'], {
    required: false,
  }),
  validator.string('address', {
    required: false,
    maxLength: 100,
    customMessage: 'Address must be a string up to only 100 characters',
  }),
  validator.phone('phone', {
    required: false,
    pattern: /^\+?[0-9]{10,15}$/,
    customMessage: 'Phone must be a valid phone number (10-15 digits)',
  }),
];
