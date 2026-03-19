"use client";

import dynamic from "next/dynamic";

// Dynamically import ConnectButton to prevent SSR issues
const DynamicConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((mod) => ({ default: mod.ConnectButton })),
  {
    ssr: false,
    loading: () => <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />,
  }
);

export function ConnectButtonClient() {
  return <DynamicConnectButton />;
}
