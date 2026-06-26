"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/queryClient";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function Home() {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell />
      <Toaster richColors position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
