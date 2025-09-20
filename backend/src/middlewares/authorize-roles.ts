import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './error-handler';
import { UserRole } from 'types/user-profile.types';
import { ForbiddenError } from './error-handler';

/**
 * Role-based authorization middleware
 *
 * @param allowedRoles - Array of roles that are permitted to access the route
 * @returns Express middleware function that validates user roles
 * @throws ForbiddenError if user's role is not in the allowed roles
 */
export const authorizeRole = (allowedRoles: UserRole[]) =>
  asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Verify user object exists
      if (!req.user) {
        throw new ForbiddenError('Unauthorized: User not authenticated');
      }

      // Verify role exists
      if (!req.user.role) {
        throw new ForbiddenError('Unauthorized: User role not defined');
      }

      console.log('User Role (from request):', req.user.role);
      console.log('Allowed Roles:', allowedRoles);
      console.log('Comparison check:', allowedRoles.includes(req.user.role));

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new ForbiddenError();
      }

      // User is authorized
      next();
    },
  );
