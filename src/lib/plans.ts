import type {
  AffiliatePlan,
  CreatorPlanId,
  ProductType,
} from "@/lib/domain";

export type CreatorPlan = {
  id: CreatorPlanId;
  name: string;
  priceUsdt: number;
  productLimit: number;
  publishedLimit: number;
  durationLabel: string;
  durationDays: number;
  tagline: string;
  highlight?: boolean;
  features: string[];
};

/**
 * CROW creator plans — commercial configuration is centralised here so that
 * limits enforced in the Creator Studio never drift from the pricing page.
 */
export const CREATOR_PLANS: CreatorPlan[] = [
  {
    id: "START",
    name: "Start",
    priceUsdt: 20,
    productLimit: 2,
    publishedLimit: 1,
    durationLabel: "30 días",
    durationDays: 30,
    tagline: "Da tu primer paso como creator",
    features: [
      "2 infoproductos",
      "1 producto publicado",
      "Creator Studio con IA",
      "Wallet y analytics básicos",
    ],
  },
  {
    id: "BASIC",
    name: "Basic",
    priceUsdt: 50,
    productLimit: 4,
    publishedLimit: 3,
    durationLabel: "2 meses",
    durationDays: 60,
    tagline: "Para validar tu oferta y escalar",
    features: [
      "4 infoproductos",
      "3 productos publicados",
      "Blueprint guardado e iterativo",
      "Certificados automáticos",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceUsdt: 100,
    productLimit: 10,
    publishedLimit: 5,
    durationLabel: "3 meses",
    durationDays: 90,
    tagline: "El plan del creator profesional",
    highlight: true,
    features: [
      "10 infoproductos",
      "5 productos publicados",
      "Analytics avanzado",
      "Recursos multimedia IA",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    priceUsdt: 300,
    productLimit: 20,
    publishedLimit: 10,
    durationLabel: "5 meses",
    durationDays: 150,
    tagline: "Escala por catálogo y por equipo",
    features: [
      "20 infoproductos",
      "10 productos publicados",
      "Multi-nicho y bundles",
      "Soporte prioritario",
    ],
  },
  {
    id: "ELITE",
    name: "Elite",
    priceUsdt: 500,
    productLimit: 50,
    publishedLimit: 30,
    durationLabel: "12 meses",
    durationDays: 365,
    tagline: "Máxima capacidad en CROW",
    features: [
      "50 infoproductos",
      "30 productos publicados",
      "Onboarding dedicado",
      "Early access a nuevas features",
    ],
  },
  {
    id: "ELITE_PLUS",
    name: "Elite+",
    priceUsdt: 1000,
    productLimit: 100,
    publishedLimit: 50,
    durationLabel: "18 meses",
    durationDays: 540,
    tagline: "Tope de la red creator CROW",
    features: [
      "100 infoproductos",
      "50 productos publicados",
      "Soporte dedicado VIP",
      "Acceso prioritario a lanzamientos",
    ],
  },
];

/**
 * Expiration date of a creator plan, calculated from its activation date.
 * Single source of truth for duration: uses durationDays so months are
 * expressed as 30-day periods consistently with the commercial table.
 */
export function planExpiryFrom(startDate: Date, durationDays: number): Date {
  return new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export function getCreatorPlan(id: string | null | undefined): CreatorPlan {
  return CREATOR_PLANS.find((plan) => plan.id === id) ?? CREATOR_PLANS[0];
}

export function getPlanById(id: CreatorPlanId) {
  return getCreatorPlan(id);
}

/** Suggested affiliate level progression labels used by the affiliate pages. */
export const AFFILIATE_PLAN: AffiliatePlan = {
  minimumWithdrawalUsdt: 25,
  dailyWithdrawalFee: 0.03,
  monthlyWithdrawalFee: 0.02,
  withdrawalMode: "MANUAL_APPROVAL",
};

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  COURSE: "Curso",
  EBOOK: "Ebook",
  PDF: "PDF",
  INTERACTIVE_WEB: "Web interactiva",
  RESOURCE_KIT: "Kit de recursos",
};