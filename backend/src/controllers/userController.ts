import { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prismaClient';
import validationMiddleware from '../middlewares/validation';
import { updateUserProfileValidation } from '../validations/user-validations';
import { cloudinaryService } from '../config/claudinary';
import { asyncHandler, ValidationError } from '../middlewares/error-handler';
import {
  IUserResponseData,
  IUserUpdateInput,
  IUserUpdateData,
  UserRole,
  IUsersPaginatedResponse,
} from '../../types/user-profile.types';
import conditionalCloudinaryUpload from '../middlewares/conditional-cloudinary-upload';
import multerUpload from '../config/multer';
import { HTTP_STATUS_CODES, BCRYPT_SALT_ROUNDS } from '../config/constants';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../config/constants';

/**
 * Controller function for updating user profile
 */
const handleUpdateUserProfile = asyncHandler(
  async (
    req: Request<{}, {}, IUserUpdateInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const userId = req.user?.id;
    const userDetails = req.body;

    if (!userId) {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST);
      throw new Error('User ID is required');
    }

    // Track the uploaded image URL for cleanup if needed
    let uploadedImageUrl: string | undefined;
    let oldProfilePicture: string | null = null;

    try {
      // First, get the current user to check for existing profile picture
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(userId.toString()) },
        select: { profilePicture: true },
      });

      if (!existingUser) {
        res.status(HTTP_STATUS_CODES.NOT_FOUND);
        throw new Error('User not found');
      }

      oldProfilePicture = existingUser.profilePicture;

      // Prepare update data with proper typing for Prisma
      const updateData: IUserUpdateData = {};

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
        updateData.password = await bcrypt.hash(
          userDetails.password,
          BCRYPT_SALT_ROUNDS,
        );
      }

      // Handle profile picture - it should be a string URL after middleware processing
      if (
        req.body.profilePicture &&
        typeof req.body.profilePicture === 'string'
      ) {
        updateData.profilePicture = req.body.profilePicture;
        uploadedImageUrl = req.body.profilePicture;
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId.toString()) },
        data: updateData,
      });

      // If we successfully updated with a new profile picture, clean up the old one
      if (
        uploadedImageUrl &&
        oldProfilePicture &&
        oldProfilePicture !== uploadedImageUrl
      ) {
        try {
          await cloudinaryService.deleteImage(oldProfilePicture);
        } catch (cleanupError) {
          console.warn('Failed to clean up old profile picture:', cleanupError);
          // Don't throw here as the main operation succeeded
        }
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      // Send response
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'Profile updated successfully.',
        data: userWithoutPassword as IUserResponseData,
      });
    } catch (error) {
      // If Cloudinary upload succeeded but DB update failed, clean up uploaded image
      if (uploadedImageUrl) {
        try {
          await cloudinaryService.deleteImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error('Failed to clean up Cloudinary image:', cleanupError);
        }
      }
      next(error);
    }
  },
);

/**
 * Middleware array for user profile update
 */
const updateUserProfile: RequestHandler[] = [
  ...validationMiddleware.create(updateUserProfileValidation),
  multerUpload.single('profilePicture'),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'profilePicture'),
  handleUpdateUserProfile,
];

/**
 * Get all users with pagination
 */
const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const role = req.query.role as UserRole | undefined;
    const search = req.query.search as string | undefined;

    // Build where clause for filtering
    const whereClause: any = {};

    if (role && Object.values(UserRole).includes(role)) {
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
      prisma.user.findMany({
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
      prisma.user.count({ where: whereClause }),
    ]);

    const response: IUserResponseData[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      phone: user.phone ?? undefined,
      address: user.address ?? undefined,
      profilePicture: user.profilePicture ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const paginatedResponse: IUsersPaginatedResponse = {
      message: 'Users retrieved successfully',
      data: response,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.status(HTTP_STATUS_CODES.OK).json(paginatedResponse);
  },
);

/**
 * Change user role - Admin only
 */
const changeUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user?.id;

    // Validate input
    if (!userId || isNaN(parseInt(userId))) {
      throw new ValidationError('Valid user ID is required');
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new ValidationError('Valid role is required');
    }

    // Prevent users from changing their own role
    if (parseInt(userId) === parseInt(currentUserId?.toString() || '0')) {
      res.status(HTTP_STATUS_CODES.FORBIDDEN);
      throw new Error('You cannot change your own role');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!existingUser) {
      res.status(HTTP_STATUS_CODES.NOT_FOUND);
      throw new Error('User not found');
    }

    // Check if role is already the same
    if (existingUser.role === role) {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST);
      throw new Error(`User already has the role: ${role}`);
    }

    // Update user role
    const updatedUser = await prisma.user.update({
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

    const response: IUserResponseData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role as UserRole,
      phone: updatedUser.phone ?? undefined,
      address: updatedUser.address ?? undefined,
      profilePicture: updatedUser.profilePicture ?? undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `User role updated successfully to ${role}`,
      data: response,
    });
  },
);

