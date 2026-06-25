import { useMutation } from "@tanstack/react-query";
import { createCheckout } from "../api";
import { toast } from "sonner";

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: () => {
      toast.error("Failed to create checkout. Please try again.");
    },
  });
}
