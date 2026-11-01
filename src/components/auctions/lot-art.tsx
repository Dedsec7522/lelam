import { cn } from "@/lib/cn";
import type { CategoryId } from "@/lib/types";
import { CATEGORY_ICONS } from "@/components/layout/nav-config";

/**
 * Generated, category-coded artwork used when a lot has no photos (most scrap lots don't).
 * Each category has its own hue (--cat-*). Light mode gets a soft tint on white; dark mode a
 * richer one (--art-a / --art-b). Deterministic per auction id, so a lot always looks the same.
 */
export function LotArt({ category, seed, className, showIcon = true }: { category: CategoryId; seed: string; className?: string; showIcon?: boolean }) {
  const Icon = CATEGORY_ICONS[category];
  const n = Number(seed) || 1;
  const hue = `var(--cat-${category})`;
  const rot = 18 + (n % 5) * 8;
  const bars = Array.from({ length: 9 }, (_, i) => 22 + ((n * (i + 3)) % 52));

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      aria-hidden
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${hue} var(--art-a), var(--surface)) 0%, color-mix(in srgb, ${hue} var(--art-b), var(--surface)) 100%)`,
      }}
    >
      <svg
        className="absolute inset-0 size-full transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:translate-x-2"
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
        style={{ color: hue, opacity: "var(--art-line)" }}
      >
        <g transform={`rotate(${rot} 100 60)`}>
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={-60 + i * 30} y1={-60} x2={-60 + i * 30} y2={200} stroke="currentColor" strokeWidth="0.5" />
          ))}
        </g>
      </svg>
      <div className="absolute bottom-0 left-5 right-24 flex items-end gap-1" style={{ height: "62%" }}>
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-full rounded-t-[3px] transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-y-110"
            style={{ height: `${h}%`, background: hue, opacity: 0.16 + (i % 3) * 0.05, transformOrigin: "bottom" }}
          />
        ))}
      </div>
      {showIcon && (
      <div
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl shadow-sm transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-rotate-6 group-hover:scale-105"
        // --paper is near-white in light mode and near-black in dark, so the glyph always contrasts with the hue.
        style={{ background: hue, color: "var(--paper)" }}
      >
        <Icon className="size-[18px]" />
      </div>
      )}
    </div>
  );
}
