"use server";

import { prisma } from "@/lib/prisma";
import { type Currency } from "@/lib/utils";

export async function getSettings() {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        usdConversionRate: 83.0,
        currency: "INR",
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

export async function getCurrency(): Promise<Currency> {
  const settings = await getSettings();
  return (settings.currency as Currency) || "INR";
}

export async function updateCurrency(currency: Currency) {
  if (currency !== "INR" && currency !== "USD") {
    throw new Error("Currency must be either INR or USD");
  }

  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        currency,
      },
    });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        currency,
      },
    });
  }

  return settings;
}

export async function updateBudgetCarryover(enabled: boolean) {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        enableBudgetCarryover: enabled,
      },
    });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        enableBudgetCarryover: enabled,
      },
    });
  }

  return settings;
}

