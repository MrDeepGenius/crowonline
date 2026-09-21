import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { BuyPanel } from "@/components/marketplace/buy-panel";
import { CourseOutline } from "@/components/marketplace/course-outline";
import { ProductReviews } from "@/components/marketplace/product-reviews";
import { LearningGoals } from "@/components/marketplace/learning-goals";
import { FAQSection } from "@/components/marketplace/faq-section";
import {
  CreatorBadge,
  DescriptionBlock,
  IncludesGrid,
  PreviewBlock,
  ProductCover,
  ProductMeta,
} from "@/components/marketplace/product-overview";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug } from "@/server/services/catalog";
import { getReferredAffiliateCode } from "@/server/services/affiliate";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ ref?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.title, description: product.shortDescription };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const cookieStore = await cookies();

  // Referral attribution priority: explicit ?ref= → cookie persisted by the
  // middleware when the visitor landed on /marketplace?ref=CODE (30 days) →
  // durable referral stored at registration for a logged-in buyer.
  const referralCode =
    search.ref ??
    cookieStore.get("crow_ref")?.value ??
    (user ? await getReferredAffiliateCode(user.id) : null);

  const owned = user
    ? Boolean(
        await prisma.orderItem.findFirst({
          where: { productId: product.id, order: { buyerId: user.id, status: "PAID" } },
          select: { id: true },
        }),
      )
    : false;

  const lessons = product.course?.modules.flatMap((module) => module.lessons) ?? [];
  const freeLesson = lessons.find((lesson) => lesson.isFreePreview) ?? lessons[0];
  const isCourse = product.type === "COURSE";
  const exerciseCount = lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);

  return (
    <div className="mp-page flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="crow-container py-10">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-[12px] text-crow-muted transition hover:text-crow-glow"
          >
            ← Volver al marketplace
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <ProductCover
                coverEmoji={product.coverEmoji}
                coverGradient={product.coverGradient}
                coverImageUrl={product.coverImageUrl}
                type={product.type}
                category={product.category}
                durationMin={product.course?.durationMin}
              />

              <ProductMeta
                status={product.status}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                salesCount={product.salesCount}
              />

              <h1 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
                {product.title}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-crow-muted">
                {product.shortDescription}
              </p>

              <CreatorBadge
                name={product.creator.name}
                since={new Date(product.creator.createdAt).getFullYear()}
                isCourse={isCourse}
                durationMin={product.course?.durationMin}
              />

              <section className="mt-10">
                <h2 className="text-[17px] font-semibold">Descripción</h2>
                <DescriptionBlock description={product.description} />
              </section>

              <section className="mt-10">
                <h2 className="text-[17px] font-semibold">Qué incluye</h2>
                <IncludesGrid items={product.includes} />
              </section>

              {product.courseGoals && product.courseGoals.length > 0 ? (
                <LearningGoals goals={product.courseGoals} />
              ) : null}

              {freeLesson ? (
                <section className="mt-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold">Preview</h2>
                    <Badge tone="success">Gratis</Badge>
                  </div>
                  <PreviewBlock lesson={freeLesson} />
                </section>
              ) : null}

              {isCourse && product.course ? (
                <section className="mt-10">
                  <h2 className="text-[17px] font-semibold">Contenido del curso</h2>
                  <p className="mt-1.5 text-[12.5px] text-crow-muted">
                    {product.course.modules.length} módulos · {lessons.length} lecciones ·{" "}
                    {exerciseCount} ejercicios
                  </p>
                  <CourseOutline modules={product.course.modules} />
                </section>
              ) : null}

              <section className="mt-10">
                <h2 className="text-[17px] font-semibold">Reviews</h2>
                <div className="mt-5">
                  <ProductReviews
                    productId={product.id}
                    reviews={product.reviews}
                    ratingAvg={product.ratingAvg}
                    ratingCount={product.ratingCount}
                    canReview={owned}
                    isAuthenticated={Boolean(user)}
                  />
                </div>
              </section>

              <FAQSection />
            </div>

            <div>
              <BuyPanel
                productId={product.id}
                priceUsdt={product.priceUsdt}
                compareAt={product.compareAtUsdt}
                isAuthenticated={Boolean(user)}
                owned={owned}
                referralCode={referralCode}
              />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}