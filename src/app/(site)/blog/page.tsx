import type { Metadata } from "next";
import { postsByDate } from "@/content/blog";
import { BlogIndex } from "@/components/content/blog-index";
import { Reveal } from "@/components/motion/reveal";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Insights: guides to Indian e-auctions, costs and compliance",
  description: "Practical guides on MSTC, bank and GeM auctions: how bidding works, the real cost of winning, vehicles, EMD exemptions and building a sourcing pipeline.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = postsByDate();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Lelam Insights",
          url: absoluteUrl("/blog"),
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: absoluteUrl(`/blog/${p.slug}`),
            datePublished: p.date,
          })),
        }}
      />
      <section className="relative overflow-hidden pb-6 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="Knowledge hub"
              title={
                <>
                  Read the catalog <Accent>before</Accent> you bid
                </>
              }
              description="Field guides to Indian public auctions: how the portals work, what a lot really costs, and the paperwork that trips first-time buyers."
            />
          </Reveal>
        </div>
      </section>
      <section className="container-page pb-24 pt-8">
        <BlogIndex posts={posts} />
      </section>
    </>
  );
}
