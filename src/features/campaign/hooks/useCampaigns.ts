import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "../api";
import { campaignKeys } from "../queryKeys";

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.lists(),
    queryFn: getCampaigns,
    staleTime: 1000 * 30,
  });
}
