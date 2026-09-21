import type { PrismaClient } from "@prisma/client";

import { createUser } from "./seed-helpers";
import { getCreatorPlan, planExpiryFrom } from "../src/lib/plans";

/** Creates the demo users, creator plans, affiliate tree, referrals and buyers. */
export async function seedPeople(prisma: PrismaClient) {
  const admin = await createUser(prisma, {
    name: "CROW Admin",
    email: "admin@crow.market",
    roles: ["ADMIN", "BUYER"],
  });

  const creators = [
    await createUser(prisma, {
      name: "Laura Méndez",
      email: "creator@crow.market",
      roles: ["CREATOR", "BUYER"],
    }),
    await createUser(prisma, {
      name: "Diego Ferrer",
      email: "creator2@crow.market",
      roles: ["CREATOR", "BUYER"],
    }),
    await createUser(prisma, {
      name: "Sofía Ramírez",
      email: "creator3@crow.market",
      roles: ["CREATOR", "BUYER"],
    }),
  ];

  const planIds = ["PRO", "BASIC", "START"] as const;
  for (const [index, creator] of creators.entries()) {
    const plan = getCreatorPlan(planIds[index]);
    await prisma.creatorSubscription.create({
      data: {
        userId: creator.id,
        plan: plan.id,
        priceUsdt: plan.priceUsdt,
        productLimit: plan.productLimit,
        publishedLimit: plan.publishedLimit,
        expiresAt: planExpiryFrom(new Date(), plan.durationDays),
      },
    });
  }

  const affiliateUsers = [
    await createUser(prisma, {
      name: "Marco Aguilar",
      email: "affiliate@crow.market",
      roles: ["AFFILIATE", "BUYER"],
    }),
    await createUser(prisma, {
      name: "Elena Costa",
      email: "affiliate2@crow.market",
      roles: ["AFFILIATE", "BUYER"],
    }),
    await createUser(prisma, {
      name: "Ramiro Silva",
      email: "affiliate3@crow.market",
      roles: ["AFFILIATE", "BUYER"],
    }),
  ];

  // Downline demo: Marco (raíz) → Elena (L1) → Ramiro (L2)
  const root = await prisma.affiliate.create({
    data: {
      userId: affiliateUsers[0].id,
      referralCode: "MARCO88",
      clicks: 184,
      level1Unlocked: true,
    },
  });

  const mid = await prisma.affiliate.create({
    data: {
      userId: affiliateUsers[1].id,
      referralCode: "ELENA77",
      clicks: 96,
      parentAffiliateId: root.id,
    },
  });

  await prisma.affiliate.create({
    data: {
      userId: affiliateUsers[2].id,
      referralCode: "RAMIRO66",
      clicks: 41,
      parentAffiliateId: mid.id,
    },
  });

  const buyers = [
    await createUser(prisma, {
      name: "Ana Torres",
      email: "buyer@crow.market",
      roles: ["BUYER"],
    }),
    await createUser(prisma, {
      name: "Javier Peña",
      email: "buyer2@crow.market",
      roles: ["BUYER"],
    }),
  ];

  await prisma.referral.createMany({
    data: [
      { affiliateId: root.id, code: "MARCO88", invitedEmail: "buyer@crow.market" },
      { affiliateId: mid.id, code: "ELENA77", invitedEmail: "buyer2@crow.market" },
    ],
  });

  return {
    admin,
    creators,
    affiliateUsers,
    root,
    mid,
    buyers,
    /** direct affiliate + parents, index 0 = direct affiliate */
    upline: [root.userId, mid.userId, affiliateUsers[2].id],
  };
}