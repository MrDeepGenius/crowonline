/**
 * CROW domain constants and shared types.
 *
 * The Prisma schema stores these values as plain strings (SQLite/PostgreSQL
 * portable), so every status/enum lives here as the single source of truth.
 */

export const ROLES = ["BUYER", "AFFILIATE", "CREATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: "Comprador",
  AFFILIATE: "Afiliado",
  CREATOR: "Creator",
  ADMIN: "Administrador",
};

export const PRODUCT_TYPES = [
  "COURSE",
  "EBOOK",
  "PDF",
  "INTERACTIVE_WEB",
  "RESOURCE_KIT",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_CATEGORIES = [
  "Cursos",
  "Ebook",
  "PDF",
  "Web interactiva",
  "Kit de recursos",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_TO_TYPE: Record<string, ProductType> = {
  Cursos: "COURSE",
  Ebook: "EBOOK",
  PDF: "PDF",
  "Web interactiva": "INTERACTIVE_WEB",
  "Kit de recursos": "RESOURCE_KIT",
};

export const PRODUCT_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  EXPIRED: "Expirada",
  FAILED: "Fallida",
  REFUNDED: "Reembolsada",
};

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const WITHDRAWAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAID",
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PAID: "Pagado",
};

export const WALLET_TYPES = [
  "SALE_COMMISSION",
  "DIRECT_AFFILIATE",
  "LEVEL_BONUS",
  "CREATOR_EARNING",
  "PLATFORM_FEE",
  "WITHDRAWAL",
  "WITHDRAWAL_REVERSAL",
  "ADJUSTMENT",
  "PLAN_PURCHASE",
] as const;
export type WalletTransactionType = (typeof WALLET_TYPES)[number];

export const WALLET_TYPE_LABEL: Record<WalletTransactionType, string> = {
  SALE_COMMISSION: "Comisión de venta",
  DIRECT_AFFILIATE: "Afiliado directo",
  LEVEL_BONUS: "Bono de nivel",
  CREATOR_EARNING: "Ganancia creator",
  PLATFORM_FEE: "Comisión Crow",
  WITHDRAWAL: "Retiro",
  WITHDRAWAL_REVERSAL: "Retiro revertido",
  ADJUSTMENT: "Ajuste",
  PLAN_PURCHASE: "Plan creator",
};

export const CREATOR_PLAN_IDS = [
  "START",
  "BASIC",
  "PRO",
  "BUSINESS",
  "ELITE",
  "ELITE_PLUS",
] as const;
export type CreatorPlanId = (typeof CREATOR_PLAN_IDS)[number];

export type AffiliatePlan = {
  minimumWithdrawalUsdt: number;
  dailyWithdrawalFee: number;
  monthlyWithdrawalFee: number;
  withdrawalMode: "MANUAL_APPROVAL";
};

export const COVER_GRADIENTS = [
  "violet",
  "aurora",
  "ember",
  "ocean",
  "mono",
] as const;
export type CoverGradient = (typeof COVER_GRADIENTS)[number];

export const COVER_GRADIENT_CLASS: Record<CoverGradient, string> = {
  violet:
    "from-[#6A00FF] via-[#3D0099] to-[#0B0B0B]",
  aurora:
    "from-[#8B3DFF] via-[#4A00B4] to-[#07131E]",
  ember: "from-[#FF6A3D] via-[#8B1E3F] to-[#12060B]",
  ocean: "from-[#2E7BFF] via-[#0B3A8B] to-[#050B18]",
  mono: "from-[#2A2A34] via-[#16161C] to-[#0B0B0B]",
};

export function coverGradientClass(value: string | null | undefined) {
  const key = (COVER_GRADIENT_CLASS as Record<string, string>)[value ?? ""];
  return key ?? COVER_GRADIENT_CLASS.violet;
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}