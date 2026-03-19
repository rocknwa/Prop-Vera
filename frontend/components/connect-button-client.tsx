"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

export function ConnectButtonClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render after hydration to ensure WagmiProvider is ready
  if (!mounted) {
    return <div className="h-10 w-32 bg-muted rounded-lg" />;
  }

  return <ConnectButton />;
}
