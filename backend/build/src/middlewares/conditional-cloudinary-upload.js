"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handle_cloudinary_upload_1 = require("./handle-cloudinary-upload");
const conditionalCloudinaryUpload = (options, fieldName) => {
    const uploadMiddleware = (0, handle_cloudinary_upload_1.handleCloudinaryUpload)(options, fieldName);
    return (req, res, next) => {
        const hasFile = req.file !== undefined ||
            (Array.isArray(req.files) && req.files.length > 0) ||
            (req.files &&
                typeof req.files === 'object' &&
                fieldName in req.files &&
                Array.isArray(req.files[fieldName]) &&
                req.files[fieldName].length >
                    0); // for .fields()
        if (hasFile) {
            return uploadMiddleware(req, res, next);
        }
        else {
            return next();
        }
    };
};
exports.default = conditionalCloudinaryUpload;
