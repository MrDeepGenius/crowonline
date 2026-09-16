import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  hover,
  id,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={cn("crow-card p-5", hover && "crow-card-hover", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-crow-violet/25 bg-crow-violet/10 text-crow-glow">
            {icon}
          </span>
        ) : null}
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-crow-text">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-crow-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <span className="crow-chip mb-3 border-crow-violet/30 text-crow-glow">
          <span className="h-1.5 w-1.5 rounded-full bg-crow-violet" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-crow-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "violet" | "success" | "warn";
}) {
  const tones = {
    default: "text-crow-text",
    violet: "text-crow-glow",
    success: "text-crow-success",
    warn: "text-crow-warn",
  } as const;

  return (
    <div className="crow-card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-crow-violet/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-crow-muted">
          {label}
        </span>
        {icon ? <span className="text-crow-violet/70">{icon}</span> : null}
      </div>
      <div
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight",
          tones[tone],
        )}
      >
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-crow-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="crow-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-crow-glow">
        {icon ?? "◆"}
      </span>
      <h3 className="text-sm font-semibold text-crow-text">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-crow-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}