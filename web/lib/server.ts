import { createPublicClient, http } from "viem";
import { litvmTestnet } from "./chain";

/**
 * Read-only viem client used by Server Components, API routes, and OG image
 * generation. Configured for LitVM LiteForge testnet.
 */
export const publicClient = createPublicClient({
  chain: litvmTestnet,
  transport: http(litvmTestnet.rpcUrls.default.http[0], {
    batch: true,
    retryCount: 2,
  }),
});
