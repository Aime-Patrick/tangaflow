export interface Campaign {
  _id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  name: string;
  targetAmount: number;
  currency?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  targetAmount?: number;
  currency?: string;
}
