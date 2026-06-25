import { LitPassLogo } from "./LitPassLogo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-white/5 bg-ink-950/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <LitPassLogo className="h-6 w-6" />
          <span className="font-display text-base font-semibold">
            Lit<span className="text-accent">Pass</span>
          </span>
          <span className="ml-3 text-xs text-silver-500">
            Identity for Litecoin&apos;s first EVM L2
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-silver-400">
          <span className="font-mono">Chain ID 4441</span>
          <a
            href="https://liteforge.explorer.caldera.xyz"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            Explorer
          </a>
          <a
            href="https://docs.litvm.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            LitVM docs
          </a>
          <a
            href="https://testnet.litvm.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            Faucet
          </a>
        </div>
      </div>
    </footer>
  );
}
