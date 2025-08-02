export interface ITourInclusionInput {
  tourId: number;
  description: string;
}

export interface ITourInclusionResponse {
  id: number;
  tourId: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
