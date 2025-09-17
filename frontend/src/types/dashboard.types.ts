// src/types/dashboard.types.ts
export interface IDashboardStats {
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

export interface IDashboardResponse {
  message: string;
  data: IDashboardStats;
}
