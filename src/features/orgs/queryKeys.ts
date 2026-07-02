export const orgKeys = {
  all: ["org"] as const,
  members: (slug: string) => [...orgKeys.all, slug, "members"] as const,
  invitations: (slug: string) => [...orgKeys.all, slug, "invitations"] as const,
};
