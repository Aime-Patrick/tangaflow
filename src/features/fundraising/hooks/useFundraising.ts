import { useQuery } from "@tanstack/react-query";
import { getFundraising } from "../api";
import { fundraisingKeys } from "../queryKeys";

interface UseFundraisingOptions {
  campaignId: string | null;
  refetchInterval?: number;
}

export function useFundraising({ campaignId, refetchInterval = 5000 }: UseFundraisingOptions) {
  return useQuery({
    queryKey: fundraisingKeys.detail(campaignId ?? ""),
    queryFn: () => getFundraising(campaignId!),
    enabled: !!campaignId,
    refetchInterval: campaignId ? refetchInterval : false,
    staleTime: 2000,
  });
}
