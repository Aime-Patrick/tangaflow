import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDevice } from "../api";
import { deviceKeys } from "../queryKeys";

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}
