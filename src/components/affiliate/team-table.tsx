import { formatDate } from "@/lib/utils";

// ─── Residual Network ─────────────────────────────────────────────────────────
export function TeamTable({
  team,
  referrals,
}: {
  team: {
    id: string;
    name: string;
    email: string;
    code: string;
    referrals: number;
    crowPoints: number;
    joinedAt: Date;
  }[];
  referrals: { id: string; code: string; invitedEmail: string | null; createdAt: Date }[];
}) {
  // We aggregate team members per "level" — in real data all direct are L1.
  // We render a level-tree view as in the mockup.
  const levels = [
    { level: "L1", pct: 5, members: team, generated: team.reduce((s, m) => s + m.crowPoints * 0.05, 0) },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6 backdrop-blur-sm">
      <h2 className="font-sans text-[17px] font-semibold text-crow-text">Residual Network</h2>
      <p className="mt-1 mb-7 text-[13px] text-crow-muted">Tu red de afiliados por nivel y lo que genera cada uno.</p>

      {/* Tree */}
      <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-0">
        {/* YOU node */}
        <div className="mb-2 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-crow-violetSoft to-crow-violet font-sans text-[13px] font-bold shadow-glow">
            TÚ
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-white/20 to-crow-violet/50" />
        </div>

        {/* Level rows */}
        {levels.map((lvl, idx) => (
          <div key={lvl.level} className="space-y-0">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 shrink-0 text-center">
                <p className="font-sans text-[15px] font-semibold text-crow-text">{lvl.level}</p>
                <p className="text-[11px] font-medium text-crow-glow">{lvl.pct}%</p>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-4 sm:gap-8">
                  <div className="min-w-0">
                    <p className="text-[11px] text-crow-muted">Afiliados</p>
                    <p className="font-sans text-[15px] font-semibold text-crow-text">{lvl.members.length}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-crow-muted">Generado</p>
                    <p className="font-sans text-[15px] font-semibold text-crow-glow">
                      {lvl.members.length > 0 ? `${(lvl.members.reduce((s, m) => s + m.crowPoints, 0) * lvl.pct / 100).toFixed(2)} CP` : "—"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-crow-success/12 px-2.5 py-1 text-[10.5px] font-semibold text-crow-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-crow-success" />
                  UNLOCKED
                </span>
              </div>
            </div>
            {idx < levels.length - 1 && (
              <div className="ml-8 h-6 w-px bg-white/10" />
            )}
          </div>
        ))}

        {/* Empty */}
        {team.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-white/[0.06] px-6 py-10 text-center">
            <p className="text-[13px] font-medium text-crow-text">Red vacía</p>
            <p className="mt-1 max-w-xs text-[12px] text-crow-muted">
              Invitá con tu código y empezá a ganar en 5 niveles de comisiones.
            </p>
          </div>
        )}
      </div>

      {/* Members list */}
      {team.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-crow-muted/70">
            Afiliados directos
          </p>
          <div className="space-y-2">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-3 transition hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-crow-violet/30 bg-crow-violet/15 text-[11px] font-semibold text-crow-glow">
                    {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-crow-text">{member.name}</p>
                    <p className="truncate text-[11px] text-crow-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-crow-muted">{member.referrals} ref.</span>
                  <span className="text-[11px] text-crow-muted">{formatDate(member.joinedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals */}
      {referrals.length > 0 && (
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-crow-muted/70">
            Invitaciones
          </p>
          <div className="space-y-2">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-3"
              >
                <span className="truncate text-[12.5px] text-crow-text">
                  {ref.invitedEmail ?? "Invitación pendiente"}
                </span>
                <span className="shrink-0 text-[10.5px] text-crow-muted">
                  {formatDate(ref.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
