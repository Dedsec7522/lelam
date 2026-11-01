import { Clock } from "lucide-react";
import type { Post } from "@/content/blog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PostMeta({ post, className, showAuthor = false }: { post: Post; className?: string; showAuthor?: boolean }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-muted", className)}>
      <span className="font-medium text-brand">{post.tag}</span>
      {showAuthor && (
        <>
          <span aria-hidden>·</span>
          <span>By {post.author}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {post.minutes} min read
      </span>
    </p>
  );
}
