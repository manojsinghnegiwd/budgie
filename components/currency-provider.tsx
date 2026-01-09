"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { formatCurrency, type Currency } from "@/lib/utils";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  conversionRate: number;
  formatCurrencyAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
  initialConversionRate: number;
  initialCurrency?: Currency;
}

export function CurrencyProvider({
  children,
  initialConversionRate,
  initialCurrency = "INR",
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [conversionRate] = useState(initialConversionRate);

  useEffect(() => {
    // Sync with localStorage for backward compatibility
    const savedCurrency = localStorage.getItem("currency") as Currency | null;
    if (savedCurrency && (savedCurrency === "INR" || savedCurrency === "USD")) {
      if (savedCurrency !== initialCurrency) {
        // If localStorage differs from DB, use DB value (source of truth)
        localStorage.setItem("currency", initialCurrency);
      }
    } else {
      // If not in localStorage, set it from the DB value
      localStorage.setItem("currency", initialCurrency);
    }
  }, [initialCurrency]);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, currency, conversionRate);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        conversionRate,
        formatCurrencyAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

