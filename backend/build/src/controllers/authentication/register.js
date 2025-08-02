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
// Constants for configuration
const BCRYPT_SALT_ROUNDS = 10;
const HTTP_STATUS = {
    CREATED: 201,
    NOT_FOUND: 404,
    CONFLICT: 409,
};
/**
 * Controller function for user registration
 */
const handleRegisterUser = async (req, res, next) => {
    const userDetails = req.body;
    try {
        const hashedPassword = await bcrypt_1.default.hash(userDetails.password, BCRYPT_SALT_ROUNDS);
        // Prepare user creation data
        const userCreationData = {
            ...userDetails,
            password: hashedPassword,
        };
        const user = await prismaClient_1.default.user.create({
            data: userCreationData,
        });
        const { password, ...userWithoutPassword } = user;
        // Send response
        res.status(HTTP_STATUS.CREATED).json({
            message: 'Registration successful.',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * Middleware array for user registration
 */
const registerUser = [
    validation_1.default.create(auth_validations_1.registerUserValidation),
    handleRegisterUser,
];
exports.registerUser = registerUser;
