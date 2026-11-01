"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRINT_CSS = `
#print-root { display: none; }
@media print {
  @page { size: A4; margin: 14mm; }
  body > *:not(#print-root) { display: none !important; }
  #print-root { display: block !important; }
  html, body { background: white !important; }
}
`;

/**
 * Shows the document inline on screen and mirrors it into a body-level node used only for
 * printing, so site chrome never leaks into the PDF regardless of layout structure.
 */
export function PrintSheet({ children, backHref, autoPrint }: { children: ReactNode; backHref: string; autoPrint?: boolean }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "print-root";
    document.body.appendChild(el);
    // Publish the node on the next frame (keeps the effect free of synchronous setState).
    const raf = window.requestAnimationFrame(() => setRoot(el));
    // Paper is white: switch to light tokens while printing, then restore the viewer's theme.
    const html = document.documentElement;
    let previous: string | undefined;
    const before = () => {
      previous = html.dataset.theme;
      html.dataset.theme = "light";
    };
    const after = () => {
      if (previous === undefined) delete html.dataset.theme;
      else html.dataset.theme = previous;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      el.remove();
    };
  }, []);

  useEffect(() => {
    if (!root || !autoPrint) return;
    const t = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(t);
  }, [root, autoPrint]);

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Back to editor
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Print / Save as PDF
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted">Choose “Save as PDF” as the destination in the print dialog to export.</p>
      {children}
      {root && createPortal(children, root)}
    </>
  );
}
