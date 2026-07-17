export interface Campaign {
  _id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  checkoutUrl: string;
  pptxUrl: string;
  barcodeType: "qr" | "zerocode";
  organizationId: string;
  createdBy: string | { _id: string; name: string; email: string };
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
  barcodeType?: "qr" | "zerocode";
  pptxUrl?: string;
  totalSlides?: number;
  currentSlide?: number;
  isPlaying?: boolean;
}
