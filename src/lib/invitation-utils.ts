import type { OrgRole } from "@/models/Organization";

export interface PendingInvitation {
  _id: string;
  email: string;
  role: OrgRole;
  token: string;
  organizationName: string;
  organizationSlug: string;
  expiresAt: string;
}

export interface InvitationDetails {
  email: string;
  role: OrgRole;
  organizationName: string;
  organizationSlug: string;
  inviterName: string;
  expiresAt: string;
  accountExists: boolean;
}

export function formatInvitationRole(role: OrgRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function invitationEmailMismatchMessage(invitedEmail: string): string {
  return `This invitation was sent to ${invitedEmail}. Please sign in with that email address or ask the administrator to send a new invitation.`;
}
