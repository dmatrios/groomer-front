import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "primaryOutline"
  | "secondaryOutline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: LucideIcon;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  icon: Icon,
  children,
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        // base
        "inline-flex items-center justify-center gap-2",
        "rounded-xl px-4 py-2 text-sm font-semibold",
        "border",
        "transition-all duration-200",
        "hover:shadow-md hover:-translate-y-[1px]",
        "active:translate-y-0 active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
        {
          // PRIMARY (evitar negro, usar token primary)
          "bg-[color:var(--primary)] border-[color:var(--primary)] text-white hover:brightness-110 focus-visible:ring-[color:var(--brand-cyan)]":
            variant === "primary",

          // SECONDARY
          "bg-[color:var(--secondary)] border-[color:var(--secondary)] text-white hover:brightness-110 focus-visible:ring-[color:var(--brand-cyan)]":
            variant === "secondary",

          // DANGER
          "bg-[color:var(--danger)] border-[color:var(--danger)] text-white hover:brightness-110 focus-visible:ring-[color:var(--brand-orange)]":
            variant === "danger",

          // PRIMARY OUTLINE
          "bg-[color:var(--surface)] border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:text-white focus-visible:ring-[color:var(--brand-cyan)]":
            variant === "primaryOutline",

          // SECONDARY OUTLINE
          "bg-[color:var(--surface)] border-[color:var(--secondary)] text-[color:var(--secondary)] hover:bg-[color:var(--secondary)] hover:text-white focus-visible:ring-[color:var(--brand-cyan)]":
            variant === "secondaryOutline",

          // GHOST (sin gris feo, sin negro)
          "border-transparent text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--text)] focus-visible:ring-[color:var(--brand-cyan)]":
            variant === "ghost",
        },
        className
      )}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
