"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NativeGasProvider } from "@/lib/native-gas";
import { NativeGasNotice } from "@/components/native-gas-notice";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <QueryClientProvider client={queryClient}>
        <NativeGasProvider>
          {children}
          <NativeGasNotice />
        </NativeGasProvider>
      </QueryClientProvider>
    </ThirdwebProvider>
  );
}
