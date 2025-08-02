"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileValidation = exports.registerValidation = void 0;
// src/validations/authValidations/signup-validation.ts
const validation_factory_ts_1 = require("../../validations/validation-factory.ts");
// Validator for creating a new user
exports.registerValidation = [
    validation_factory_ts_1.validator.string('name', {
        required: true,
        maxLength: 100,
        customMessage: 'Name can only be a string up to 100 characters',
    }),
    validation_factory_ts_1.validator.password('password', {
        required: true,
        minLength: 5,
        maxLength: 255,
        // requireUppercase: true,
        // requireLowercase: true,
        // requireNumbers: true,
        // requireSpecialChars: true,
        customMessage: 'Password must be a strong password',
    }),
    validation_factory_ts_1.validator.enum('role', ['ADMIN', 'CUSTOMER', 'AGENT'], {
        required: true,
    }),
    validation_factory_ts_1.validator.string('address', {
        required: true,
        maxLength: 100,
        customMessage: 'Address must be a string up to 100 characters',
    }),
    validation_factory_ts_1.validator.phone('phone', {
        required: false,
        pattern: /^\+?[0-9]{10,15}$/,
        customMessage: 'Phone must be a valid phone number (10-15 digits)',
    }),
];
// Validator for updating an existing user
exports.updateProfileValidation = [
    validation_factory_ts_1.validator.string('name', {
        required: false,
        maxLength: 100,
        customMessage: 'Name must be a string up to 100 characters',
    }),
    validation_factory_ts_1.validator.email('email', {
        required: false,
        maxLength: 255,
    }),
    validation_factory_ts_1.validator.password('password', {
        required: false,
        minLength: 5,
        // maxLength: 255,
        // requireUppercase: true,
        // requireLowercase: true,
        // requireNumbers: true,
        // requireSpecialChars: true,
        customMessage: 'Password must be a strong password',
    }),
    validation_factory_ts_1.validator.enum('role', ['ADMIN', 'CUSTOMER', 'AGENT'], {
        required: false,
    }),
    validation_factory_ts_1.validator.string('address', {
        required: false,
        maxLength: 100,
        customMessage: 'Address must be a string up to only 100 characters',
    }),
    validation_factory_ts_1.validator.phone('phone', {
        required: false,
        pattern: /^\+?[0-9]{10,15}$/,
        customMessage: 'Phone must be a valid phone number (10-15 digits)',
    }),
];
