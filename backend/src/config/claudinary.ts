// src/config/claudinary.ts

/**
 * Cloudinary Service
 *
 * This module provides utilities for interacting with Cloudinary API with
 * retry logic, Base64 image support, dynamic configuration, and robust error handling.
 */
import {
  v2 as cloudinaryBase,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import logger from '../utils/logger';
import { assertEnv } from './env';
import ENV from './env';
import {
  ValidationError,
  InternalServerError,
  CustomError,
} from '../middlewares/error-handler';
import { isValidBase64Image } from '../utils/validate-base64-image';
import {
  ICloudinaryUploadService,
  IUploadedFile,
  ICloudinaryConfig,
  ICloudinaryUploadOptions,
  ICloudinaryUploadResult,
  ICloudinaryDeletionResponse,
} from '../../types/cloudinary.types';

// Constants
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Default configuration from environment variables
export const defaultCloudinaryConfig: ICloudinaryConfig = {
  cloud_name: assertEnv(ENV.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME'),
  api_key: assertEnv(ENV.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY'),
  api_secret: assertEnv(ENV.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET'),
};

/**
 * Utility function to extract public ID from a Cloudinary URL
 *
 * @param url - Cloudinary URL
 * @returns Extracted public ID
 */
export const extractPublicIdFromUrl = (url: string): string => {
  try {
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  } catch (error) {
    // Fallback to simpler string manipulation
    return url.split('/').slice(-1)[0].split('.')[0];
  }
};

/**
 * Validates a Cloudinary configuration
 *
 * @param config - Cloudinary configuration object
 * @throws Error if required fields are missing
 */
const validateConfig = (config: ICloudinaryConfig): void => {
  const requiredFields = ['cloud_name', 'api_key', 'api_secret'];
  const missingFields = requiredFields.filter(
    (field) => !config[field as keyof ICloudinaryConfig],
  );
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Cloudinary configuration fields: ${missingFields.join(
        ', ',
      )}`,
    );
  }
};

/**
 * Creates a configured Cloudinary instance
 *
 * @param config - Cloudinary configuration
 * @returns Configured Cloudinary instance
 */
const createCloudinaryInstance = (config: ICloudinaryConfig) => {
  validateConfig(config);
  const cloudinaryInstance = cloudinaryBase;
  cloudinaryInstance.config(config);
  return cloudinaryInstance;
};

/**
 * Uploads a file to Cloudinary with retry logic
 *
 * @param file - File object with buffer or Base64 string
 * @param options - Optional upload configuration
 * @param config - Cloudinary configuration
 * @returns Promise resolving to the upload result object
 * @throws CustomError if file is invalid or upload fails after retries
 */
export const uploadToCloudinary = async (
  file: IUploadedFile | string,
  options: Partial<ICloudinaryUploadOptions> = {},
  config: ICloudinaryConfig,
): Promise<ICloudinaryUploadResult> => {
  const cloudinary = createCloudinaryInstance(config);

  if (typeof file === 'string' && !isValidBase64Image(file)) {
    throw new ValidationError(
      'Invalid Base64 image format. Must be a valid data URI.',
    );
  } else if (typeof file !== 'string' && (!file || !file.buffer)) {
    throw new ValidationError(
      'Invalid file object. Ensure the file is provided and has a buffer property.',
    );
  }

  const uploadOptions: ICloudinaryUploadOptions = {
    resource_type: 'auto',
    ...options,
  };
  let attempts = 0;

  while (attempts < MAX_UPLOAD_RETRIES) {
    try {
      let result: UploadApiResponse;
      if (typeof file === 'string') {
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload(
            file,
            uploadOptions,
            (
              error: UploadApiErrorResponse | undefined,
              uploadResult: UploadApiResponse | undefined,
            ) => {
              if (error || !uploadResult) {
                reject(
                  new Error(error?.message || 'Unknown error during upload'),
                );
              } else {
                resolve(uploadResult);
              }
            },
          );
        });
      } else {
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (
              error: UploadApiErrorResponse | undefined,
              uploadResult: UploadApiResponse | undefined,
            ) => {
              if (error || !uploadResult) {
                reject(
                  new Error(error?.message || 'Unknown error during upload'),
                );
              } else {
                resolve(uploadResult);
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      }

      logger.debug(
        `File uploaded successfully to Cloudinary: ${result.public_id}`,
      );
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        asset_id: result.asset_id,
        format: result.format,
        resource_type: result.resource_type,
      };
    } catch (error) {
      attempts++;
      const errorMessage = (error as Error).message;
      if (attempts === MAX_UPLOAD_RETRIES) {
        logger.error(
          `Upload failed after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`,
        );

        throw new CustomError(
          502,
          `Failed to upload to Cloudinary after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`,
        );
      }
      logger.warn(
        `Upload attempt ${attempts} failed: ${errorMessage}. Retrying in ${RETRY_DELAY_MS}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new InternalServerError('Unexpected error during upload process');
};

/**
 * Deletes a file from Cloudinary using its URL or public ID with retry logic
 *
 * @param identifier - Cloudinary URL or public ID of the file to delete
 * @param config - Cloudinary configuration
 * @returns Promise resolving to the deletion result
 * @throws CustomError if deletion fails after retries
 */
export const deleteFromCloudinary = async (
  identifier: string,
  config: ICloudinaryConfig,
): Promise<ICloudinaryDeletionResponse> => {
  if (!identifier) {
    throw new ValidationError('No Cloudinary identifier provided for deletion');
  }

  const cloudinary = createCloudinaryInstance(config);
  const publicId = identifier.includes('http')
    ? extractPublicIdFromUrl(identifier)
    : identifier;

  logger.debug(`Attempting to delete file with public ID: ${publicId}`);
  let attempts = 0;

  while (attempts < MAX_UPLOAD_RETRIES) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Cloudinary deletion result: ${JSON.stringify(result)}`);
      if (result.result !== 'ok') {
        throw new Error(`Deletion failed with result: ${result.result}`);
      }
      return result as ICloudinaryDeletionResponse;
    } catch (error) {
      attempts++;
      const errorMessage = (error as Error).message;
      if (attempts === MAX_UPLOAD_RETRIES) {
        logger.error(
          `Deletion failed after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`,
        );
        throw new CustomError(
          502,
          `Failed to delete from Cloudinary after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`,
        );
      }
      logger.warn(
        `Deletion attempt ${attempts} failed: ${errorMessage}. Retrying in ${RETRY_DELAY_MS}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new InternalServerError('Unexpected error during deletion process');
};

/**
 * Uploads multiple files to Cloudinary with retry logic
 *
 * @param files - Array of file objects or Base64 strings to upload
 * @param options - Optional upload configuration
 * @param config - Cloudinary configuration
 * @returns Promise resolving to an array of upload results
 * @throws CustomError if any upload fails after retries
 */
export const uploadMultipleToCloudinary = async (
  files: (IUploadedFile | string)[],
  options: Partial<ICloudinaryUploadOptions> = {},
  config: ICloudinaryConfig,
): Promise<ICloudinaryUploadResult[]> => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new ValidationError('No valid files provided for upload');
  }

  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, options, config),
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Error uploading multiple files:', error);
    throw new CustomError(
      502,
      `Error uploading multiple files: ${(error as Error).message}`,
    );
  }
};

/**
 * Service class for Cloudinary operations
 */
export class CloudinaryUploadService implements ICloudinaryUploadService {
  constructor(private config: ICloudinaryConfig) {}

  async uploadImage(
    image: string | IUploadedFile,
    options: Partial<ICloudinaryUploadOptions> = {},
  ): Promise<ICloudinaryUploadResult> {
    return uploadToCloudinary(image, options, this.config);
  }

  async deleteImage(publicId: string): Promise<ICloudinaryDeletionResponse> {
    return deleteFromCloudinary(publicId, this.config);
  }
}

/**
 * Factory function to create a Cloudinary service instance
 *
 * @param config - Cloudinary configuration
 * @returns Cloudinary service instance
 */
export const createCloudinaryService = (
  config: ICloudinaryConfig,
): ICloudinaryUploadService => {
  if (!config.api_key || !config.cloud_name || !config.api_secret) {
    throw new Error('Invalid Cloudinary config: missing apiKey or cloudName');
  }
  return new CloudinaryUploadService(config);
};

// Default service instance
export const cloudinaryService = createCloudinaryService(
  defaultCloudinaryConfig,
);
