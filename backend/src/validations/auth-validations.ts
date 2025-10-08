// src/validations/auth-validations.ts
import { validator } from './validation-factory';
import { ValidationChain } from 'express-validator';

// Validator for creating a new user
export const registerUserValidation: ValidationChain[] = [
  validator.string('name', {
    required: true,
    maxLength: 100,
    customMessage: 'Name can only be a string up to 100 characters',
  }),
  validator.password('password', {
    required: true,
    minLength: 4,
    maxLength: 255,
    customMessage: 'Password must be a strong password',
  }),

  validator.string('address', {
    required: true,
    maxLength: 100,
    customMessage: 'Address must be a string up to 100 characters',
  }),
  validator.phone('phone', {
    required: false,
    pattern: /^\+?[0-9]{10,15}$/,
    customMessage: 'Phone must be a valid phone number (10-15 digits)',
  }),
];
