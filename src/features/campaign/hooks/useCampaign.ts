import { useQuery } from "@tanstack/react-query";
import { getCampaign } from "../api";
import { campaignKeys } from "../queryKeys";

interface UseCampaignOptions {
  id: string | null;
  refetchInterval?: number;
}

export function useCampaign({ id, refetchInterval = 3000 }: UseCampaignOptions) {
  return useQuery({
    queryKey: campaignKeys.detail(id ?? ""),
    queryFn: () => getCampaign(id!),
    enabled: !!id,
    refetchInterval: id ? refetchInterval : false,
    staleTime: 2000,
  });
}
