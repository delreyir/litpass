"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

export function Countdown({ until }: { until?: bigint | number }) {
  const target = until ? Number(until) : 0;
  const [remaining, setRemaining] = useState(Math.max(target - Math.floor(Date.now() / 1000), 0));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(target - Math.floor(Date.now() / 1000), 0));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <span className="font-mono tabular-nums">{formatCountdown(remaining)}</span>;
}
