// src/types/flight.types.ts
export enum FlightClass {
  ECONOMY = "Economy",
  BUSINESS = "Business",
  FIRST_CLASS = "First Class",
  PREMIUM_ECONOMY = "Premium Economy",
}

export interface IFlight {
  id: number;
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  originId: number;
  destinationId: number;
  price: number;
  flightClass: FlightClass;
  duration: number;
  stops: number;
  photo: string | null;
  seatsAvailable: number;
  createdAt: string;
  updatedAt: string;
}

export interface IFlightResponse {
  message: string;
  data: IFlight;
}

export interface IFlightsPaginatedResponse {
  message: string;
  data: IFlight[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IFlightInput {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  originId: number;
  destinationId: number;
  price: number;
  flightClass: FlightClass;
  duration: number;
  stops?: number;
  seatsAvailable: number;
  flightPhoto?: string | File;
}

export interface IUpdateFlightInput extends Partial<IFlightInput> {
  id: string;
}
