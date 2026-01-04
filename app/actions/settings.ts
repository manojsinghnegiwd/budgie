"use server";

import { prisma } from "@/lib/prisma";

export async function getSettings() {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        usdConversionRate: 83.0,
      },
    });
  }

  return settings;
}

export async function updateUsdConversionRate(rate: number) {
  if (rate <= 0) {
    throw new Error("Conversion rate must be positive");
  }

  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        usdConversionRate: rate,
      },
    });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        usdConversionRate: rate,
      },
    });
  }

  return settings;
}

