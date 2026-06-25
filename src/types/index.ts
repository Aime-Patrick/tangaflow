// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Presentation types
export type Visibility = "PUBLIC" | "PRIVATE";

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  category?: string;
  visibility: Visibility;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  campaignId?: string;
}

export interface PresentationFilters {
  search?: string;
  category?: string;
  visibility?: Visibility;
}

export interface CreatePresentationInput {
  title: string;
  description?: string;
  category?: string;
  visibility?: Visibility;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  thumbnailUrl?: string;
  campaignId?: string;
}

export interface UpdatePresentationInput {
  title?: string;
  description?: string;
  category?: string;
  visibility?: Visibility;
  thumbnailUrl?: string;
  campaignId?: string;
}

// QR Code types
export type QRSize = "SMALL" | "MEDIUM" | "LARGE";

export interface QRCode {
  id: string;
  content: string;
  size: QRSize;
  format: string;
  imageUrl?: string;
  label?: string;
  createdAt: string;
  campaignId?: string;
}

export interface CreateQRCodeInput {
  content: string;
  size?: QRSize;
  format?: string;
  label?: string;
  campaignId?: string;
}

// Campaign types
export type CampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  targetAmount?: number;
  currency?: string;
  status?: CampaignStatus;
}

// Donation types
export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  createdAt: string;
  campaignId: string;
}

export interface CreateDonationInput {
  amount: number;
  currency?: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  campaignId: string;
}

// Dashboard types
export interface DashboardStats {
  totalRaised: number;
  targetAmount: number;
  donationCount: number;
  presentationCount: number;
  qrCodeCount: number;
  recentDonations: Donation[];
}
