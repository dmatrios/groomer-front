import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
