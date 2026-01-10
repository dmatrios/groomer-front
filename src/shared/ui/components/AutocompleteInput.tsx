"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import clsx from "clsx";

export type AutocompleteItem = {
  id: number | string;
  label: string;
  subLabel?: string;
};

type Props = {
  label?: string;
  placeholder?: string;
  items: AutocompleteItem[];

  value: string;
  onChange: (value: string) => void;

  onPick?: (item: AutocompleteItem) => void;

  disabled?: boolean;
  maxSuggestions?: number;

  className?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function AutocompleteInput({
  label,
  placeholder,
  items,
  value,
  onChange,
  onPick,
  disabled,
  maxSuggestions = 8,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => {
    const q = normalize(value);
    if (!q) return [];
    return items
      .filter((it) => normalize(it.label).includes(q))
      .slice(0, maxSuggestions);
  }, [items, value, maxSuggestions]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showDropdown = open && suggestions.length > 0 && !disabled;

  return (
    <div ref={rootRef} className={clsx("space-y-1", className)}>
      {label && (
        <label className="text-xs font-semibold text-[color:var(--muted)]">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className={clsx(
            "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]",
            "px-3 py-2 pr-10 text-sm outline-none",
            "transition-all duration-200",
            "focus:ring-2 focus:ring-[color:var(--brand-cyan)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        {/* Right icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg p-1 text-[color:var(--muted)] transition-all duration-200 hover:brightness-110 hover:shadow-sm"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
            className="rounded-lg p-1 text-[color:var(--muted)] transition-all duration-200 hover:brightness-110 hover:shadow-sm disabled:hover:shadow-none"
            aria-label="Mostrar sugerencias"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className={clsx(
              "absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl",
              "border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg"
            )}
          >
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s.label);
                      onPick?.(s);
                      setOpen(false);
                    }}
                    className={clsx(
                      "w-full px-3 py-2 text-left",
                      "transition-all duration-200",
                      "hover:brightness-110 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {s.label}
                        </div>
                        {s.subLabel && (
                          <div className="truncate text-xs text-[color:var(--muted)]">
                            {s.subLabel}
                          </div>
                        )}
                      </div>

                      {normalize(s.label) === normalize(value) && (
                        <Check className="h-4 w-4 text-[color:var(--brand-green)]" />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
