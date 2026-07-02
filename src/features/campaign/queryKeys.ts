export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  detail: (id: string) => [...campaignKeys.all, id] as const,
};
