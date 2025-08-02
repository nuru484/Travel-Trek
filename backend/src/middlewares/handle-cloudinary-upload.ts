// src/middlewares/handle-cloudinary-upload.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError, asyncHandler } from './error-handler';
import { ICloudinaryUploadOptions } from 'types/cloudinary.types';
import { cloudinaryService } from '../config/claudinary';
import { isValidBase64Image } from '../utils/validate-base64-image';

// Custom request interface that extends Express Request
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

/**
 * Factory function to create middleware for handling file uploads to Cloudinary
 * @param defaultOptions - Default Cloudinary upload options
 * @param uploadedResultsName - The key to store upload results in req.body
 * @returns Express middleware
 */
export const handleCloudinaryUpload = (
  defaultOptions: Partial<ICloudinaryUploadOptions> = {},
  uploadedResultsName: string,
) => {
  return asyncHandler(
    async (req: MulterRequest, res: Response, next: NextFunction) => {
      try {
        // Merge defaultOptions with any options provided in req.body
        const options: Partial<ICloudinaryUploadOptions> = {
          ...defaultOptions,
          ...(req.body.uploadOptions || {}),
        };

        // Case 1: Single file upload
        if (req.file) {
          const result = await cloudinaryService.uploadImage(
            { ...req.file },
            options,
          );
          req.body[uploadedResultsName] = result.secure_url;
          return next();
        }

        // Case 2: Multiple file uploads as array
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
          const results = await Promise.all(
            req.files.map((file) =>
              cloudinaryService.uploadImage({ ...file }, options),
            ),
          );
          req.body[uploadedResultsName] = results.map(
            (result: { secure_url: string }) => result.secure_url,
          );
          return next();
        }

        // Case 3: Multiple file uploads as object (for fields)
        if (req.files && !Array.isArray(req.files)) {
          const results: Record<string, any> = {};

          for (const fieldname in req.files) {
            const fieldFiles = req.files[fieldname];
            if (Array.isArray(fieldFiles) && fieldFiles.length > 0) {
              results[fieldname] = await Promise.all(
                fieldFiles.map((file) =>
                  cloudinaryService.uploadImage({ ...file }, options),
                ),
              );
            }
          }

          if (Object.keys(results).length > 0) {
            req.body[uploadedResultsName] = results.map(
              (result: { secure_url: string }) => result.secure_url,
            );
            return next();
          }
        }

        // Case 4: Base64 image upload
        if (
          req.body.image &&
          typeof req.body.image === 'string' &&
          isValidBase64Image(req.body.image)
        ) {
          const result = await cloudinaryService.uploadImage(
            req.body.image,
            options,
          );
          req.body[uploadedResultsName] = result.secure_url;
          return next();
        }

        // No valid files found
        return next(new ValidationError('No valid files found for upload'));
      } catch (error) {
        return next(error);
      }
    },
  );
};
