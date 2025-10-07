"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUsers = exports.deleteUser = exports.changeUserRole = exports.getAllUsers = exports.getUserById = exports.updateUserProfile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const validation_1 = __importDefault(require("../middlewares/validation"));
const user_validations_1 = require("../validations/user-validations");
const claudinary_1 = require("../config/claudinary");
const error_handler_1 = require("../middlewares/error-handler");
const user_profile_types_1 = require("../../types/user-profile.types");
const conditional_cloudinary_upload_1 = __importDefault(require("../middlewares/conditional-cloudinary-upload"));
const multer_1 = __importDefault(require("../config/multer"));
const constants_1 = require("../config/constants");
const constants_2 = require("../config/constants");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Controller function for updating user profile
 */
const handleUpdateUserProfile = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const userDetails = req.body;
    if (!userId || isNaN(parseInt(userId))) {
        throw new error_handler_1.BadRequestError('Valid user ID is required.');
    }
    const targetUserId = parseInt(userId);
    // Authorization check
    if (targetUserId !== parseInt(currentUserId?.toString() || '0') &&
        currentUserRole !== user_profile_types_1.UserRole.ADMIN &&
        currentUserRole !== user_profile_types_1.UserRole.AGENT) {
        throw new error_handler_1.UnauthorizedError('You are not authorized to update this user.');
    }
    let uploadedImageUrl;
    let oldProfilePicture = null;
    try {
        // Fetch current user data
        const existingUser = await prismaClient_1.default.user.findUnique({
            where: { id: targetUserId },
            select: { profilePicture: true, email: true, phone: true },
        });
        if (!existingUser) {
            throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.NOT_FOUND, 'User not found.');
        }
        oldProfilePicture = existingUser.profilePicture;
        // === Duplicate checks ===
        if (userDetails.email && userDetails.email !== existingUser.email) {
            const existingUserByEmail = await prismaClient_1.default.user.findUnique({
                where: { email: userDetails.email },
            });
            if (existingUserByEmail && existingUserByEmail.id !== targetUserId) {
                throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, 'A user with this email already exists.');
            }
        }
        if (userDetails.phone && userDetails.phone !== existingUser.phone) {
            const existingUserByPhone = await prismaClient_1.default.user.findUnique({
                where: { phone: userDetails.phone },
            });
            if (existingUserByPhone && existingUserByPhone.id !== targetUserId) {
                throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, 'A user with this phone number already exists.');
            }
        }
        // Prepare update data
        const updateData = {};
        if (userDetails.name !== undefined)
            updateData.name = userDetails.name;
        if (userDetails.email !== undefined)
            updateData.email = userDetails.email;
        if (userDetails.phone !== undefined)
            updateData.phone = userDetails.phone;
        if (userDetails.address !== undefined)
            updateData.address = userDetails.address;
        // Password update
        if (userDetails.password) {
            updateData.password = await bcrypt_1.default.hash(userDetails.password, constants_1.BCRYPT_SALT_ROUNDS);
        }
        // Profile picture update
        if (req.body.profilePicture &&
            typeof req.body.profilePicture === 'string') {
            updateData.profilePicture = req.body.profilePicture;
            uploadedImageUrl = req.body.profilePicture;
        }
        // Perform update
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: targetUserId },
            data: updateData,
        });
        // Clean up old image if replaced
        if (uploadedImageUrl &&
            oldProfilePicture &&
            oldProfilePicture !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldProfilePicture);
            }
            catch (cleanupError) {
                logger_1.default.warn('Failed to clean up old profile picture:', cleanupError);
            }
        }
        const { password, ...userWithoutPassword } = updatedUser;
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Profile updated successfully.',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        // Cleanup newly uploaded image if operation failed
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
});
/**
 * Middleware array for user profile update
 */
exports.updateUserProfile = [
    multer_1.default.single('profilePicture'),
    validation_1.default.create(user_validations_1.updateUserProfileValidation),
    (0, conditional_cloudinary_upload_1.default)(constants_2.CLOUDINARY_UPLOAD_OPTIONS, 'profilePicture'),
    handleUpdateUserProfile,
];
/**
 * Get single user by ID
 */
exports.getUserById = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    // Validate input
    if (!userId || isNaN(parseInt(userId))) {
        throw new error_handler_1.ValidationError('Valid user ID is required');
    }
    const targetUserId = parseInt(userId);
    if (targetUserId !== parseInt(currentUserId?.toString() || '0') &&
        currentUserRole !== user_profile_types_1.UserRole.ADMIN &&
        currentUserRole !== user_profile_types_1.UserRole.AGENT) {
        throw new error_handler_1.UnauthorizedError('You are not authorized to view this user profile');
    }
    // Get user from database
    const user = await prismaClient_1.default.user.findUnique({
        where: { id: targetUserId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new error_handler_1.NotFoundError('User not found');
    }
    const response = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone ?? undefined,
        address: user.address ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: 'User retrieved successfully',
        data: response,
    });
});
/**
 * Get all users with pagination
 */
exports.getAllUsers = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Optional filters
    const role = req.query.role;
    const search = req.query.search;
    // Build where clause for filtering
    const whereClause = {};
    if (role && Object.values(user_profile_types_1.UserRole).includes(role)) {
        whereClause.role = role;
    }
    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        prismaClient_1.default.user.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                address: true,
                profilePicture: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prismaClient_1.default.user.count({ where: whereClause }),
    ]);
    const response = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone ?? undefined,
        address: user.address ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }));
    const paginatedResponse = {
        message: 'Users retrieved successfully',
        data: response,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json(paginatedResponse);
});
/**
 * Change user role - Admin only
 */
