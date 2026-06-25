import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { inter, sora, jetbrainsMono } from "./fonts";

export const metadata: Metadata = {
  title: "LitPass - Soulbound passport for LitVM",
  description:
    "Mint your soulbound passport on Litecoin's first EVM L2. Daily check-ins, on-chain streaks, achievement badges, and cross-dApp stamps.",
  keywords: ["LitVM", "Litecoin", "LitPass", "soulbound", "passport", "streak", "reputation", "zkLTC", "EVM L2"],
  metadataBase: new URL("https://litpass.vercel.app"),
  openGraph: {
    title: "LitPass - Soulbound passport for LitVM",
    description: "The identity layer for Litecoin's first EVM L2.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="aurora min-h-screen bg-ink-950 text-silver-100 antialiased">
        <Providers>
          <div className="relative">
            <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
            <Header />
            <main className="relative">{children}</main>
            <Footer />
          </div>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(11, 16, 32, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                color: "#e6eaf3",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
