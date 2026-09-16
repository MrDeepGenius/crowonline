import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-crow-violet to-crow-violetSoft text-white shadow-[0_10px_40px_-12px_rgba(106,0,255,0.9)] hover:brightness-110",
  secondary:
    "bg-white/[0.06] text-crow-text border border-white/10 hover:bg-white/[0.1]",
  ghost: "text-crow-muted hover:text-crow-text hover:bg-white/[0.05]",
  outline:
    "border border-crow-violet/50 text-crow-glow hover:bg-crow-violet/10 hover:border-crow-violet",
  danger:
    "bg-crow-danger/15 text-crow-danger border border-crow-danger/40 hover:bg-crow-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const buttonClass = (
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) =>
  cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crow-violet/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.985]",
    variants[variant],
    sizes[size],
    className,
  );

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  prefetch,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={buttonClass(variant, size, className)}
    >
      {children}
    </Link>
  );
}