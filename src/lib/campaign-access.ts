import type { OrgRole } from "@/models/Organization";
import { hasPermission } from "@/lib/permissions";

export interface CampaignOwnership {
  organizationId: { toString(): string };
  createdBy: { toString(): string };
}

export function canViewCampaign(
  role: OrgRole,
  userId: string,
  orgId: string,
  campaign: CampaignOwnership
): boolean {
  if (campaign.organizationId.toString() !== orgId) {
    return false;
  }

  if (hasPermission(role, "manage_campaigns")) {
    return true;
  }

  return campaign.createdBy.toString() === userId;
}

export function canManageCampaign(
  role: OrgRole,
  userId: string,
  orgId: string,
  campaign: CampaignOwnership
): boolean {
  if (!canViewCampaign(role, userId, orgId, campaign)) {
    return false;
  }

  if (hasPermission(role, "manage_campaigns")) {
    return true;
  }

  return campaign.createdBy.toString() === userId;
}

export function getCampaignListFilter(
  orgId: string,
  userId: string,
  role: OrgRole
): Record<string, unknown> {
  const filter: Record<string, unknown> = { organizationId: orgId };

  if (!hasPermission(role, "manage_campaigns")) {
    filter.createdBy = userId;
  }

  return filter;
}