/**
 * Delete a single user - Admin only
 */
const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Validate input
    if (!userId || isNaN(parseInt(userId))) {
      throw new ValidationError('Valid user ID is required');
    }

    // Check if user exists and get profile picture for cleanup
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        _count: {
          select: {
            bookings: true,
            payments: true,
            reviews: true,
            inquiries: true,
          },
        },
      },
    });

    if (!existingUser) {
      res.status(HTTP_STATUS_CODES.NOT_FOUND);
      throw new Error('User not found');
    }

    // Check for related data that might prevent deletion
    const hasRelatedData =
      existingUser._count.bookings > 0 ||
      existingUser._count.payments > 0 ||
      existingUser._count.reviews > 0 ||
      existingUser._count.inquiries > 0;

    if (hasRelatedData) {
      res.status(HTTP_STATUS_CODES.CONFLICT);
      throw new Error(
        'Cannot delete user with existing bookings, payments, reviews, or inquiries. ' +
          'Please handle related data first or consider deactivating the user instead.',
      );
    }

    // Delete user (related wishlist and notifications will be cascade deleted)
    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });

    // Clean up profile picture from Cloudinary if exists
    if (existingUser.profilePicture) {
      try {
        await cloudinaryService.deleteImage(existingUser.profilePicture);
      } catch (cleanupError) {
        console.warn(
          `Failed to clean up profile picture for deleted user ${userId}:`,
          cleanupError,
        );
        // Don't throw here as the main operation succeeded
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `User "${existingUser.name}" (${existingUser.email}) deleted successfully`,
    });
  },
);

/**
 * Delete all users - Super Admin only (dangerous operation)
 */
const deleteAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const currentUserId = req.user?.id;
    const confirmDelete = req.body.confirmDelete;

    // Require explicit confirmation
    if (confirmDelete !== 'DELETE_ALL_USERS') {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST);
      throw new Error(
        'This operation requires confirmation. Send { "confirmDelete": "DELETE_ALL_USERS" } in request body.',
      );
    }

    // Get all users except the current admin
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { not: parseInt(currentUserId?.toString() || '0') },
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        _count: {
          select: {
            bookings: true,
            payments: true,
            reviews: true,
            inquiries: true,
          },
        },
      },
    });

    if (usersToDelete.length === 0) {
      res.status(HTTP_STATUS_CODES.OK).json({
        message: 'No users to delete',
        deletedCount: 0,
      });
      return;
    }

    // Check if any users have related data
    const usersWithRelatedData = usersToDelete.filter(
      (user) =>
        user._count.bookings > 0 ||
        user._count.payments > 0 ||
        user._count.reviews > 0 ||
        user._count.inquiries > 0,
    );

    if (usersWithRelatedData.length > 0) {
      res.status(HTTP_STATUS_CODES.CONFLICT);
      throw new Error(
        `Cannot delete ${usersWithRelatedData.length} users with existing related data. ` +
          'Please handle related data first or consider bulk deactivation instead.',
      );
    }

    // Collect profile pictures for cleanup
    const profilePicturesToDelete = usersToDelete
      .filter((user) => user.profilePicture)
      .map((user) => user.profilePicture!);

    // Delete all users except current admin
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { not: parseInt(currentUserId?.toString() || '0') },
      },
    });

    // Clean up profile pictures from Cloudinary
    if (profilePicturesToDelete.length > 0) {
      const cleanupPromises = profilePicturesToDelete.map(
        async (profilePicture) => {
          try {
            await cloudinaryService.deleteImage(profilePicture);
          } catch (error) {
            console.warn(
              `Failed to clean up profile picture: ${profilePicture}`,
              error,
            );
          }
        },
      );

      // Execute cleanup concurrently but don't wait for completion
      Promise.allSettled(cleanupPromises).then((results) => {
        const failed = results.filter(
          (result) => result.status === 'rejected',
        ).length;
        if (failed > 0) {
          console.warn(
            `Failed to clean up ${failed} profile pictures from Cloudinary`,
          );
        }
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: `Successfully deleted ${deleteResult.count} users`,
      deletedCount: deleteResult.count,
    });
  },
);

export {
  updateUserProfile,
  getAllUsers,
  changeUserRole,
  deleteUser,
  deleteAllUsers,
};
