export interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export async function getInvitations(slug: string): Promise<Invitation[]> {
  const res = await fetch(`/api/orgs/${slug}/invitations`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch invitations");
  }
  const data = await res.json();
  return data.invitations as Invitation[];
}
