import { cn } from "@/lib/utils";

export function CrowMark({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl border border-crow-violet/40 bg-gradient-to-br from-crow-violet/40 via-crow-violetDeep/40 to-transparent",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-xl bg-crow-violet/10 blur-md" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-[60%] w-[60%] text-crow-glow"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M17.5 6.5C16.2 5.2 14.2 4.5 12 4.5 8 4.5 5 7.5 5 12s3 7.5 7 7.5c2.2 0 4.2-.7 5.5-2" />
        <path d="M14.5 9.5l2.5-3 1 3.5" />
      </svg>
    </span>
  );
}

export function CrowWordmark({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <CrowMark size={compact ? 30 : 34} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[0.16em] text-crow-text">
          CROW
        </span>
        {!compact ? (
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.34em] text-crow-muted">
            Market
          </span>
        ) : null}
      </span>
    </span>
  );
}