import { Suspense } from "react";
import { LeaderboardClient } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default function LeaderboardPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          <span className="text-gradient">Leaderboard</span>
        </h1>
        <p className="mt-3 max-w-2xl text-silver-300">
          The top check-in streakers across LitVM. Updated every 30 seconds.
        </p>
      </div>
      <Suspense fallback={<div className="mt-10 text-silver-400">Loading…</div>}>
        <LeaderboardClient />
      </Suspense>
    </section>
  );
}
