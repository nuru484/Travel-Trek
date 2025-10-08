"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserValidation = void 0;
// src/validations/auth-validations.ts
const validation_factory_ts_1 = require("./validation-factory.ts");
// Validator for creating a new user
exports.registerUserValidation = [
    validation_factory_ts_1.validator.string('name', {
        required: true,
        maxLength: 100,
        customMessage: 'Name can only be a string up to 100 characters',
    }),
    validation_factory_ts_1.validator.password('password', {
        required: true,
        minLength: 4,
        maxLength: 255,
        customMessage: 'Password must be a strong password',
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
