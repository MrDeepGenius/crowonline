import prisma from "@/lib/db";

export async function enrollUser({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) return existing;

  return prisma.enrollment.create({ data: { userId, productId } });
}

export async function isEnrolled(userId: string, productId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return Boolean(enrollment);
}

export async function listLibrary(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          creator: { select: { id: true, name: true } },
          course: { select: { id: true, durationMin: true } },
        },
      },
    },
  });
}

export async function getCourseProgress(userId: string, productId: string) {
  const [course, progress, certificate] = await Promise.all([
    prisma.course.findUnique({
      where: { productId },
      include: {
        modules: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
              include: { exercises: { orderBy: { position: "asc" } } },
            },
          },
        },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, lesson: { module: { course: { productId } } } },
      select: { lessonId: true, completed: true },
    }),
    prisma.certificate.findFirst({ where: { userId, productId } }),
  ]);

  const completedIds = new Set(
    progress.filter((item) => item.completed).map((item) => item.lessonId),
  );
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? [];
  const pct = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;

  return { course, progress, completedIds, pct, certificate };
}

export async function toggleLessonComplete({
  userId,
  lessonId,
  completed,
}: {
  userId: string;
  lessonId: string;
  completed: boolean;
}) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { include: { product: true } } } },
    },
  });
  if (!lesson) throw new Error("Lección no encontrada");

  const productId = lesson.module.course.product.id;
  const enrollment = await enrollUser({ userId, productId });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      enrollmentId: enrollment.id,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  const { completedIds, course } = await getCourseProgress(userId, productId);
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? [];
  const pct = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;

  let certificate = null;
  if (pct >= 100) {
    certificate = await issueCertificate({ userId, productId });
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPct: pct, completedAt: pct >= 100 ? new Date() : null },
  });

  return { progressPct: pct, certificate };
}

export async function issueCertificate({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  const existing = await prisma.certificate.findFirst({ where: { userId, productId } });
  if (existing) return existing;

  const [user, product] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.product.findUnique({
      where: { id: productId },
      include: { creator: { select: { id: true, name: true } } },
    }),
  ]);
  if (!user || !product) throw new Error("No se pudo emitir el certificado");

  const serial = `CROW-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  return prisma.certificate.create({
    data: {
      serial,
      userId,
      productId,
      creatorId: product.creator.id,
      studentName: user.name,
      courseTitle: product.title,
      creatorName: product.creator.name,
    },
  });
}

export async function listCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getCertificateBySerial(serial: string) {
  return prisma.certificate.findUnique({
    where: { serial },
    include: {
      product: { select: { slug: true, type: true } },
    },
  });
}