import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "ink" | "copper" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-quint)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand shadow-sm hover:bg-brand-hover hover:shadow-md",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink/30 hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  ink: "bg-ink text-paper shadow-sm hover:bg-ink-2",
  copper: "bg-copper text-on-copper shadow-sm hover:brightness-110",
  danger: "bg-danger text-white hover:brightness-110",
  link: "px-0 text-brand underline-offset-4 hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-[10px] px-3.5 text-sm",
  md: "h-11 rounded-xl px-5 text-[0.95rem]",
  lg: "h-13 rounded-2xl px-7 text-base",
};

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, iconRight, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], variant !== "link" && sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
      {iconRight && !loading && (
        <span aria-hidden className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  iconRight?: ReactNode;
}

export function ButtonLink({ variant = "primary", size = "md", iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], variant !== "link" && sizes[size], className)} {...rest}>
      {children}
      {iconRight && (
        <span aria-hidden className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
          {iconRight}
        </span>
      )}
    </Link>
  );
}
