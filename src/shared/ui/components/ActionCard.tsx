"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type ActionCardProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  href: string;
  accent?: "green" | "cyan" | "orange" | "indigo";
};

const accentStyles = {
  green: "bg-[color:var(--brand-green)]/15 text-[color:var(--brand-green)]",
  cyan: "bg-[color:var(--brand-cyan)]/15 text-[color:var(--brand-cyan)]",
  orange: "bg-[color:var(--brand-orange)]/15 text-[color:var(--brand-orange)]",
  indigo: "bg-[color:var(--brand-indigo)]/15 text-[color:var(--brand-indigo)]",
};

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  accent = "indigo",
}: ActionCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={clsx(
        "group w-full text-left rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition",
        "hover:shadow-md hover:-translate-y-[1px]"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            accentStyles[accent]
          )}
        >
          <Icon size={22} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-base">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
