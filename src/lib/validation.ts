import { z } from "zod";

import { ROLES } from "@/lib/domain";

export const registerSchema = z.object({
  name: z.string().min(2, "Escribe tu nombre").max(80),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  roles: z.array(z.enum(ROLES)).min(1).default(["BUYER"]),
  referralCode: z.string().optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const productDraftSchema = z.object({
  title: z.string().min(4).max(140),
  shortDescription: z.string().min(10).max(180),
  description: z.string().min(40),
  type: z.enum(["COURSE", "EBOOK", "PDF", "INTERACTIVE_WEB", "RESOURCE_KIT"]),
  category: z.string().min(2),
  priceUsdt: z.coerce.number().min(0).max(9999),
  coverEmoji: z.string().max(8).default("◆"),
  coverGradient: z.string().min(2).default("violet"),
});

export const withdrawalSchema = z.object({
  amountUsdt: z.coerce.number().min(25, "El mínimo de retiro es 25 USDT"),
  address: z
    .string()
    .min(10, "Dirección BEP-20 inválida")
    .max(80, "Dirección BEP-20 inválida"),
  method: z.enum(["USDT_BEP20"]).default("USDT_BEP20"),
  note: z.string().max(240).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(4).max(600),
});

export const checkoutSchema = z.object({
  productId: z.string().min(1),
  referralCode: z.string().optional().or(z.literal("")),
});

export const blueprintPatchSchema = z.object({
  title: z.string().min(3).optional(),
  shortDescription: z.string().min(10).optional(),
  description: z.string().min(20).optional(),
  audience: z.string().optional(),
  promise: z.string().optional(),
  productType: z
    .enum(["COURSE", "EBOOK", "PDF", "INTERACTIVE_WEB", "RESOURCE_KIT"])
    .optional(),
  category: z.string().optional(),
  recommendedPriceUsdt: z.coerce.number().min(0).max(9999).optional(),
  modules: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().default(""),
        lessons: z
          .array(
            z.object({
              title: z.string().min(1),
              content: z.string().default(""),
              durationMin: z.coerce.number().int().min(1).max(600).default(20),
              imagePrompt: z.string().optional().default(""),
              videoUrl: z.string().optional().default(""),
              isFreePreview: z.boolean().default(false),
              exercises: z
                .array(
                  z.object({
                    title: z.string().min(1),
                    instructions: z.string().default(""),
                    kind: z
                      .enum(["PRACTICE", "QUIZ", "PROJECT"])
                      .default("PRACTICE"),
                  }),
                )
                .default([]),
            }),
          )
          .default([]),
      }),
    )
    .optional(),
});

export const studioChatSchema = z.object({
  message: z.string().min(2).max(2000),
  blueprint: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = { ok: false };

export function zodToFieldErrors(
  error: z.ZodError,
): Record<string, string[] | undefined> {
  return error.flatten().fieldErrors;
}