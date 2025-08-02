export interface ITourExclusionInput {
  tourId: number;
  description: string;
}

export interface ITourExclusionResponse {
  id: number;
  tourId: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
