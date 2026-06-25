"use client";

import { motion } from "framer-motion";

export function LitPassLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ rotate: -10, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id="lp-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#lp-grad)" />
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#05070d" fillOpacity="0.55" />
      <path
        d="M20 9 L28 14 L28 22 C28 26 24.5 29.5 20 31 C15.5 29.5 12 26 12 22 L12 14 Z"
        fill="none"
        stroke="url(#lp-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="19" r="3" fill="url(#lp-grad)" />
      <path
        d="M14 25 L26 25"
        stroke="url(#lp-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
    </motion.svg>
  );
}
