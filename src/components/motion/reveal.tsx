"use client";

import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { fadeOnly, fadeUp, motionTokens, staggerContainer, wordReveal } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  amount?: number;
};

/** Scroll-triggered fade-and-rise. Fires once; opacity-only under reduced motion. */
export function Reveal({ children, className, delay = 0, as = "div", amount = 0.25 }: RevealProps) {
  const reduce = useSafeReducedMotion();
  const Tag = motion[as];
  const variants: Variants = reduce ? fadeOnly : fadeUp;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

/** Parent that staggers direct `StaggerItem` children as the group enters the viewport. */
export function Stagger({
  children,
  className,
  each = motionTokens.stagger.normal,
  delay = 0,
  amount = 0.15,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  each?: number;
  delay?: number;
  amount?: number;
  as?: "div" | "ul" | "ol";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={staggerContainer(each, delay)}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  ...rest
}: { children: ReactNode; className?: string; as?: "div" | "li" | "article" } & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">) {
  const reduce = useSafeReducedMotion();
  const Tag = motion[as];
  return (
    <Tag className={className} variants={reduce ? fadeOnly : fadeUp} {...(rest as object)}>
      {children}
    </Tag>
  );
}

/**
 * Masked word-by-word headline reveal. Words are wrapped for animation, while the
 * full string remains a single accessible label.
 */
export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  as = "h1",
  accentWords = [],
  accentClassName,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  as?: "h1" | "h2" | "p";
  accentWords?: string[];
  accentClassName?: string;
}) {
  const reduce = useSafeReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      animate="visible"
      variants={staggerContainer(motionTokens.stagger.normal, delay)}
    >
      {words.map((word, i) => {
        const clean = word.replace(/[^\p{L}\p{N}-]/gu, "");
        const isAccent = accentWords.includes(clean);
        return (
          <span key={`${word}-${i}`} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${wordClassName ?? ""} ${isAccent ? (accentClassName ?? "") : ""}`}
              variants={reduce ? fadeOnly : wordReveal}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

/** Helper for mapping arbitrary children into StaggerItems. */
export function StaggerChildren({ children, className, itemClassName }: { children: ReactNode; className?: string; itemClassName?: string }) {
  return (
    <Stagger className={className}>
      {Children.map(children, (child) => (
        <StaggerItem className={itemClassName}>{child}</StaggerItem>
      ))}
    </Stagger>
  );
}
