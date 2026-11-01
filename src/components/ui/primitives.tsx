import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "copper" | "positive" | "warning" | "danger" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-2 border-line",
  brand: "bg-brand-soft text-brand-ink border-transparent",
  copper: "bg-copper-soft text-copper border-transparent",
  positive: "bg-positive-soft text-positive border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  ink: "bg-ink text-paper border-transparent",
};

export function Badge({ tone = "neutral", className, children, ...rest }: ComponentPropsWithoutRef<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium leading-5",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-sm", className)} {...rest} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Tag className="text-[2rem] font-semibold leading-[1.08] text-ink sm:text-[2.5rem]">{title}</Tag>
        {description && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Editorial italic accent used inside headings. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-serif font-normal italic tracking-normal text-brand">{children}</em>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface-2 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-xl bg-paper-2 text-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-muted">{children}</kbd>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "positive" | "copper" }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="eyebrow text-[0.66rem]">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-mono text-xl font-medium tabular-nums text-ink",
          tone === "positive" && "text-positive",
          tone === "copper" && "text-copper",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
