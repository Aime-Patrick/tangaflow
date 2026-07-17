import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDevice } from "../api";
import { deviceKeys } from "../queryKeys";

export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}
