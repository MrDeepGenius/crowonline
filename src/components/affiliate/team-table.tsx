import { Card, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

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
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader
          title="Mi equipo (downline)"
          description="Afiliados que invitaste directamente"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
              <tr>
                <th className="py-2">Afiliado</th>
                <th className="py-2">Código</th>
                <th className="py-2">Invita</th>
                <th className="py-2">CP</th>
                <th className="py-2">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {team.map((member) => (
                <tr key={member.id}>
                  <td className="py-2.5">
                    <p className="text-crow-text">{member.name}</p>
                    <p className="text-[11px] text-crow-muted">{member.email}</p>
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-crow-glow">
                    {member.code}
                  </td>
                  <td className="py-2.5 text-crow-muted">{member.referrals}</td>
                  <td className="py-2.5 text-crow-muted">{member.crowPoints.toFixed(0)}</td>
                  <td className="py-2.5 text-crow-muted">{formatDate(member.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!team.length ? (
          <p className="py-6 text-center text-[12.5px] text-crow-muted">
            Todavía no tienes afiliados en tu equipo. Invita con tu código y gana en
            cinco niveles.
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Invitaciones" description="Registros con tu código" />
        <ul className="space-y-2.5">
          {referrals.map((referral) => (
            <li
              key={referral.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-[12px]"
            >
              <span className="truncate text-crow-text">
                {referral.invitedEmail ?? "Invitación pendiente"}
              </span>
              <span className="shrink-0 text-crow-muted">
                {formatDate(referral.createdAt)}
              </span>
            </li>
          ))}
          {!referrals.length ? (
            <li className="text-[12.5px] text-crow-muted">Sin invitaciones registradas.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}