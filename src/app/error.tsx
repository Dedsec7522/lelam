"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-5">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-muted">A temporary problem stopped this page from loading. Your data is safe. Try again in a moment.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-faint">Ref {error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="size-4" aria-hidden /> Try again
          </Button>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
