"use client";

import { http } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { litvmTestnet } from "./chain";

// Public WalletConnect projectId for demo; replace with your own in production.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "litpass-demo-projectid";

export const wagmiConfig = getDefaultConfig({
  appName: "LitPass",
  projectId,
  chains: [litvmTestnet],
  transports: {
    [litvmTestnet.id]: http(litvmTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
