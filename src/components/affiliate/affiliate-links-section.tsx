"use client";

import { useState } from "react";

type LinkCard = {
  title: string;
  kind: "ref" | "creator";
  url: string;
  stats: [string, string][];
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.06] px-2.5 py-1.5 text-[11.5px] font-medium text-crow-muted transition hover:bg-white/[0.1]"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-crow-success" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function LinkCardUI({ card }: { card: LinkCard }) {
  const iconPath =
    card.kind === "ref"
      ? /* network */ "M12 2a2 2 0 100 4 2 2 0 000-4zM4 18a2 2 0 100 4 2 2 0 000-4zM20 18a2 2 0 100 4 2 2 0 000-4zM12 4v4M4 18l4-8M20 18l-4-8"
      : /* sparkle */ "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-crow-violet/20 bg-crow-violet/10 text-crow-glow">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        </div>
        <h3 className="font-sans text-[15px] font-semibold text-crow-text">{card.title}</h3>
      </div>

      {/* URL box */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-crow-violet/20 bg-crow-violet/[0.05] px-3.5 py-2.5">
        <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-crow-glow">
          {card.url}
        </code>
        <CopyButton url={card.url} />
        <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.06] px-2.5 py-1.5 text-[11.5px] font-medium text-crow-muted transition hover:bg-white/[0.1]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" />
          </svg>
          Compartir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {card.stats.map(([value, label]) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 text-center"
          >
            <span className="font-sans text-[16px] font-semibold text-crow-text">{value}</span>
            <span className="text-[10.5px] text-crow-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AffiliateLinksSection({
  code,
  baseUrl,
}: {
  code: string;
  baseUrl: string;
}) {
  const cards: LinkCard[] = [
    {
      title: "Invitar afiliados",
      kind: "ref",
      url: `${baseUrl}/r/${code}`,
      stats: [
        ["—", "clics"],
        ["—", "registros"],
        ["—", "conversión"],
      ],
    },
    {
      title: "Invitar creadores",
      kind: "creator",
      url: `${baseUrl}/creator/${code}`,
      stats: [
        ["—", "clics"],
        ["—", "registros"],
        ["—", "conversión"],
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <LinkCardUI key={card.kind} card={card} />
      ))}
    </div>
  );
}
