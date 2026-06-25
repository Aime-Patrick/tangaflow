import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteQRCode } from "../api/deleteQRCode";
import { qrKeys } from "../queryKeys";
import { toast } from "sonner";

export function useDeleteQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
      toast.success("QR code deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete QR code");
    },
  });
}
