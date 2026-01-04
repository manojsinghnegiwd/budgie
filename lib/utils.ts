import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Currency = "INR" | "USD";

export function formatCurrency(
  amount: number,
  currency: Currency,
  conversionRate: number = 83.0
): string {
  let displayAmount = amount;

  if (currency === "USD") {
    displayAmount = amount / conversionRate;
  }

  const formatted = displayAmount.toFixed(2);

  if (currency === "INR") {
    return `₹${formatted}`;
  } else {
    return `$${formatted}`;
  }
}
