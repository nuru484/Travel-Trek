"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = void 0;
// validations/validation-factory.ts.ts
const express_validator_1 = require("express-validator");
class ValidationFactory {
    /**
     * Validates a string input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the string
     */
    string(fieldName, options = {}) {
        const { required = true, minLength, maxLength = 255, pattern, customMessage, } = options;
        const errorMessage = customMessage || `${fieldName} must be a non-empty string`;
        const validation = (0, express_validator_1.body)(fieldName, errorMessage).trim();
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        if (minLength !== undefined) {
            validation
                .isLength({ min: minLength })
                .withMessage(`${fieldName} must be at least ${minLength} characters long`);
        }
        validation
            .isLength({ max: maxLength })
            .withMessage(`${fieldName} must not exceed ${maxLength} characters`);
        if (pattern) {
            validation
                .matches(pattern)
                .withMessage(`${fieldName} does not match the required pattern`);
        }
        return validation;
    }
    /**
     * Validates a username input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the username
     */
    username(fieldName, options = {}) {
        const { required = true, minLength = 3, maxLength = 100, pattern = /^[a-zA-Z0-9_]+$/, customMessage, } = options;
        return this.string(fieldName, {
            required,
            minLength,
            maxLength,
            pattern,
            customMessage: customMessage ||
                'Username can only contain letters, numbers, and underscores',
        });
    }
    /**
     * Validates an email input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the email
     */
    email(fieldName, options = {}) {
        const { required = true, maxLength = 255, allowDomains, blockDomains, } = options;
        const validation = this.string(fieldName, { required, maxLength })
            .isEmail()
            .withMessage('Invalid email address')
            .normalizeEmail();
        if (allowDomains?.length) {
            validation.custom((email) => {
                if (!email)
                    return true;
                const domain = email.split('@')[1];
                if (!allowDomains.includes(domain)) {
                    throw new Error(`Email domain ${domain} is not allowed`);
                }
                return true;
            });
        }
        if (blockDomains?.length) {
            validation.custom((email) => {
                if (!email)
                    return true;
                const domain = email.split('@')[1];
                if (blockDomains.includes(domain)) {
                    throw new Error(`Email domain ${domain} is not allowed`);
                }
                return true;
            });
        }
        return validation;
    }
    /**
     * Validates a password
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the password
     */
    password(fieldName = 'password', options = {}) {
        const { required = true, minLength = 8, maxLength = 255, requireUppercase = false, requireLowercase = false, requireNumbers = false, requireSpecialChars = false, } = options;
        const validation = this.string(fieldName, {
            required,
            minLength,
            maxLength,
        }).withMessage(`Password must be at least ${minLength} characters long`);
        if (requireUppercase) {
            validation
                .matches(/[A-Z]/)
                .withMessage('Password must contain at least one uppercase letter');
        }
        if (requireLowercase) {
            validation
                .matches(/[a-z]/)
                .withMessage('Password must contain at least one lowercase letter');
        }
        if (requireNumbers) {
            validation
                .matches(/\d/)
                .withMessage('Password must contain at least one number');
        }
        if (requireSpecialChars) {
            validation
                .matches(/[@$!%*?&#]/)
                .withMessage('Password must contain at least one special character');
        }
        return validation;
    }
    /**
     * Validates a password confirmation
     * @param confirmFieldName - The name of the confirmation field
     * @param passwordFieldName - The name of the password field to compare against
     */
    confirmPassword(confirmFieldName = 'confirmPassword', passwordFieldName = 'password') {
        return (0, express_validator_1.body)(confirmFieldName)
            .exists({ checkFalsy: true })
            .withMessage('Password confirmation is required')
            .custom((value, { req }) => value === req.body[passwordFieldName])
            .withMessage('Passwords do not match');
    }
    /**
     * Validates a date input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the date
     */
    date(fieldName, options = {}) {
        const { required = true, minDate, maxDate, compareDateField, compareDateOperation, } = options;
        const validation = (0, express_validator_1.body)(fieldName, `${fieldName} must be a valid date`);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation
            .isISO8601()
            .toDate()
            .withMessage(`${fieldName} must be a valid date`);
        if (minDate) {
            validation.custom((value) => {
                if (!value)
                    return true;
                if (value < minDate) {
                    throw new Error(`${fieldName} must be on or after ${minDate.toISOString().split('T')[0]}`);
                }
                return true;
            });
        }
        if (maxDate) {
            validation.custom((value) => {
                if (!value)
                    return true;
                if (value > maxDate) {
                    throw new Error(`${fieldName} must be on or before ${maxDate.toISOString().split('T')[0]}`);
                }
                return true;
            });
        }
        if (compareDateField && compareDateOperation) {
            validation.custom((value, { req }) => {
                if (!value)
                    return true;
                const compareDate = req.body[compareDateField]
                    ? new Date(req.body[compareDateField])
                    : null;
                if (!compareDate)
                    return true;
                switch (compareDateOperation) {
                    case 'before':
                        if (value >= compareDate) {
                            throw new Error(`${fieldName} must be before ${compareDateField}`);
                        }
                        break;
                    case 'after':
                        if (value <= compareDate) {
                            throw new Error(`${fieldName} must be after ${compareDateField}`);
                        }
                        break;
                    case 'same':
                        if (value.getTime() !== compareDate.getTime()) {
                            throw new Error(`${fieldName} must be the same as ${compareDateField}`);
                        }
                        break;
                    case 'before-or-same':
                        if (value > compareDate) {
                            throw new Error(`${fieldName} must be before or the same as ${compareDateField}`);
                        }
                        break;
                    case 'after-or-same':
                        if (value < compareDate) {
                            throw new Error(`${fieldName} must be after or the same as ${compareDateField}`);
                        }
                        break;
                }
                return true;
            });
        }
        return validation;
    }
    /**
     * Validates a number input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the number
     */
    number(fieldName, options = {}) {
        const { required = true, min, max, allowDecimals = true } = options;
        const validation = (0, express_validator_1.body)(fieldName, `${fieldName} must be a valid number`);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        if (allowDecimals) {
            validation.isFloat().withMessage(`${fieldName} must be a number`);
        }
        else {
            validation.isInt().withMessage(`${fieldName} must be an integer`);
        }
        if (min !== undefined) {
            validation
                .custom((value) => value >= min)
                .withMessage(`${fieldName} must be greater than or equal to ${min}`);
        }
        if (max !== undefined) {
            validation
                .custom((value) => value <= max)
                .withMessage(`${fieldName} must be less than or equal to ${max}`);
        }
        return validation;
    }
    /**
     * Validates an integer input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the integer
     */
    integer(fieldName, options = {}) {
        return this.number(fieldName, { ...options, allowDecimals: false });
    }
    /**
     * Validates a boolean input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the boolean
     */
    boolean(fieldName, options = {}) {
        const { required = true } = options;
        const validation = (0, express_validator_1.body)(fieldName, `${fieldName} must be a boolean`);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation.isBoolean().withMessage(`${fieldName} must be a boolean value`);
        return validation;
    }
    /**
     * Validates an array input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the array
     */
    array(fieldName, options = {}) {
        const { required = true, minLength, maxLength, unique = false, itemType, } = options;
        const validation = (0, express_validator_1.body)(fieldName, `${fieldName} must be an array`);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation.isArray().withMessage(`${fieldName} must be an array`);
        if (minLength !== undefined) {
            validation
                .custom((array) => array.length >= minLength)
                .withMessage(`${fieldName} must contain at least ${minLength} item(s)`);
        }
        if (maxLength !== undefined) {
            validation
                .custom((array) => array.length <= maxLength)
                .withMessage(`${fieldName} must contain at most ${maxLength} item(s)`);
        }
        if (unique) {
            validation
                .custom((array) => {
                const uniqueItems = new Set(array.map((item) => JSON.stringify(item)));
                return uniqueItems.size === array.length;
            })
                .withMessage(`${fieldName} must contain unique items`);
        }
        if (itemType) {
            validation
                .custom((array) => {
                return array.every((item) => {
                    switch (itemType) {
                        case 'string':
                            return typeof item === 'string';
                        case 'number':
                            return typeof item === 'number';
                        case 'boolean':
                            return typeof item === 'boolean';
                        case 'object':
                            return typeof item === 'object' && item !== null;
                        default:
                            return true;
                    }
                });
            })
                .withMessage(`All items in ${fieldName} must be of type ${itemType}`);
        }
        return validation;
    }
    /**
     * Validates an object input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the object
     */
    object(fieldName, options = {}) {
        const { required = true, allowEmpty = false, requiredFields = [], } = options;
        const validation = (0, express_validator_1.body)(fieldName, `${fieldName} must be an object`);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation.isObject().withMessage(`${fieldName} must be an object`).bail();
        if (!allowEmpty) {
            validation
                .custom((obj) => Object.keys(obj).length > 0)
                .withMessage(`${fieldName} cannot be empty`);
        }
        if (requiredFields.length > 0) {
            validation
                .custom((obj) => {
                return requiredFields.every((field) => Object.prototype.hasOwnProperty.call(obj, field) &&
                    obj[field] !== null &&
                    obj[field] !== undefined);
            })
                .withMessage(`${fieldName} must include required fields: ${requiredFields.join(', ')}`);
        }
        return validation;
    }
    /**
     * Validates a URL input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the URL
     */
    url(fieldName, options = {}) {
        const { required = true, maxLength = 2083, protocols = ['http', 'https'], } = options;
        const validation = this.string(fieldName, { required, maxLength })
            .isURL({ protocols })
            .withMessage(`${fieldName} must be a valid URL with protocols: ${protocols.join(', ')}`);
        return validation;
    }
    /**
     * Validates a phone number input
     * @param fieldName - The name of the field to validate
     * @param options - Validation options for the phone number
     */
    phone(fieldName, options = {}) {
        const { required = true, pattern = /^\+?[0-9]{10,15}$/ } = options;
        return this.string(fieldName, {
            required,
            pattern,
            customMessage: 'Must be a valid phone number',
        });
    }
    /**
     * Validates an enum input
     * @param fieldName - The name of the field to validate
     * @param allowedValues - Array of allowed values
     * @param options - Base validation options
     */
    enum(fieldName, allowedValues, options = {}) {
        const { required = true } = options;
        const validation = (0, express_validator_1.body)(fieldName);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation
            .custom((value) => allowedValues.includes(value))
            .withMessage(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
        return validation;
    }
    /**
     * Creates a custom validator with a user-defined validation function
     * @param fieldName - The name of the field to validate
     * @param validationFn - Custom validation function
     * @param errorMessage - Error message to display on validation failure
     * @param options - Base validation options
     */
    custom(fieldName, validationFn, errorMessage, options = {}) {
        const { required = true } = options;
        const validation = (0, express_validator_1.body)(fieldName);
        if (required) {
            validation.notEmpty().withMessage(`${fieldName} is required`);
        }
        else {
            validation.optional();
        }
        validation.custom(async (value, { req }) => {
            const result = await validationFn(value, req);
            if (!result) {
                throw new Error(errorMessage);
            }
            return true;
        });
        return validation;
    }
}
// Create and export a singleton instance
exports.validator = new ValidationFactory();
// Export the factory class for extension if needed
exports.default = ValidationFactory;
