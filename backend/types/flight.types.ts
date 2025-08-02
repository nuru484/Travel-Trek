export interface IFlightInput {
  flightNumber: string;
  airline: string;
  departure: string | Date;
  arrival: string | Date;
  originId: number;
  destinationId: number;
  price: number;
  flightClass: string;
  duration: number;
  stops?: number;
  flightPhoto?: string | Express.Multer.File;
  seatsAvailable: number;
}

export interface IFlightResponse {
  id: number;
  flightNumber: string;
  airline: string;
  departure: Date;
  arrival: Date;
  originId: number;
  destinationId: number;
  price: number;
  flightClass: string;
  duration: number;
  stops: number;
  photo: string | null;
  seatsAvailable: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlightsPaginatedResponse {
  message: string;
  data: IFlightResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