exports.changeUserRole = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user?.id;
    // Validate input
    if (!userId || isNaN(parseInt(userId))) {
        throw new error_handler_1.ValidationError('Valid user ID is required');
    }
    if (!role || !Object.values(user_profile_types_1.UserRole).includes(role)) {
        throw new error_handler_1.ValidationError('Valid role is required');
    }
    // Prevent users from changing their own role
    if (parseInt(userId) === parseInt(currentUserId?.toString() || '0')) {
        throw new error_handler_1.ForbiddenError('You cannot change your own role');
    }
    // Check if user exists
    const existingUser = await prismaClient_1.default.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true, email: true, role: true },
    });
    if (!existingUser) {
        throw new error_handler_1.NotFoundError('User not found');
    }
    if (existingUser.role === role) {
        throw new error_handler_1.BadRequestError(`User already has the role: ${role}`);
    }
    // Update user role
    const updatedUser = await prismaClient_1.default.user.update({
        where: { id: parseInt(userId) },
        data: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    const response = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone ?? undefined,
        address: updatedUser.address ?? undefined,
        profilePicture: updatedUser.profilePicture ?? undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
    };
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `User role updated successfully to ${role}`,
        data: response,
    });
});
/**
 * Delete a single user - Admin only
 */
exports.deleteUser = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    // Validate input
    if (!userId || isNaN(parseInt(userId))) {
        throw new error_handler_1.ValidationError('Valid user ID is required');
    }
    const targetUserId = parseInt(userId);
    // Authorization checks
    if (targetUserId === parseInt(currentUserId?.toString() || '0')) {
        if (currentUserRole === user_profile_types_1.UserRole.ADMIN) {
            throw new error_handler_1.ForbiddenError('Admins cannot delete themselves');
        }
    }
    else {
        if (currentUserRole !== user_profile_types_1.UserRole.ADMIN) {
            throw new error_handler_1.UnauthorizedError('You are not authorized to delete other users');
        }
    }
    const existingUser = await prismaClient_1.default.user.findUnique({
        where: { id: targetUserId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePicture: true,
            _count: {
                select: {
                    bookings: true,
                    reviews: true,
                    inquiries: true,
                },
            },
        },
    });
    if (!existingUser) {
        throw new error_handler_1.NotFoundError('User not found');
    }
    const activePayments = await prismaClient_1.default.payment.count({
        where: {
            userId: targetUserId,
            status: {
                not: 'REFUNDED',
            },
        },
    });
    if (activePayments > 0) {
        throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, 'Cannot delete user with active (non-refunded) payments. ' +
            'Please handle or refund payments first.');
    }
    // Delete user (cascade deletes Wishlist and Notifications)
    await prismaClient_1.default.user.delete({
        where: { id: targetUserId },
    });
    if (existingUser.profilePicture) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(existingUser.profilePicture);
        }
        catch (cleanupError) {
            logger_1.default.warn(`Failed to clean up profile picture for deleted user ${userId}:`, cleanupError);
        }
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `User "${existingUser.name}" (${existingUser.email}) deleted successfully`,
    });
});
/**
 * Delete all users - Super Admin only (dangerous operation)
 */
exports.deleteAllUsers = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const currentUserId = req.user?.id;
    const confirmDelete = req.body.confirmDelete;
    // Require explicit confirmation
    if (confirmDelete !== 'DELETE_ALL_USERS') {
        throw new error_handler_1.BadRequestError('This operation requires confirmation. Send { "confirmDelete": "DELETE_ALL_USERS" } in request body.');
    }
    // Get all users except the current admin
    const usersToDelete = await prismaClient_1.default.user.findMany({
        where: {
            id: { not: parseInt(currentUserId?.toString() || '0') },
        },
        select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
        },
    });
    if (usersToDelete.length === 0) {
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'No users to delete',
            deletedCount: 0,
        });
        return;
    }
    // Find users with non-refunded payments
    const usersWithActivePayments = await prismaClient_1.default.payment.findMany({
        where: {
            userId: {
                in: usersToDelete.map((u) => u.id),
            },
            status: {
                not: 'REFUNDED',
            },
        },
        select: { userId: true },
    });
    const blockedUserIds = new Set(usersWithActivePayments.map((p) => p.userId));
    if (blockedUserIds.size > 0) {
        throw new error_handler_1.CustomError(constants_1.HTTP_STATUS_CODES.CONFLICT, `Cannot delete ${blockedUserIds.size} users with active (non-refunded) payments. ` +
            'Please handle or refund payments first.');
    }
    // Collect profile pictures for cleanup
    const profilePicturesToDelete = usersToDelete
        .filter((user) => user.profilePicture)
        .map((user) => user.profilePicture);
    // Delete all users except current admin
    const deleteResult = await prismaClient_1.default.user.deleteMany({
        where: {
            id: { not: parseInt(currentUserId?.toString() || '0') },
        },
    });
    // Clean up profile pictures from Cloudinary
    if (profilePicturesToDelete.length > 0) {
        const cleanupPromises = profilePicturesToDelete.map(async (profilePicture) => {
            try {
                await claudinary_1.cloudinaryService.deleteImage(profilePicture);
            }
            catch (error) {
                logger_1.default.warn(`Failed to clean up profile picture: ${profilePicture}`, error);
            }
        });
        // Execute cleanup concurrently but don't wait for completion
        Promise.allSettled(cleanupPromises).then((results) => {
            const failed = results.filter((result) => result.status === 'rejected').length;
            if (failed > 0) {
                logger_1.default.warn(`Failed to clean up ${failed} profile pictures from Cloudinary`);
            }
        });
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Successfully deleted ${deleteResult.count} users`,
        deletedCount: deleteResult.count,
    });
});
