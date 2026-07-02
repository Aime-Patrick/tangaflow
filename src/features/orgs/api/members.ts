import type { OrgRole } from "@/models/Organization";

export interface Member {
  userId: string;
  email: string;
  name: string;
  role: OrgRole;
  joinedAt: string;
}

export interface AddMemberInput {
  email: string;
  role?: OrgRole;
}

export async function fetchMembers(slug: string): Promise<Member[]> {
  const res = await fetch(`/api/orgs/${slug}/members`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch members");
  }
  return res.json();
}

export async function addMember(
  slug: string,
  input: AddMemberInput
): Promise<{ member: Member }> {
  const res = await fetch(`/api/orgs/${slug}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to add member");
  }
  return res.json();
}

export async function removeMember(
  slug: string,
  userId: string
): Promise<void> {
  const res = await fetch(`/api/orgs/${slug}/members?userId=${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to remove member");
  }
}

export async function updateMemberRole(
  slug: string,
  userId: string,
  role: OrgRole
): Promise<void> {
  const res = await fetch(`/api/orgs/${slug}/members/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update role");
  }
}
