// src/controllers/authentication/register.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/prismaClient';
import validationMiddleware from '../../middlewares/validation';
import { registerUserValidation } from '../../validations/auth-validations';
import {
  IUserRegistrationInput,
  IUserResponseData,
  UserRole,
} from '../../../types/user-profile.types';
import conditionalCloudinaryUpload from '../../middlewares/conditional-cloudinary-upload';
import multerUpload from '../../config/multer';
import { CLOUDINARY_UPLOAD_OPTIONS } from '../../config/constants';
import { cloudinaryService } from '../../config/claudinary';
import { HTTP_STATUS_CODES } from '../../config/constants';
import { BCRYPT_SALT_ROUNDS } from '../../config/constants';

/**
 * Controller function for user registration
 */
const handleRegisterUser = async (
  req: Request<{}, {}, IUserRegistrationInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userDetails = req.body;
  let uploadedImageUrl: string | undefined;

  try {
    const existingUser = await prisma.user.findFirst();

    // Determine role logic
    let userRole: UserRole;
    if (!existingUser) {
      userRole = UserRole.ADMIN;
    } else if (req.user && req.user.role === UserRole.ADMIN) {
      userRole = userDetails.role ?? UserRole.CUSTOMER;
    } else {
      userRole = UserRole.CUSTOMER;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      userDetails.password,
      BCRYPT_SALT_ROUNDS,
    );

    // Validate profilePicture
    const profilePicture = req.body.profilePicture;
    if (profilePicture && typeof profilePicture !== 'string') {
      res.status(HTTP_STATUS_CODES.BAD_REQUEST);
      throw new Error('Invalid profile picture format. Expected a string URL.');
    }
    uploadedImageUrl = profilePicture;

    const userCreationData: IUserRegistrationInput = {
      ...userDetails,
      password: hashedPassword,
      profilePicture: profilePicture || undefined,
      role: userRole,
    };

    const user = await prisma.user.create({
      data: userCreationData,
    });

    const { password, ...userWithoutPassword } = user;

    // Send response
    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: 'Registration successful.',
      data: userWithoutPassword as IUserResponseData,
    });
  } catch (error) {
    // Clean up Cloudinary image if upload succeeded but DB operation failed
    if (uploadedImageUrl) {
      try {
        await cloudinaryService.deleteImage(uploadedImageUrl);
      } catch (cleanupError) {
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
  multerUpload.single('profilePicture'),
  validationMiddleware.create(registerUserValidation),
  conditionalCloudinaryUpload(CLOUDINARY_UPLOAD_OPTIONS, 'profilePicture'),
  handleRegisterUser,
] as const;

export { registerUser };
