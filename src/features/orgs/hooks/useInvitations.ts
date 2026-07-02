import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInvitations } from "../api/getInvitations";
import { orgKeys } from "../queryKeys";

const ORG_STALE_TIME = 1000 * 60 * 5;

export function useInvitations(slug: string) {
  return useQuery({
    queryKey: orgKeys.invitations(slug),
    queryFn: () => getInvitations(slug),
    staleTime: ORG_STALE_TIME,
    enabled: Boolean(slug),
  });
}

export function useInviteMember(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch(`/api/orgs/${slug}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations(slug) });
    },
  });
}

export function useRevokeInvitation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/orgs/${slug}/invitations/${token}/revoke`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations(slug) });
    },
  });
}
