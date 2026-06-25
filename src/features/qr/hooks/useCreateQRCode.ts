import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQRCode } from "../api/createQRCode";
import { qrKeys } from "../queryKeys";
import { toast } from "sonner";

export function useCreateQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
      toast.success("QR code created successfully");
    },
    onError: () => {
      toast.error("Failed to create QR code");
    },
  });
}
