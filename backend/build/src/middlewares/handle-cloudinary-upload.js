"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCloudinaryUpload = void 0;
const error_handler_1 = require("./error-handler");
const claudinary_1 = require("../config/claudinary");
const validate_base64_image_1 = require("../utils/validate-base64-image");
/**
 * Factory function to create middleware for handling file uploads to Cloudinary
 * @param defaultOptions - Default Cloudinary upload options
 * @param uploadedResultsName - The key to store upload results in req.body
 * @returns Express middleware
 */
const handleCloudinaryUpload = (defaultOptions = {}, uploadedResultsName) => {
    return (0, error_handler_1.asyncHandler)(async (req, res, next) => {
        try {
            // Merge defaultOptions with any options provided in req.body
            const options = {
                ...defaultOptions,
                ...(req.body.uploadOptions || {}),
            };
            // Case 1: Single file upload
            if (req.file) {
                const result = await claudinary_1.cloudinaryService.uploadImage({ ...req.file }, options);
                req.body[uploadedResultsName] = result.secure_url;
                return next();
            }
            // Case 2: Multiple file uploads as array
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                const results = await Promise.all(req.files.map((file) => claudinary_1.cloudinaryService.uploadImage({ ...file }, options)));
                req.body[uploadedResultsName] = results.map((result) => result.secure_url);
                return next();
            }
            // Case 3: Multiple file uploads as object (for fields)
            if (req.files && !Array.isArray(req.files)) {
                const results = {};
                for (const fieldname in req.files) {
                    const fieldFiles = req.files[fieldname];
                    if (Array.isArray(fieldFiles) && fieldFiles.length > 0) {
                        results[fieldname] = await Promise.all(fieldFiles.map((file) => claudinary_1.cloudinaryService.uploadImage({ ...file }, options)));
                    }
                }
                if (Object.keys(results).length > 0) {
                    req.body[uploadedResultsName] = results.map((result) => result.secure_url);
                    return next();
                }
            }
            // Case 4: Base64 image upload
            if (req.body.image &&
                typeof req.body.image === 'string' &&
                (0, validate_base64_image_1.isValidBase64Image)(req.body.image)) {
                const result = await claudinary_1.cloudinaryService.uploadImage(req.body.image, options);
                req.body[uploadedResultsName] = result.secure_url;
                return next();
            }
            // No valid files found
            return next(new error_handler_1.ValidationError('No valid files found for upload'));
        }
        catch (error) {
            return next(error);
        }
    });
};
exports.handleCloudinaryUpload = handleCloudinaryUpload;
