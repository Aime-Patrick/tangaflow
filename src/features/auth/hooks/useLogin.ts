import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { login } from "../api/auth";
import { authKeys } from "../queryKeys";
import type { LoginInput } from "../types";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { refresh } = useAuth();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      await refresh();

      if (inviteToken) {
        try {
          const res = await fetch("/api/invitations/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: inviteToken }),
          });
          if (res.ok) {
            router.push("/dashboard");
            return;
          }
        } catch {}
      }

      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Sign in failed");
    },
  });
}
