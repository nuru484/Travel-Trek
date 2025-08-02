// types/itinerary.types.ts
export interface IItineraryInput {
  tourId: number;
  day: number;
  title: string;
  activities?: string | null;
  description?: string | null;
}

export interface IItineraryResponse {
  id: number;
  tourId: number;
  day: number;
  title: string;
  activities: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
