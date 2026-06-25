"use client";

import { use } from "react";
import { useCampaign } from "@/features/campaign";
import { DonationForm } from "@/features/donation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DonatePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const { data: campaign, isLoading, error } = useCampaign({ id: campaignId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Campaign Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            This campaign doesn&apos;t exist or has ended.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-text-primary">
            TangaFlow
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <DonationForm
          campaignId={campaignId}
          currency={campaign.currency}
        />
      </main>
    </div>
  );
}
