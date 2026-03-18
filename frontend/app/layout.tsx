import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropVera - Decentralized Real Estate Investment",
  description:
    "Invest in real estate properties through decentralized blockchain technology on Polkadot Hub",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PropVera - Decentralized Real Estate Investment",
    description: "Invest in real estate properties through blockchain",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
