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
/**
 * Controller function for updating user profile
 */
const handleUpdateUserProfile = (0, error_handler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const userDetails = req.body;
    if (!userId || isNaN(parseInt(userId))) {
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST);
        throw new Error('Valid user ID is required');
    }
    const targetUserId = parseInt(userId);
    // Authorization check
    if (targetUserId !== parseInt(currentUserId?.toString() || '0') &&
        currentUserRole !== user_profile_types_1.UserRole.ADMIN &&
        currentUserRole !== user_profile_types_1.UserRole.AGENT) {
        res.status(constants_1.HTTP_STATUS_CODES.FORBIDDEN);
        throw new Error('You are not authorized to update this user');
    }
    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl;
    let oldProfilePicture = null;
    try {
        // First, get the current user to check for existing profile picture
        const existingUser = await prismaClient_1.default.user.findUnique({
            where: { id: targetUserId },
            select: { profilePicture: true },
        });
        if (!existingUser) {
            res.status(constants_1.HTTP_STATUS_CODES.NOT_FOUND);
            throw new Error('User not found');
        }
        oldProfilePicture = existingUser.profilePicture;
        // Prepare update data with proper typing for Prisma
        const updateData = {};
        // Only update fields that are provided
        if (userDetails.name !== undefined) {
            updateData.name = userDetails.name;
        }
        if (userDetails.email !== undefined) {
            updateData.email = userDetails.email;
        }
        if (userDetails.phone !== undefined) {
            updateData.phone = userDetails.phone;
        }
        if (userDetails.address !== undefined) {
            updateData.address = userDetails.address;
        }
        // Handle password update if provided
        if (userDetails.password) {
            updateData.password = await bcrypt_1.default.hash(userDetails.password, constants_1.BCRYPT_SALT_ROUNDS);
        }
        // Handle profile picture - it should be a string URL after middleware processing
        if (req.body.profilePicture &&
            typeof req.body.profilePicture === 'string') {
            updateData.profilePicture = req.body.profilePicture;
            uploadedImageUrl = req.body.profilePicture;
        }
        // Update user in database
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: targetUserId },
            data: updateData,
        });
        // If we successfully updated with a new profile picture, clean up the old one
        if (uploadedImageUrl &&
            oldProfilePicture &&
            oldProfilePicture !== uploadedImageUrl) {
            try {
                await claudinary_1.cloudinaryService.deleteImage(oldProfilePicture);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up old profile picture:', cleanupError);
                // Don't throw here as the main operation succeeded
            }
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        // Send response
        res.status(constants_1.HTTP_STATUS_CODES.OK).json({
            message: 'Profile updated successfully.',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        // If Cloudinary upload succeeded but DB update failed, clean up uploaded image
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
    // Authorization check - users can view their own profile, admins can view any profile
    if (targetUserId !== parseInt(currentUserId?.toString() || '0') &&
        currentUserRole !== user_profile_types_1.UserRole.ADMIN &&
        currentUserRole !== user_profile_types_1.UserRole.AGENT) {
        res.status(constants_1.HTTP_STATUS_CODES.FORBIDDEN);
        throw new Error('You are not authorized to view this user profile');
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
        res.status(constants_1.HTTP_STATUS_CODES.NOT_FOUND);
        throw new Error('User not found');
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
        res.status(constants_1.HTTP_STATUS_CODES.FORBIDDEN);
        throw new Error('You cannot change your own role');
    }
    // Check if user exists
    const existingUser = await prismaClient_1.default.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true, email: true, role: true },
    });
    if (!existingUser) {
        res.status(constants_1.HTTP_STATUS_CODES.NOT_FOUND);
        throw new Error('User not found');
    }
    // Check if role is already the same
    if (existingUser.role === role) {
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST);
        throw new Error(`User already has the role: ${role}`);
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
        // User is trying to delete themselves
        if (currentUserRole === user_profile_types_1.UserRole.ADMIN) {
            res.status(constants_1.HTTP_STATUS_CODES.FORBIDDEN);
            throw new Error('Admins cannot delete themselves');
        }
    }
    else {
        // User is trying to delete someone else
        if (currentUserRole !== user_profile_types_1.UserRole.ADMIN) {
            res.status(constants_1.HTTP_STATUS_CODES.FORBIDDEN);
            throw new Error('You are not authorized to delete other users');
        }
    }
    // Check if user exists and get related counts
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
        res.status(constants_1.HTTP_STATUS_CODES.NOT_FOUND);
        throw new Error('User not found');
    }
    // Check for non-refunded payments
    const activePayments = await prismaClient_1.default.payment.count({
        where: {
            userId: targetUserId,
            status: {
                not: 'REFUNDED',
            },
        },
    });
    // If user has active payments (not refunded), prevent deletion
    if (activePayments > 0) {
        res.status(constants_1.HTTP_STATUS_CODES.CONFLICT);
        throw new Error('Cannot delete user with active (non-refunded) payments. ' +
            'Please handle or refund payments first.');
    }
    // Delete user (cascade deletes Wishlist and Notifications)
    await prismaClient_1.default.user.delete({
        where: { id: targetUserId },
    });
    // Clean up profile picture from Cloudinary if exists
    if (existingUser.profilePicture) {
        try {
            await claudinary_1.cloudinaryService.deleteImage(existingUser.profilePicture);
        }
        catch (cleanupError) {
            console.warn(`Failed to clean up profile picture for deleted user ${userId}:`, cleanupError);
            // Don't throw here as the main operation succeeded
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
        res.status(constants_1.HTTP_STATUS_CODES.BAD_REQUEST);
        throw new Error('This operation requires confirmation. Send { "confirmDelete": "DELETE_ALL_USERS" } in request body.');
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
        res.status(constants_1.HTTP_STATUS_CODES.CONFLICT);
        throw new Error(`Cannot delete ${blockedUserIds.size} users with active (non-refunded) payments. ` +
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
                console.warn(`Failed to clean up profile picture: ${profilePicture}`, error);
            }
        });
        // Execute cleanup concurrently but don't wait for completion
        Promise.allSettled(cleanupPromises).then((results) => {
            const failed = results.filter((result) => result.status === 'rejected').length;
            if (failed > 0) {
                console.warn(`Failed to clean up ${failed} profile pictures from Cloudinary`);
            }
        });
    }
    res.status(constants_1.HTTP_STATUS_CODES.OK).json({
        message: `Successfully deleted ${deleteResult.count} users`,
        deletedCount: deleteResult.count,
    });
});
