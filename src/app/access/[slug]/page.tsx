import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProductType } from "@/lib/domain";
import { getProductBySlug } from "@/server/services/catalog";
import { isEnrolled } from "@/server/services/learning";

export const dynamic = "force-dynamic";
import { formatUsdt, parseJson } from "@/lib/utils";

export const metadata = { title: "Acceso al producto" };

export default async function ProductAccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  if (product.type === "COURSE") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="crow-container flex flex-1 items-center justify-center py-20">
          <Card className="max-w-md p-8 text-center">
            <h1 className="text-lg font-semibold">Este es un curso</h1>
            <p className="mt-2 text-[13px] text-crow-muted">
              Los cursos se estudian en el Course Player con progreso y certificado.
            </p>
            <ButtonLink href={`/learn/${product.slug}`} className="mt-6">
              Ir al aula
            </ButtonLink>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="crow-container flex flex-1 items-center justify-center py-20">
          <Card className="max-w-md p-8 text-center">
            <Badge tone="warn">Acceso restringido</Badge>
            <h1 className="mt-4 text-lg font-semibold">Inicia sesión para acceder</h1>
            <p className="mt-2 text-[13px] text-crow-muted">
              {product.title} requiere una compra válida en CROW.
            </p>
            <ButtonLink href="/login" className="mt-6">
              Iniciar sesión
            </ButtonLink>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const enrolled = await isEnrolled(user.id, product.id);

  if (!enrolled) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="crow-container max-w-2xl flex-1 py-16 text-center">
          <Badge tone="warn">Acceso restringido</Badge>
          <p className="mt-4 text-[12px] uppercase tracking-wider text-crow-muted">
            {PRODUCT_TYPE_LABEL[product.type as ProductType] ?? product.type} ·{" "}
            {formatUsdt(product.priceUsdt)}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {product.title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-crow-muted">
            Este contenido es premium y solo está disponible para compradores.
          </p>
          <div className="mt-7 flex justify-center gap-2.5">
            <ButtonLink href={`/marketplace/${product.slug}`}>Comprar ahora</ButtonLink>
            <ButtonLink href="/library" variant="secondary">
              Mi biblioteca
            </ButtonLink>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const resources = parseJson<string[]>(product.course?.learningGoals ?? "[]", []);
  const lessons = product.course?.modules.flatMap((m) => m.lessons) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="crow-container max-w-4xl py-12">
          <Link href="/library" className="text-[12px] text-crow-muted hover:text-crow-text">
            ← Mi biblioteca
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Badge tone="success" dot>
              Acceso desbloqueado
            </Badge>
            <Badge tone="violet">
              {PRODUCT_TYPE_LABEL[product.type as ProductType] ?? product.type}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{product.title}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-crow-muted">
            {product.shortDescription}
          </p>
          <Card className="mt-8">
            <h2 className="text-[15px] font-semibold">Contenido premium</h2>
            <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-crow-muted">
              {product.description}
            </p>
          </Card>
          {lessons.length ? (
            <Card className="mt-6">
              <h2 className="text-[15px] font-semibold">Índice del contenido</h2>
              <ul className="mt-4 space-y-2.5">
                {lessons.map((lesson, index) => (
                  <li
                    key={`${lesson.title}-${index}`}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-[13px] font-medium text-crow-text">
                      {index + 1}. {lesson.title}
                    </p>
                    {lesson.content ? (
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-crow-muted">
                        {lesson.content}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {product.includes.length ? (
            <Card className="mt-6">
              <h2 className="text-[15px] font-semibold">Qué incluye tu acceso</h2>
              <ul className="mt-4 space-y-2">
                {product.includes.map((item) => (
                  <li key={item} className="text-[13px] text-crow-muted">
                    · {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {resources.length ? (
            <Card className="mt-6">
              <h2 className="text-[15px] font-semibold">Recursos</h2>
              <ul className="mt-4 space-y-2">
                {resources.map((item) => (
                  <li key={item} className="text-[13px] text-crow-muted">
                    · {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

