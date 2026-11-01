import { cn } from "@/lib/cn";
import type { Post } from "@/content/blog";

/**
 * Generated editorial cover so articles never depend on third-party stock imagery.
 * Tinted with the post's two hues on the surface colour: soft pastel in light mode,
 * richer in dark mode (--cover-a / --cover-b), with motif strokes and the tag in the lead hue.
 */
export function PostCover({ post, className, large = false }: { post: Post; className?: string; large?: boolean }) {
  const { from, to, motif } = post.cover;
  return (
    <div
      className={cn("relative overflow-hidden border border-line", className)}
      style={{
        color: from,
        background: `linear-gradient(140deg, color-mix(in srgb, ${from} var(--cover-a), var(--surface)), color-mix(in srgb, ${to} var(--cover-b), var(--surface)))`,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 250"
        className="absolute inset-0 size-full transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-105"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: "var(--cover-line)" }}
      >
        {motif === "grid" &&
          Array.from({ length: 12 }, (_, i) => (
            <g key={i} stroke="currentColor" strokeOpacity="0.5">
              <line x1={i * 36} y1="0" x2={i * 36} y2="250" />
              <line x1="0" y1={i * 24} x2="400" y2={i * 24} />
            </g>
          ))}
        {motif === "rings" &&
          Array.from({ length: 8 }, (_, i) => <circle key={i} cx="320" cy="60" r={30 + i * 34} fill="none" stroke="currentColor" strokeOpacity={0.8 - i * 0.08} />)}
        {motif === "bars" &&
          Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={30 + i * 36} y={250 - (40 + ((i * 47) % 150))} width="22" height={40 + ((i * 47) % 150)} rx="4" fill="currentColor" fillOpacity="0.45" />
          ))}
        {motif === "waves" &&
          Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M0 ${80 + i * 22} C 100 ${40 + i * 22}, 200 ${130 + i * 22}, 400 ${70 + i * 22}`} fill="none" stroke="currentColor" strokeOpacity="0.7" />
          ))}
      </svg>
      <span
        className={cn(
          "absolute bottom-4 left-5 rounded-full border border-line bg-surface/85 px-2.5 py-1 font-mono font-medium uppercase tracking-[0.14em] text-ink backdrop-blur",
          large ? "text-xs" : "text-[0.62rem]",
        )}
      >
        {post.tag}
      </span>
    </div>
  );
}
