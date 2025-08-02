"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUDINARY_UPLOAD_OPTIONS = exports.BCRYPT_SALT_ROUNDS = exports.HTTP_STATUS_CODES = void 0;
exports.HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};
exports.BCRYPT_SALT_ROUNDS = 10;
exports.CLOUDINARY_UPLOAD_OPTIONS = {
    folder: 'travel-and-tour-system',
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
};
