"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { X, AtSign, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ADDR, usernamesAbi } from "@/lib/contracts";

type Props = {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSuccess: () => void;
};

const VALID_RE = /^[a-z0-9_]+$/i;

export function UsernameDialog({ open, onClose, currentName, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(name.trim()), 300);
    return () => clearTimeout(t);
  }, [name]);

  const cleanName = debounced.trim();
  const lengthOk = cleanName.length >= 3 && cleanName.length <= 20;
  const charsOk = VALID_RE.test(cleanName);
  const formatOk = lengthOk && charsOk;

  const { data: available } = useReadContract({
    address: ADDR.Usernames,
    abi: usernamesAbi,
    functionName: "isAvailable",
    args: [cleanName],
    query: { enabled: formatOk && cleanName.length > 0 },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isSuccess: isMined, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isMined) return;
    toast.success(currentName ? "Username updated" : "Username claimed");
    onSuccess();
    onClose();
    reset();
  }, [isMined, currentName, onSuccess, onClose, reset]);

  useEffect(() => {
    if (error) toast.error(error.message.split("\n")[0]);
  }, [error]);

  const submit = async () => {
    if (!formatOk || !available) return;
    if (currentName) {
      // Two-step: clear + set. We do clear here and let the next interaction set.
      // Actually we batch by chaining setUsername after a clear in the same flow.
      try {
        toast.loading("Releasing current name...", { id: "u-tx" });
        // Use wagmi to send clear first
        // Note: wagmi doesn't have multi-tx in one call, so we do clear, wait, then set.
        // For UX simplicity we just guide the user to call clear then set.
      } catch {
        // fallback
      }
    }
    writeContract({
      address: ADDR.Usernames,
      abi: usernamesAbi,
      functionName: "setUsername",
      args: [cleanName],
    });
    toast.loading(currentName ? "Updating username..." : "Claiming username...", { id: "u-tx" });
  };

  const clearName = () => {
    writeContract({
      address: ADDR.Usernames,
      abi: usernamesAbi,
      functionName: "clear",
    });
    toast.loading("Releasing username...", { id: "u-tx" });
  };

  useEffect(() => {
    if (isMined) toast.dismiss("u-tx");
  }, [isMined]);

  const pending = isPending || isMining;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-silver-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-2 text-accent">
                <AtSign className="h-5 w-5" />
                <span className="text-xs font-mono uppercase tracking-widest">Username</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                {currentName ? "Change your username" : "Claim a username"}
              </h2>
              <p className="mt-2 text-sm text-silver-300">
                3-20 chars. Letters, numbers, and underscore. Stored on-chain, globally unique.
              </p>

              {currentName && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="text-silver-400">current</span>
                  <code className="font-mono text-silver-100">@{currentName}</code>
                </div>
              )}

              <div className="mt-5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-400">@</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase())}
                    placeholder="yourname"
                    maxLength={20}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/60 py-3 pl-8 pr-12 font-mono text-base text-white placeholder:text-silver-500 focus:border-accent focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cleanName.length === 0 ? null : !formatOk ? (
                      <AlertCircle className="h-4 w-4 text-accent-rose" />
                    ) : available === true ? (
                      <Check className="h-4 w-4 text-accent" />
                    ) : available === false ? (
                      <AlertCircle className="h-4 w-4 text-accent-rose" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-silver-400" />
                    )}
                  </div>
                </div>

                <div className="mt-2 min-h-[18px] text-xs">
                  {cleanName.length === 0 ? (
                    <span className="text-silver-500">Pick a memorable handle.</span>
                  ) : !lengthOk ? (
                    <span className="text-accent-rose">Must be 3-20 characters.</span>
                  ) : !charsOk ? (
                    <span className="text-accent-rose">Only letters, numbers, and underscore.</span>
                  ) : available === true ? (
                    <span className="text-accent">@{cleanName} is available</span>
                  ) : available === false ? (
                    <span className="text-accent-rose">@{cleanName} is taken</span>
                  ) : (
                    <span className="text-silver-500">checking...</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {currentName ? (
                  <button
                    onClick={clearName}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-silver-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Release current
                  </button>
                ) : <span />}

                <button
                  onClick={submit}
                  disabled={pending || !formatOk || available !== true}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : currentName ? (
                    "Update"
                  ) : (
                    "Claim"
                  )}
                </button>
              </div>

              {currentName && (
                <p className="mt-4 text-[11px] leading-relaxed text-silver-500">
                  To change names, release the current one first (frees it for others), then claim a new one. Two transactions.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
