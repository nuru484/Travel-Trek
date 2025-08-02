"use strict";
// src/config/claudinary.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryService = exports.createCloudinaryService = exports.CloudinaryUploadService = exports.uploadMultipleToCloudinary = exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.extractPublicIdFromUrl = exports.defaultCloudinaryConfig = void 0;
/**
 * Cloudinary Service
 *
 * This module provides utilities for interacting with Cloudinary API with
 * retry logic, Base64 image support, dynamic configuration, and robust error handling.
 */
require('dotenv').config();
const cloudinary_1 = require("cloudinary");
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = require("./env");
const env_2 = __importDefault(require("./env"));
const error_handler_1 = require("../middlewares/error-handler");
const validate_base64_image_1 = require("../utils/validate-base64-image");
// Constants
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
// Default configuration from environment variables
exports.defaultCloudinaryConfig = {
    cloud_name: (0, env_1.assertEnv)(env_2.default.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME'),
    api_key: (0, env_1.assertEnv)(env_2.default.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY'),
    api_secret: (0, env_1.assertEnv)(env_2.default.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET'),
};
/**
 * Utility function to extract public ID from a Cloudinary URL
 *
 * @param url - Cloudinary URL
 * @returns Extracted public ID
 */
const extractPublicIdFromUrl = (url) => {
    try {
        const urlPath = new URL(url).pathname;
        const parts = urlPath.split('/');
        const filename = parts[parts.length - 1];
        return filename.split('.')[0];
    }
    catch (error) {
        // Fallback to simpler string manipulation
        return url.split('/').slice(-1)[0].split('.')[0];
    }
};
exports.extractPublicIdFromUrl = extractPublicIdFromUrl;
/**
 * Validates a Cloudinary configuration
 *
 * @param config - Cloudinary configuration object
 * @throws Error if required fields are missing
 */
const validateConfig = (config) => {
    const requiredFields = ['cloud_name', 'api_key', 'api_secret'];
    const missingFields = requiredFields.filter((field) => !config[field]);
    if (missingFields.length > 0) {
        throw new Error(`Missing required Cloudinary configuration fields: ${missingFields.join(', ')}`);
    }
};
/**
 * Creates a configured Cloudinary instance
 *
 * @param config - Cloudinary configuration
 * @returns Configured Cloudinary instance
 */
const createCloudinaryInstance = (config) => {
    validateConfig(config);
    const cloudinaryInstance = cloudinary_1.v2;
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
const uploadToCloudinary = async (file, options = {}, config) => {
    const cloudinary = createCloudinaryInstance(config);
    if (typeof file === 'string' && !(0, validate_base64_image_1.isValidBase64Image)(file)) {
        throw new error_handler_1.ValidationError('Invalid Base64 image format. Must be a valid data URI.');
    }
    else if (typeof file !== 'string' && (!file || !file.buffer)) {
        throw new error_handler_1.ValidationError('Invalid file object. Ensure the file is provided and has a buffer property.');
    }
    const uploadOptions = {
        resource_type: 'auto',
        ...options,
    };
    let attempts = 0;
    while (attempts < MAX_UPLOAD_RETRIES) {
        try {
            let result;
            if (typeof file === 'string') {
                result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload(file, uploadOptions, (error, uploadResult) => {
                        if (error || !uploadResult) {
                            reject(new Error(error?.message || 'Unknown error during upload'));
                        }
                        else {
                            resolve(uploadResult);
                        }
                    });
                });
            }
            else {
                result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
                        if (error || !uploadResult) {
                            reject(new Error(error?.message || 'Unknown error during upload'));
                        }
                        else {
                            resolve(uploadResult);
                        }
                    });
                    uploadStream.end(file.buffer);
                });
            }
            logger_1.default.debug(`File uploaded successfully to Cloudinary: ${result.public_id}`);
            return {
                public_id: result.public_id,
                secure_url: result.secure_url,
                asset_id: result.asset_id,
                format: result.format,
                resource_type: result.resource_type,
            };
        }
        catch (error) {
            attempts++;
            const errorMessage = error.message;
            if (attempts === MAX_UPLOAD_RETRIES) {
                logger_1.default.error(`Upload failed after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`);
                throw new error_handler_1.CustomError(502, `Failed to upload to Cloudinary after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`);
            }
            logger_1.default.warn(`Upload attempt ${attempts} failed: ${errorMessage}. Retrying in ${RETRY_DELAY_MS}ms...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
    throw new error_handler_1.InternalServerError('Unexpected error during upload process');
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Deletes a file from Cloudinary using its URL or public ID with retry logic
 *
 * @param identifier - Cloudinary URL or public ID of the file to delete
 * @param config - Cloudinary configuration
 * @returns Promise resolving to the deletion result
 * @throws CustomError if deletion fails after retries
 */
const deleteFromCloudinary = async (identifier, config) => {
    if (!identifier) {
        throw new error_handler_1.ValidationError('No Cloudinary identifier provided for deletion');
    }
    const cloudinary = createCloudinaryInstance(config);
    const publicId = identifier.includes('http')
        ? (0, exports.extractPublicIdFromUrl)(identifier)
        : identifier;
    logger_1.default.debug(`Attempting to delete file with public ID: ${publicId}`);
    let attempts = 0;
    while (attempts < MAX_UPLOAD_RETRIES) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            logger_1.default.info(`Cloudinary deletion result: ${JSON.stringify(result)}`);
            if (result.result !== 'ok') {
                throw new Error(`Deletion failed with result: ${result.result}`);
            }
            return result;
        }
        catch (error) {
            attempts++;
            const errorMessage = error.message;
            if (attempts === MAX_UPLOAD_RETRIES) {
                logger_1.default.error(`Deletion failed after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`);
                throw new error_handler_1.CustomError(502, `Failed to delete from Cloudinary after ${MAX_UPLOAD_RETRIES} attempts: ${errorMessage}`);
            }
            logger_1.default.warn(`Deletion attempt ${attempts} failed: ${errorMessage}. Retrying in ${RETRY_DELAY_MS}ms...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
    throw new error_handler_1.InternalServerError('Unexpected error during deletion process');
};
exports.deleteFromCloudinary = deleteFromCloudinary;
/**
 * Uploads multiple files to Cloudinary with retry logic
 *
 * @param files - Array of file objects or Base64 strings to upload
 * @param options - Optional upload configuration
 * @param config - Cloudinary configuration
 * @returns Promise resolving to an array of upload results
 * @throws CustomError if any upload fails after retries
 */
const uploadMultipleToCloudinary = async (files, options = {}, config) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
        throw new error_handler_1.ValidationError('No valid files provided for upload');
    }
    try {
        const uploadPromises = files.map((file) => (0, exports.uploadToCloudinary)(file, options, config));
        return await Promise.all(uploadPromises);
    }
    catch (error) {
        logger_1.default.error('Error uploading multiple files:', error);
        throw new error_handler_1.CustomError(502, `Error uploading multiple files: ${error.message}`);
    }
};
exports.uploadMultipleToCloudinary = uploadMultipleToCloudinary;
/**
 * Service class for Cloudinary operations
 */
class CloudinaryUploadService {
    config;
    constructor(config) {
        this.config = config;
    }
    async uploadImage(image, options = {}) {
        return (0, exports.uploadToCloudinary)(image, options, this.config);
    }
    async deleteImage(publicId) {
        return (0, exports.deleteFromCloudinary)(publicId, this.config);
    }
}
exports.CloudinaryUploadService = CloudinaryUploadService;
/**
 * Factory function to create a Cloudinary service instance
 *
 * @param config - Cloudinary configuration
 * @returns Cloudinary service instance
 */
const createCloudinaryService = (config) => {
    if (!config.api_key || !config.cloud_name || !config.api_secret) {
        throw new Error('Invalid Cloudinary config: missing apiKey or cloudName');
    }
    return new CloudinaryUploadService(config);
};
exports.createCloudinaryService = createCloudinaryService;
// Default service instance
exports.cloudinaryService = (0, exports.createCloudinaryService)(exports.defaultCloudinaryConfig);
