import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign } from "../api";
import { campaignKeys } from "../queryKeys";
import { toast } from "sonner";

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data._id) });
      toast.success("Campaign created successfully");
    },
    onError: () => {
      toast.error("Failed to create campaign");
    },
  });
}
