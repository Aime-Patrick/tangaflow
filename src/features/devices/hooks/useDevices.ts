import { useQuery } from "@tanstack/react-query";
import { getDevices } from "../api";
import { deviceKeys } from "../queryKeys";

export function useDevices() {
  return useQuery({
    queryKey: deviceKeys.list(),
    queryFn: getDevices,
    staleTime: 1000 * 60 * 2,
  });
}
