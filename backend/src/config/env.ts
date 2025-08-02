require('dotenv').config();

export function assertEnv<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

interface IENV {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  CORS_ACCESS?: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  ACCESS_TOKEN_SECRET?: string;
  ACCESS_TOKEN_EXPIRY?: string;
  REFRESH_TOKEN_SECRET?: string;
  REFRESH_TOKEN_EXPIRY?: string;
  COOKIE_DOMAIN?: string;
}

const ENV: IENV = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ACCESS: process.env.CORS_ACCESS,
  DATABASE_URL: assertEnv(process.env.DATABASE_URL, 'DATABASE_URL'),
  CLOUDINARY_CLOUD_NAME: assertEnv(
    process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_CLOUD_NAME',
  ),
  CLOUDINARY_API_KEY: assertEnv(
    process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_KEY',
  ),
  CLOUDINARY_API_SECRET: assertEnv(
    process.env.CLOUDINARY_API_SECRET,
    'CLOUDINARY_API_SECRET',
  ),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '30m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
};

export default ENV;
