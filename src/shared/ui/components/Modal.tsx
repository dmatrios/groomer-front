"use client";

import { X } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onClose: () => void;
  busy?: boolean;
};

export function Modal({
  open,
  title,
  description,
  children,
  primaryText,
  secondaryText = "Cerrar",
  onPrimary,
  onClose,
  busy,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <Card className="relative w-full max-w-lg space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold">{title}</div>
            {description && (
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                {description}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            icon={X}
            className="px-3"
            disabled={busy}
          >
            {/* sin texto */}
          </Button>
        </div>

        {children && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            {children}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="secondaryOutline"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            {secondaryText}
          </Button>

          {primaryText && onPrimary && (
            <Button
              variant="primary"
              type="button"
              onClick={onPrimary}
              disabled={busy}
            >
              {primaryText}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
