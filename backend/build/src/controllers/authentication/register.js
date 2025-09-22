"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const validation_1 = __importDefault(require("../../middlewares/validation"));
const auth_validations_1 = require("../../validations/auth-validations");
const user_profile_types_1 = require("../../../types/user-profile.types");
const conditional_cloudinary_upload_1 = __importDefault(require("../../middlewares/conditional-cloudinary-upload"));
const multer_1 = __importDefault(require("../../config/multer"));
const constants_1 = require("../../config/constants");
const claudinary_1 = require("../../config/claudinary");
const constants_2 = require("../../config/constants");
const constants_3 = require("../../config/constants");
/**
 * Controller function for user registration
 */
const handleRegisterUser = async (req, res, next) => {
    const userDetails = req.body;
    let uploadedImageUrl;
    try {
        const existingUser = await prismaClient_1.default.user.findFirst();
        // Determine role logic
        let userRole;
        if (!existingUser) {
            userRole = user_profile_types_1.UserRole.ADMIN;
        }
        else if (req.user && req.user.role === user_profile_types_1.UserRole.ADMIN) {
            userRole = userDetails.role ?? user_profile_types_1.UserRole.CUSTOMER;
        }
        else {
            userRole = user_profile_types_1.UserRole.CUSTOMER;
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(userDetails.password, constants_3.BCRYPT_SALT_ROUNDS);
        // Validate profilePicture
        const profilePicture = req.body.profilePicture;
        if (profilePicture && typeof profilePicture !== 'string') {
            res.status(constants_2.HTTP_STATUS_CODES.BAD_REQUEST);
            throw new Error('Invalid profile picture format. Expected a string URL.');
        }
        uploadedImageUrl = profilePicture;
        const userCreationData = {
            ...userDetails,
            password: hashedPassword,
            profilePicture: profilePicture || undefined,
            role: userRole,
        };
        const user = await prismaClient_1.default.user.create({
            data: userCreationData,
        });
        const { password, ...userWithoutPassword } = user;
        // Send response
        res.status(constants_2.HTTP_STATUS_CODES.CREATED).json({
            message: 'Registration successful.',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        // Clean up Cloudinary image if upload succeeded but DB operation failed
        if (uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(uploadedImageUrl);
            }
            catch (cleanupError) {
                console.error('Failed to clean up Cloudinary image:', cleanupError);
            }
        }
        next(error);
    }
};
/**
 * Middleware array for user registration
 */
const registerUser = [
    multer_1.default.single('profilePicture'),
    validation_1.default.create(auth_validations_1.registerUserValidation),
    (0, conditional_cloudinary_upload_1.default)(constants_1.CLOUDINARY_UPLOAD_OPTIONS, 'profilePicture'),
    handleRegisterUser,
];
exports.registerUser = registerUser;
