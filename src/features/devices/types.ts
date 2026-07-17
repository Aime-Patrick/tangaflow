export interface Device {
  _id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface CreateDeviceInput {
  name: string;
}
