"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { CloseButton } from "@/components/ui/dialog";
import { fadeOnly, fadeUp } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/** Shown after `requireRole` bounced the user to `/dashboard?denied=1`. */
export function DeniedNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useSafeReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const show = params.get("denied") === "1" && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="alert"
          variants={reduce ? fadeOnly : fadeUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">That area is not available on your account</p>
            <p className="mt-0.5 text-sm text-ink-2">
              The seller, logistics and admin portals are limited to approved accounts. Contact support if you need access.
            </p>
          </div>
          <CloseButton
            label="Dismiss notice"
            onClick={() => {
              setDismissed(true);
              router.replace(pathname, { scroll: false });
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
