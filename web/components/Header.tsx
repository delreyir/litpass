"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LitPassLogo } from "./LitPassLogo";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

const baseNav = [
  { href: "/",            label: "Home" },
  { href: "/passport",    label: "Passport" },
  { href: "/badges",      label: "Badges" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  const nav = isConnected && address
    ? [...baseNav, { href: `/p/${address}`, label: "Profile" }]
    : baseNav;

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <LitPassLogo className="h-7 w-7 transition-transform group-hover:rotate-6" />
          <span className="font-display text-lg font-bold tracking-tight">
            Lit<span className="text-accent">Pass</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href.startsWith("/p/") && pathname.startsWith("/p/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-silver-300 hover:text-white"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-lg bg-white/5 ring-1 ring-white/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </motion.header>
  );
}
