"use client";

import { Loader2 } from "lucide-react";
import { useCampaigns } from "@/features/campaign";
import { usePermission } from "@/hooks/use-permission";

function getCreatorName(
  createdBy: string | { _id: string; name: string; email: string }
): string {
  if (typeof createdBy === "string") return "Unknown";
  return createdBy.name || createdBy.email;
}

export function OrgCampaignsList() {
  const canManageCampaigns = usePermission("manage_campaigns");
  const { data: campaigns, isLoading } = useCampaigns();

  if (!canManageCampaigns) {
    return null;
  }

  return (
    <div className="rounded-none border border-border-subtle p-6">
      <h3 className="mb-1 text-sm font-medium text-text-primary">
        Organization campaigns
      </h3>
      <p className="mb-4 text-xs text-text-muted">
        All campaigns created by members in your workspace.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : !campaigns?.length ? (
        <p className="text-sm text-text-muted">No campaigns yet.</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="flex items-center justify-between border border-border-subtle p-3"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {campaign.name}
                </p>
                <p className="text-xs text-text-muted">
                  {getCreatorName(campaign.createdBy)} · {campaign.currency}{" "}
                  {campaign.raisedAmount.toLocaleString()} /{" "}
                  {campaign.targetAmount.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-text-primary hover:underline"
                onClick={() => {
                  localStorage.setItem("tangaflow-session-key", campaign._id);
                  window.location.reload();
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
