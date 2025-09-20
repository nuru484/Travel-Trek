export interface IBookingInput {
  userId: number;
  tourId?: number | null;
  hotelId?: number | null;
  roomId?: number | null;
  flightId?: number | null;
  totalPrice: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export interface IBookingUser {
  id: number;
  name: string;
  email: string;
}

export interface IBookingTour {
  id: number;
  name: string;
  description: string | null;
}

export interface IBookingHotel {
  id: number;
  name: string;
  description: string | null;
}

export interface IBookingRoom {
  id: number;
  roomType: string;
  description: string | null;
}

export interface IBookingFlight {
  id: number;
  flightNumber: string;
  airline: string;
}

export interface IBookingPayment {
  id: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod:
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'MOBILE_MONEY'
    | 'BANK_TRANSFER';
}

export interface IBookingBase {
  id: number;
  userId: number;
  user: IBookingUser;
  payment: IBookingPayment | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  bookingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITourBooking extends IBookingBase {
  type: 'TOUR';
  tour: IBookingTour;
  hotel?: null;
  room?: null;
  flight?: null;
}

export interface IHotelBooking extends IBookingBase {
  type: 'HOTEL';
  hotel: IBookingHotel;
  room: IBookingRoom | null;
  tour?: null;
  flight?: null;
}

export interface IFlightBooking extends IBookingBase {
  type: 'FLIGHT';
  flight: IBookingFlight;
  tour?: null;
  hotel?: null;
  room?: null;
}

export type IBooking = ITourBooking | IHotelBooking | IFlightBooking;
