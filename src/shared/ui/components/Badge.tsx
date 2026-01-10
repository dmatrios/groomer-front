import clsx from "clsx";
import { ReactNode } from "react";

type Variant =
  | "scheduled"
  | "attended"
  | "cancelled"
  | "pending"
  | "partial"
  | "paid";

type BadgeProps = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  scheduled:
    "bg-[color:var(--brand-cyan)]/15 text-[color:var(--brand-cyan)] border-[color:var(--brand-cyan)]/30",
  attended:
    "bg-[color:var(--brand-green)]/15 text-[color:var(--brand-green)] border-[color:var(--brand-green)]/30",
  cancelled:
    "bg-[color:var(--brand-orange)]/15 text-[color:var(--brand-orange)] border-[color:var(--brand-orange)]/30",
  pending:
    "bg-[color:var(--brand-orange)]/15 text-[color:var(--brand-orange)] border-[color:var(--brand-orange)]/30",
  partial:
    "bg-[color:var(--brand-cyan)]/15 text-[color:var(--brand-cyan)] border-[color:var(--brand-cyan)]/30",
  paid:
    "bg-[color:var(--brand-green)]/15 text-[color:var(--brand-green)] border-[color:var(--brand-green)]/30",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        "tracking-[0.01em]",
        "transition-all duration-200 hover:brightness-110",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
