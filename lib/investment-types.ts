// Investment type options for UI
export const INVESTMENT_TYPES = [
  { value: "stocks", label: "Stocks", color: "#3b82f6" },
  { value: "mutual_funds", label: "Mutual Funds", color: "#8b5cf6" },
  { value: "crypto", label: "Cryptocurrency", color: "#f59e0b" },
  { value: "fixed_deposit", label: "Fixed Deposit", color: "#10b981" },
  { value: "gold", label: "Gold", color: "#eab308" },
  { value: "real_estate", label: "Real Estate", color: "#ef4444" },
  { value: "bonds", label: "Bonds", color: "#06b6d4" },
  { value: "ppf", label: "PPF/EPF", color: "#84cc16" },
  { value: "other", label: "Other", color: "#6b7280" },
] as const;

export function getInvestmentTypeLabel(type: string): string {
  const found = INVESTMENT_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

export function getInvestmentTypeColor(type: string): string {
  const found = INVESTMENT_TYPES.find((t) => t.value === type);
  return found?.color || "#6b7280";
}
