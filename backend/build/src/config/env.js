"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEnv = assertEnv;
function assertEnv(value, name) {
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
const ENV = {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CORS_ACCESS: process.env.CORS_ACCESS,
    DATABASE_URL: assertEnv(process.env.DATABASE_URL, 'DATABASE_URL'),
    CLOUDINARY_CLOUD_NAME: assertEnv(process.env.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME'),
    CLOUDINARY_API_KEY: assertEnv(process.env.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY'),
    CLOUDINARY_API_SECRET: assertEnv(process.env.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET'),
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '30m',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    PAYSTACK_SECRET_KEY: assertEnv(process.env.PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY'),
    PAYSTACK_CALLBACK_URL: process.env.PAYSTACK_CALLBACK_URL,
};
exports.default = ENV;
