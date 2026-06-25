"use client";

import { useEffect, useState } from "react";
import { isAddress } from "viem";

const KEY = "litpass.referrer";

/**
 * Reads ?ref= from the URL on the client and persists it in localStorage so it
 * survives page navigation (e.g. /p/X?ref=Y → /passport). Uses window directly
 * to avoid requiring a <Suspense> boundary for useSearchParams in Next 15.
 */
export function useReferrer() {
  const [referrer, setReferrer] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref && isAddress(ref)) {
        window.localStorage.setItem(KEY, ref);
        setReferrer(ref as `0x${string}`);
        return;
      }
      const stored = window.localStorage.getItem(KEY);
      if (stored && isAddress(stored)) setReferrer(stored as `0x${string}`);
    } catch {
      /* ignore */
    }
  }, []);

  const clear = () => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setReferrer(null);
  };

  return { referrer, clear };
}
