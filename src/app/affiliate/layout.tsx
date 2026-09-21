import type { ReactNode } from "react";

// This layout overrides the default dashboard shell for all /affiliate pages
// with the custom AffiliateShell that replicates the Affiliate Command Center mockup.
// Individual pages render their own <AffiliateShell> so they can pass activePath.
// We intentionally keep this layout transparent (no wrapping shell here) because
// each page inside /affiliate calls AffiliateShell directly.

export default function AffiliateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
