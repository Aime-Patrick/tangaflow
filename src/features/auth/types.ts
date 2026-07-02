export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  orgName: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization | null;
  role?: string | null;
  pendingInvitations?: PendingInvitation[];
}

export interface PendingInvitation {
  _id: string;
  email: string;
  role: string;
  token: string;
  organizationName: string;
  organizationSlug: string;
  expiresAt: string;
}
