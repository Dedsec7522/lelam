import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPost, POSTS, postsByDate, type Post } from "@/content/blog";
import { PostBody } from "@/components/content/post-body";
import { PostCover } from "@/components/content/post-cover";
import { PostMeta } from "@/components/content/post-meta";
import { ReadingProgress } from "@/components/content/reading-progress";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  const path = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: path },
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: path,
      publishedTime: post.date,
      authors: [post.author],
      tags: [post.tag],
    },
  };
}

/** Same-tag posts first, then the newest others. */
function related(post: Post, count = 2): Post[] {
  const others = postsByDate().filter((p) => p.slug !== post.slug);
  return [...others.filter((p) => p.tag === post.tag), ...others.filter((p) => p.tag !== post.tag)].slice(0, count);
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const more = related(post);

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          dateModified: post.date,
          author: { "@type": "Organization", name: `Lelam ${post.author}` },
          publisher: { "@type": "Organization", name: "Lelam", url: absoluteUrl("/") },
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
          articleSection: post.tag,
        }}
      />

      <article>
        <header className="relative overflow-hidden border-b border-line pb-12 pt-10 sm:pt-14">
          <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
          <div className="container-page max-w-4xl">
            <Link
              href="/blog"
              className="group -ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
              Back to insights
            </Link>
            <Reveal className="mt-6">
              <h1 className="text-[2rem] font-semibold leading-[1.1] text-ink sm:text-[2.8rem]">{post.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted">{post.excerpt}</p>
              <PostMeta post={post} showAuthor className="mt-6 text-sm" />
            </Reveal>
            <Reveal delay={0.1} className="mt-10">
              <PostCover post={post} large className="aspect-[21/9] rounded-3xl" />
            </Reveal>
          </div>
        </header>

        <div className="container-page max-w-3xl py-14">
          <PostBody blocks={post.blocks} />
          <div className="mt-12 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <p className="font-semibold text-ink">Put this into practice</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              Search every listed lot and see its landed cost before you bid. Figures on Lelam are indicative; always confirm terms in the official catalog.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/auctions" iconRight={<ArrowRight className="size-4" />}>
                Browse auctions
              </ButtonLink>
              <ButtonLink href="/faq" variant="secondary">
                Help centre
              </ButtonLink>
            </div>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line bg-surface py-16">
          <div className="container-page max-w-5xl">
            <h2 id="related-title" className="text-2xl font-semibold text-ink">
              Keep reading
            </h2>
            <Stagger className="mt-8 grid gap-6 sm:grid-cols-2">
              {more.map((p) => (
                <StaggerItem key={p.slug} as="article">
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <PostCover post={p} className="aspect-[16/9] rounded-2xl" />
                    <PostMeta post={p} className="mt-4" />
                    <h3 className="mt-2 text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{p.title}</h3>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}
    </>
  );
}
