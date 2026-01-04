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
}

export function CurrencyProvider({
  children,
  initialConversionRate,
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>("INR");
  const [conversionRate] = useState(initialConversionRate);

  useEffect(() => {
    // Load currency preference from localStorage
    const savedCurrency = localStorage.getItem("currency") as Currency | null;
    if (savedCurrency === "INR" || savedCurrency === "USD") {
      setCurrency(savedCurrency);
    }
  }, []);

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

