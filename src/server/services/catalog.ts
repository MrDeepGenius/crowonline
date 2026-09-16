import prisma from "@/lib/db";
import { parseJson } from "@/lib/utils";

export type MarketplaceFilters = {
  q?: string;
  category?: string;
  type?: string;
  sort?: "recent" | "price-asc" | "price-desc" | "rating";
  creatorId?: string;
  limit?: number;
};

export async function listMarketplaceProducts(filters: MarketplaceFilters = {}) {
  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (filters.category && filters.category !== "all") where.category = filters.category;
  if (filters.type && filters.type !== "all") where.type = filters.type;
  if (filters.creatorId) where.creatorId = filters.creatorId;

  if (filters.q) {
    const term = filters.q.trim();
    where.OR = [
      { title: { contains: term } },
      { shortDescription: { contains: term } },
      { description: { contains: term } },
      { tags: { contains: term } },
    ];
  }

  const orderBy =
    filters.sort === "price-asc"
      ? { priceUsdt: "asc" as const }
      : filters.sort === "price-desc"
        ? { priceUsdt: "desc" as const }
        : filters.sort === "rating"
          ? { ratingAvg: "desc" as const }
          : { createdAt: "desc" as const };

  return prisma.product.findMany({
    where,
    orderBy,
    take: filters.limit ?? 60,
    include: {
      creator: { select: { id: true, name: true } },
      course: { select: { id: true, durationMin: true } },
      _count: { select: { reviews: true, enrollments: true } },
    },
  });
}

export async function getMarketplaceFacets() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true, type: true },
  });

  const categories = new Map<string, number>();
  const types = new Map<string, number>();
  products.forEach((product) => {
    categories.set(product.category, (categories.get(product.category) ?? 0) + 1);
    types.set(product.type, (types.get(product.type) ?? 0) + 1);
  });

  return {
    categories: Array.from(categories.entries()).map(([value, count]) => ({
      value,
      count,
    })),
    types: Array.from(types.entries()).map(([value, count]) => ({ value, count })),
    total: products.length,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug }, { publication: { slug } }] },
    include: {
      creator: {
        select: { id: true, name: true, profile: true, createdAt: true },
      },
      publication: true,
      course: {
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
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    tags: parseJson<string[]>(product.tags, []),
    includes: parseJson<string[]>(product.includes, []),
    courseGoals: parseJson<string[]>(product.course?.learningGoals, []),
  };
}

export async function listCreatorProducts(creatorId: string) {
  return prisma.product.findMany({
    where: { creatorId },
    orderBy: { updatedAt: "desc" },
    include: {
      course: { select: { id: true, durationMin: true } },
      publication: true,
      _count: { select: { reviews: true, enrollments: true } },
    },
  });
}

export async function getCreatorProduct(productId: string, creatorId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId },
    include: {
      publication: true,
      course: {
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
      },
    },
  });
  if (!product) return null;
  return {
    ...product,
    tags: parseJson<string[]>(product.tags, []),
    includes: parseJson<string[]>(product.includes, []),
    courseGoals: parseJson<string[]>(product.course?.learningGoals, []),
  };
}

export async function getCreatorMetrics(creatorId: string) {
  const [products, orders, commissions, enrollments] = await Promise.all([
    prisma.product.findMany({
      where: { creatorId },
      select: {
        id: true,
        title: true,
        status: true,
        salesCount: true,
        revenueUsdt: true,
        priceUsdt: true,
        ratingAvg: true,
        ratingCount: true,
        type: true,
        qualityScore: true,
      },
    }),
    prisma.order.findMany({
      where: { items: { some: { creatorId } }, status: "PAID" },
      select: { id: true, totalUsdt: true, createdAt: true },
    }),
    prisma.commission.findMany({
      where: { earnerId: creatorId },
      select: { amountUsdt: true, role: true, createdAt: true },
    }),
    prisma.enrollment.count({ where: { product: { creatorId } } }),
  ]);

  const revenue = products.reduce((sum, item) => sum + item.revenueUsdt, 0);
  const published = products.filter((item) => item.status === "PUBLISHED").length;

  return {
    products,
    published,
    drafts: products.length - published,
    revenue,
    commissionTotal: commissions
      .filter((item) => item.role === "CREATOR")
      .reduce((sum, item) => sum + item.amountUsdt, 0),
    orders: orders.length,
    enrollments,
    avgTicket: orders.length ? revenue / orders.length : 0,
    topProducts: [...products]
      .sort((a, b) => b.revenueUsdt - a.revenueUsdt)
      .slice(0, 5),
    ordersTimeline: orders.map((order) => ({
      id: order.id,
      total: order.totalUsdt,
      createdAt: order.createdAt,
    })),
  };
}

export async function creatorCatalogForMarketplace(creatorId: string) {
  return listMarketplaceProducts({ creatorId, limit: 12 });
}