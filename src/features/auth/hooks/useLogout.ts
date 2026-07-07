import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authKeys } from "../queryKeys";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logout: clearAuth } = useAuth();

  return useMutation({
    mutationFn: clearAuth,
    onSuccess: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("tangaflow-session-key");
      }
      queryClient.setQueryData(authKeys.session(), null);
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      router.push("/");
      router.refresh();
    },
  });
}
