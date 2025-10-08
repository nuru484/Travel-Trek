"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfileValidation = void 0;
// src/validations/user-validations.ts
const validation_factory_1 = require("./validation-factory");
// Validator for updating an existing user
exports.updateUserProfileValidation = [
    validation_factory_1.validator.string('name', {
        required: false,
        maxLength: 100,
        customMessage: 'Name must be a string up to 100 characters',
    }),
    validation_factory_1.validator.email('email', {
        required: false,
        maxLength: 255,
    }),
    validation_factory_1.validator.enum('role', ['ADMIN', 'CUSTOMER', 'AGENT'], {
        required: false,
    }),
    validation_factory_1.validator.string('address', {
        required: false,
        maxLength: 100,
        customMessage: 'Address must be a string up to only 100 characters',
    }),
    validation_factory_1.validator.phone('phone', {
        required: false,
        pattern: /^\+?[0-9]{10,15}$/,
        customMessage: 'Phone must be a valid phone number (10-15 digits)',
    }),
];
