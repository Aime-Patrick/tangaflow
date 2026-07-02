import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMembers, addMember, removeMember, updateMemberRole } from "../api/members";
import type { AddMemberInput } from "../api/members";
import type { OrgRole } from "@/models/Organization";
import { orgKeys } from "../queryKeys";

const ORG_STALE_TIME = 1000 * 60 * 5;

export function useMembers(slug: string) {
  return useQuery({
    queryKey: orgKeys.members(slug),
    queryFn: () => fetchMembers(slug),
    staleTime: ORG_STALE_TIME,
    enabled: Boolean(slug),
  });
}

export function useAddMember(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddMemberInput) => addMember(slug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(slug) });
    },
  });
}

export function useRemoveMember(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMember(slug, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(slug) });
    },
  });
}

export function useUpdateMemberRole(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      updateMemberRole(slug, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(slug) });
    },
  });
}
