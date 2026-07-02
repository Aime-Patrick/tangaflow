import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/auth";
import { authKeys } from "../queryKeys";

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
