"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/content/blog";
import { cn } from "@/lib/cn";
import { fadeOnly, fadeUp, motionTokens, springs } from "@/lib/motion";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const ALL = "All";

/** Insights hub: featured newest post, tag filter, and a grid of the rest. Posts arrive newest first. */
export function BlogIndex({ posts }: { posts: Post[] }) {
  const reduce = useSafeReducedMotion();
  const [tag, setTag] = useState<string>(ALL);
  const tags = useMemo(() => [ALL, ...Array.from(new Set(posts.map((p) => p.tag)))], [posts]);
  const filtered = tag === ALL ? posts : posts.filter((p) => p.tag === tag);
  const [featured, ...rest] = filtered;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const active = t === tag;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setTag(t)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                  active ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink-2 hover:border-ink/30 hover:text-ink",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "article" : "articles"}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tag}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={reduce ? fadeOnly : fadeUp}
          className="mt-10"
        >
          {featured && (
            <article>
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-md md:grid-cols-[1.15fr_1fr]"
              >
                <PostCover post={featured} large className="aspect-[16/10] md:aspect-auto md:min-h-80" />
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <p className="eyebrow !text-copper">Featured</p>
                  <h2 className="mt-3 text-[1.6rem] font-semibold leading-tight text-ink transition-colors group-hover:text-brand sm:text-[2rem]">
                    {featured.title}
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted">{featured.excerpt}</p>
                  <PostMeta post={featured} className="mt-6" />
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                    Read the guide
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </article>
          )}

          {rest.length > 0 && (
            <>
              <h2 className="mt-16 text-xl font-semibold text-ink">Latest articles</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <motion.li
                    key={p.slug}
                    initial={reduce ? false : { opacity: 0, y: motionTokens.distance.sm }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduce ? undefined : { ...springs.gentle, delay: i * motionTokens.stagger.tight }}
                  >
                    <article className="h-full">
                      <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-3 transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-md">
                        <PostCover post={p} className="aspect-[16/10] rounded-2xl" />
                        <div className="flex flex-1 flex-col p-3 pt-5">
                          <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{p.title}</h3>
                          <p className="mt-2 line-clamp-3 text-[0.93rem] leading-relaxed text-muted">{p.excerpt}</p>
                          <PostMeta post={p} className="mt-auto pt-5" />
                        </div>
                      </Link>
                    </article>
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
