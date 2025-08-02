// Constants for configuration
import { ICloudinaryUploadOptions } from 'types/cloudinary.types';

export const HTTP_STATUS_CODES = {
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

export const BCRYPT_SALT_ROUNDS = 10;

export const CLOUDINARY_UPLOAD_OPTIONS: Partial<ICloudinaryUploadOptions> = {
  folder: 'travel-and-tour-system',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
};
