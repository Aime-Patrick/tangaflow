import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logout } from "../api/auth";
import { authKeys } from "../queryKeys";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.session(), null);
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      router.push("/");
      router.refresh();
    },
  });
}
