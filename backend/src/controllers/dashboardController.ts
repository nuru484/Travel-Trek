// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prismaClient';
import { asyncHandler } from '../middlewares/error-handler';
import { HTTP_STATUS_CODES } from '../config/constants';

interface IDashboardStats {
  tours: {
    total: number;
    upcoming: number;
    ongoing: number;
  };
  hotels: {
    total: number;
    availableRooms: number;
  };
  flights: {
    total: number;
    availableSeats: number;
  };
  destinations: {
    total: number;
  };
  bookings?: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  users?: {
    total: number;
    customers: number;
    agents: number;
    admins: number;
  };
}

interface IDashboardResponse {
  message: string;
  data: IDashboardStats;
}

/**
 * Get dashboard statistics
 */
const getDashboardStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
      throw new Error('User ID is required');
    }

    try {
      // Base stats that all users can see
      const [
        totalTours,
        upcomingTours,
        ongoingTours,
        totalHotels,
        availableRooms,
        totalFlights,
        totalSeatsAvailable,
        totalDestinations,
      ] = await Promise.all([
        // Tours stats
        prisma.tour.count(),
        prisma.tour.count({
          where: { status: 'UPCOMING' },
        }),
        prisma.tour.count({
          where: { status: 'ONGOING' },
        }),

        // Hotels stats
        prisma.hotel.count(),
        prisma.room.count({
          where: { available: true },
        }),

        // Flights stats
        prisma.flight.count(),
        prisma.flight.aggregate({
          _sum: {
            seatsAvailable: true,
          },
        }),

        // Destinations stats
        prisma.destination.count(),
      ]);

      const dashboardStats: IDashboardStats = {
        tours: {
          total: totalTours,
          upcoming: upcomingTours,
          ongoing: ongoingTours,
        },
        hotels: {
          total: totalHotels,
          availableRooms: availableRooms,
        },
        flights: {
          total: totalFlights,
          availableSeats: totalSeatsAvailable._sum.seatsAvailable || 0,
        },
        destinations: {
          total: totalDestinations,
        },
      };

      // Add additional stats for admin/agent users
      if (userRole === 'ADMIN' || userRole === 'AGENT') {
        const [
          totalBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          totalUsers,
          totalCustomers,
          totalAgents,
          totalAdmins,
        ] = await Promise.all([
          // Bookings stats
          prisma.booking.count(),
          prisma.booking.count({
            where: { status: 'PENDING' },
          }),
          prisma.booking.count({
            where: { status: 'CONFIRMED' },
          }),
          prisma.booking.count({
            where: { status: 'COMPLETED' },
          }),

          // Users stats
          prisma.user.count(),
          prisma.user.count({
            where: { role: 'CUSTOMER' },
          }),
          prisma.user.count({
            where: { role: 'AGENT' },
          }),
          prisma.user.count({
            where: { role: 'ADMIN' },
          }),
        ]);

        dashboardStats.bookings = {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
        };

        dashboardStats.users = {
          total: totalUsers,
          customers: totalCustomers,
          agents: totalAgents,
          admins: totalAdmins,
        };
      }

      const response: IDashboardResponse = {
        message: 'Dashboard statistics retrieved successfully',
        data: dashboardStats,
      };

      res.status(HTTP_STATUS_CODES.OK).json(response);
    } catch (error) {
      next(error);
    }
  },
);

export { getDashboardStats };
