export const campaignKeys = {
  all: ["campaigns"] as const,
  detail: (id: string) => [...campaignKeys.all, id] as const,
};
