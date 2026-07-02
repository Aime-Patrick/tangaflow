"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "/api/orgs";

export interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export function useInvitations(slug: string) {
  return useQuery({
    queryKey: ["invitations", slug],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/${slug}/invitations`);
      if (!res.ok) throw new Error("Failed to fetch invitations");
      const data = await res.json();
      return data.invitations as Invitation[];
    },
  });
}

export function useInviteMember(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch(`${BASE_URL}/${slug}/invitations`, {
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
      queryClient.invalidateQueries({ queryKey: ["invitations", slug] });
    },
  });
}

export function useRevokeInvitation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`${BASE_URL}/${slug}/invitations/${token}/revoke`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", slug] });
    },
  });
}
