import { AffiliateShell } from "@/components/affiliate/affiliate-shell";
import { CommissionTable } from "@/components/affiliate/commission-table";
import { TeamTable } from "@/components/affiliate/team-table";
import { AffiliateLinksSection } from "@/components/affiliate/affiliate-links-section";
import {
  AffiliateStats,
  AffiliateBusinessCard,
  AffiliateRulesCard,
  AffiliateNetworkSummary,
} from "@/components/affiliate/affiliate-stats";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAffiliateOverview } from "@/server/services/affiliate";
import { getWalletOverview } from "@/server/services/wallet";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Afiliados · CROW" };

// ─── Divider label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(247,247,250,0.07), transparent)" }} />
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(155,152,168,0.7)" }}>
        {children}
      </p>
      <span className="h-px flex-1" style={{ background: "linear-gradient(to left, rgba(247,247,250,0.07), transparent)" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AffiliatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [overview, wallet] = await Promise.all([
    getAffiliateOverview(user.id),
    getWalletOverview(user.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const firstName = user.name.split(" ")[0];

  return (
    <AffiliateShell activePath="/affiliate">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold tracking-tight sm:text-[30px]"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            Hola, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-[14.5px]" style={{ color: "#9B98A8" }}>
            Tu centro de operaciones como afiliado.
          </p>
        </div>

        {/* Period selector + status */}
        <div className="flex flex-col gap-2.5 sm:items-end">
          <div
            className="flex items-center gap-1 rounded-full p-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(247,247,250,0.08)" }}
          >
            {["Hoy", "7 días", "30 días", "90 días", "Todo"].map((p, i) => (
              <span
                key={p}
                className="cursor-default select-none rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                style={
                  i === 2
                    ? { background: "linear-gradient(180deg,#8B5CF6,#6A00FF)", color: "#fff" }
                    : { color: "#9B98A8" }
                }
              >
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#9B98A8" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Cuenta activa
          </div>
        </div>
      </section>

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <AffiliateStats
        clicks={overview.clicks}
        conversions={overview.conversions}
        conversionRate={overview.conversionRate}
        commissionTotal={overview.commissionTotal}
        crowPoints={overview.crowPoints}
        teamSize={overview.team.length}
      />

      {/* ── TU NEGOCIO ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Tu negocio</SectionLabel>
        <AffiliateBusinessCard
          conversions={overview.conversions}
          commissionTotal={overview.commissionTotal}
          conversionRate={overview.conversionRate}
          teamSize={overview.team.length}
        />
      </div>

      {/* ── TWO-COLUMN GRID ───────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">

        {/* LEFT */}
        <div className="space-y-8">

          <div className="space-y-4">
            <SectionLabel>Tu estructura de comisiones</SectionLabel>
            <AffiliateRulesCard />
          </div>

          <div className="space-y-4">
            <SectionLabel>Residual Network</SectionLabel>
            <TeamTable team={overview.team} referrals={overview.referrals} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Últimas ventas</SectionLabel>
              <a href="/affiliate/sales" className="text-[12.5px] font-medium text-[#A855F7] hover:text-white transition-colors">
                Ver todas →
              </a>
            </div>
            <CommissionTable commissions={overview.commissions} />
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-8">

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Mis enlaces</SectionLabel>
              <a href="/affiliate/links" className="text-[12.5px] font-medium text-[#A855F7] hover:text-white transition-colors">
                Crear nuevo →
              </a>
            </div>
            <AffiliateLinksSection
              code={overview.affiliate.referralCode}
              baseUrl={baseUrl}
            />
          </div>

          <div className="space-y-4">
            <SectionLabel>Residual Network</SectionLabel>
            <AffiliateNetworkSummary
              teamSize={overview.team.length}
              referralsTotal={overview.referrals.length}
              level1Unlocked={overview.affiliate.level1Unlocked}
              emergencyReserve={overview.affiliate.emergencyReserveUsdt}
            />
          </div>

          {/* Wallet mini-card */}
          <div className="space-y-4">
            <SectionLabel>Wallet</SectionLabel>
            <div
              className="rounded-2xl p-5"
              style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))", border: "1px solid rgba(247,247,250,0.08)" }}
            >
              <p className="text-[11.5px]" style={{ color: "#9B98A8" }}>Saldo disponible</p>
              <p className="mt-1 text-[22px] font-semibold" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                {formatUsdt(wallet.wallet.availableUsdt)}
                <span className="ml-1.5 text-[13px] font-normal" style={{ color: "#9B98A8" }}>USDT</span>
              </p>
              <a
                href="/wallet"
                className="mt-4 flex w-full items-center justify-center rounded-lg py-2.5 text-[12.5px] font-medium transition hover:brightness-110"
                style={{ background: "linear-gradient(180deg,#8B5CF6,#6A00FF)" }}
              >
                Ir a wallet →
              </a>
            </div>
          </div>

        </div>
      </div>

    </AffiliateShell>
  );
}
