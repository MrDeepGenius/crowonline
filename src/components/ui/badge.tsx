import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone =
  | "default"
  | "violet"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "outline";

const tones: Record<Tone, string> = {
  default: "border-white/10 bg-white/[0.04] text-crow-muted",
  violet: "border-crow-violet/35 bg-crow-violet/12 text-crow-glow",
  success: "border-crow-success/30 bg-crow-success/10 text-crow-success",
  warn: "border-crow-warn/30 bg-crow-warn/10 text-crow-warn",
  danger: "border-crow-danger/30 bg-crow-danger/10 text-crow-danger",
  info: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  outline: "border-white/15 bg-transparent text-crow-text",
};

export function Badge({
  children,
  tone = "default",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "PUBLISHED":
    case "PAID":
    case "APPROVED":
    case "ACTIVE":
    case "AVAILABLE":
      return "success";
    case "PENDING":
    case "IN_REVIEW":
    case "DRAFT":
      return "warn";
    case "FAILED":
    case "REJECTED":
    case "EXPIRED":
    case "SUSPENDED":
    case "REVERSED":
      return "danger";
    default:
      return "default";
  }
}

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge tone={statusTone(status)} dot>
      {label ?? status}
    </Badge>
  );
}

export function ProgressBar({
  value,
  className,
  showLabel,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-crow-violet to-crow-glow transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-[11px] font-medium text-crow-muted">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}

export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const label = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-crow-violet/30 bg-gradient-to-br from-crow-violet/25 to-transparent font-semibold text-crow-glow",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {label || "◆"}
    </span>
  );
}