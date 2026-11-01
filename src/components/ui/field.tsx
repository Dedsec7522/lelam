"use client";

import { forwardRef, useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionTokens } from "@/lib/motion";

const control =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 hover:border-ink/25 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/12 disabled:opacity-60";

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  id: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ label, error, hint, required, id, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-copper">
            *
          </span>
        )}
      </label>
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            role="alert"
            className="text-[0.8rem] font-medium text-danger"
            initial={{ opacity: 0, y: -motionTokens.distance.xs }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" id={`${id}-hint`} className="text-[0.8rem] text-muted">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type InputProps = ComponentPropsWithoutRef<"input"> & { label: string; error?: string; hint?: ReactNode; leading?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leading, className, id: idProp, required, type, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} id={id} className={className}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{leading}</span>}
        <input
          // Extensions (password managers, temp-mail) inject attributes before hydration.
          suppressHydrationWarning
          ref={ref}
          id={id}
          type={isPassword && show ? "text" : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(control, "h-11", leading && "pl-10", isPassword && "pr-11")}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </FieldShell>
  );
});

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & { label: string; error?: string; hint?: ReactNode };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id: idProp, required, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} id={id} className={className}>
      <textarea
        suppressHydrationWarning
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, "min-h-32 resize-y py-3 leading-relaxed")}
        {...rest}
      />
    </FieldShell>
  );
});

type SelectProps = ComponentPropsWithoutRef<"select"> & { label: string; error?: string; hint?: ReactNode };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id: idProp, required, children, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} id={id} className={className}>
      <select
        suppressHydrationWarning
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a93a3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export function Checkbox({
  label,
  className,
  id: idProp,
  description,
  ...rest
}: ComponentPropsWithoutRef<"input"> & { label: ReactNode; description?: string }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-[5px] border-line-strong accent-[var(--brand)]"
        {...rest}
      />
      <label htmlFor={id} className="text-sm leading-snug text-ink-2">
        {label}
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}
