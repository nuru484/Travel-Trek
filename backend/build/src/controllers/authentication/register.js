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
const env_1 = require("../../config/env");
const CookieManager_1 = require("../../utils/CookieManager");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_2 = __importDefault(require("../../config/env"));
const logger_1 = __importDefault(require("../../utils/logger"));
const error_handler_1 = require("../../middlewares/error-handler");
/**
 * Controller function for user registration
 */
const handleRegisterUser = async (req, res, next) => {
    const userDetails = req.body;
    let uploadedImageUrl;
    try {
        let userRole;
        let isAdminCreatingUser = false;
        if (req.user) {
            if (req.user.role !== user_profile_types_1.UserRole.ADMIN) {
                throw new error_handler_1.UnauthorizedError('Unauthorized. Only admins can add users.');
            }
            isAdminCreatingUser = true;
            userRole = userDetails.role ?? user_profile_types_1.UserRole.CUSTOMER;
        }
        else {
            userRole = user_profile_types_1.UserRole.CUSTOMER;
        }
        const existingUserByEmail = await prismaClient_1.default.user.findUnique({
            where: { email: userDetails.email },
        });
        if (existingUserByEmail) {
            throw new error_handler_1.CustomError(constants_2.HTTP_STATUS_CODES.CONFLICT, 'A user with this email already exists.');
        }
        if (userDetails.phone) {
            const existingUserByPhone = await prismaClient_1.default.user.findUnique({
                where: { phone: userDetails.phone },
            });
            if (existingUserByPhone) {
                throw new error_handler_1.CustomError(constants_2.HTTP_STATUS_CODES.CONFLICT, 'A user with this phone number already exists.');
            }
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(userDetails.password, constants_3.BCRYPT_SALT_ROUNDS);
        // Validate profilePicture
        const profilePicture = req.body.profilePicture;
        if (profilePicture && typeof profilePicture !== 'string') {
            throw new error_handler_1.BadRequestError('Invalid profile picture format. Expected a string URL.');
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
        if (!isAdminCreatingUser) {
            const accessToken = jsonwebtoken_1.default.sign({ id: user.id.toString(), role: user.role }, (0, env_1.assertEnv)(env_2.default.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'), { expiresIn: '30m' });
            const refreshToken = jsonwebtoken_1.default.sign({ id: user.id.toString(), role: user.role }, (0, env_1.assertEnv)(env_2.default.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'), {
                expiresIn: '7d',
            });
            CookieManager_1.CookieManager.clearAllTokens(res);
            CookieManager_1.CookieManager.setAccessToken(res, accessToken);
            CookieManager_1.CookieManager.setRefreshToken(res, refreshToken);
        }
        res.status(constants_2.HTTP_STATUS_CODES.CREATED).json({
            message: isAdminCreatingUser
                ? 'User created successfully.'
                : 'Registration successful.',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        if (uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(uploadedImageUrl);
            }
            catch (cleanupError) {
                logger_1.default.error('Failed to clean up Cloudinary image:', cleanupError);
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
