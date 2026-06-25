import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCampaign } from "../api";
import { campaignKeys } from "../queryKeys";
import { toast } from "sonner";

interface UseUpdateCampaignOptions {
  campaignId: string;
}

export function useUpdateCampaign({ campaignId }: UseUpdateCampaignOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updateCampaign>[1]) =>
      updateCampaign(campaignId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      toast.success("Campaign updated successfully");
    },
    onError: () => {
      toast.error("Failed to update campaign");
    },
  });
}
