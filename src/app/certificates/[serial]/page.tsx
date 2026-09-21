import Link from "next/link";
import { notFound } from "next/navigation";

import { CrowMark } from "@/components/brand/crow-mark";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCertificateBySerial } from "@/server/services/learning";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Certificado" };

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;
  const certificate = await getCertificateBySerial(serial);
  if (!certificate) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="crow-container flex-1 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/library"
            className="text-[12px] text-crow-muted transition hover:text-crow-text"
          >
            ← Mi biblioteca
          </Link>
          <ButtonLink href={`/marketplace/${certificate.product.slug}`} variant="ghost" size="sm">
            Ver el curso
          </ButtonLink>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-crow-violet/30 bg-[#0C0C10] p-8 sm:p-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-crow-violet/25 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-crow-violetSoft/20 blur-[110px]" />
          <div className="pointer-events-none absolute inset-0 grid-crow opacity-25" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CrowMark size={40} />
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] text-crow-text">
                    CROW MARKET
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-crow-muted">
                    Certificado de finalización
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-crow-success/35 bg-crow-success/10 px-3 py-1 text-[11px] text-crow-success">
                Verificado
              </span>
            </div>

            <div className="crow-divider my-9" />

            <p className="text-[12px] uppercase tracking-[0.24em] text-crow-muted">
              Se certifica que
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[44px]">
              {certificate.studentName}
            </h1>
            <p className="mt-5 text-[13.5px] leading-relaxed text-crow-muted">
              ha completado satisfactoriamente el programa
            </p>
            <h2 className="crow-glow-text mt-2 text-2xl font-semibold leading-tight sm:text-[32px]">
              {certificate.courseTitle}
            </h2>

            <div className="crow-divider my-9" />

            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Creator
                </dt>
                <dd className="mt-1.5 text-[14px] text-crow-text">
                  {certificate.creatorName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Fecha de emisión
                </dt>
                <dd className="mt-1.5 text-[14px] text-crow-text">
                  {formatDate(certificate.issuedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Identificador único
                </dt>
                <dd className="mt-1.5 font-mono text-[13px] text-crow-glow">
                  {certificate.serial}
                </dd>
              </div>
            </dl>

            <p className="mt-10 text-[11px] leading-relaxed text-crow-muted">
              Este certificado puede verificarse en crow.market/certificates/
              {certificate.serial}. Emitido por CROW MARKET como constancia de
              finalización del programa formativo.
            </p>
          </div>
        </div>

        <Card className="mt-8">
          <p className="text-[13px] font-semibold text-crow-text">
            Comparte tu logro
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-crow-muted">
            Publica el enlace del certificado en tu perfil profesional. Cada
            certificado tiene un identificador único verificable y queda asociado a
            tu cuenta CROW.
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}