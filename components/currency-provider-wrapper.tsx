import { getSettings } from "@/app/actions/settings";
import { CurrencyProvider } from "./currency-provider";
import { type Currency } from "@/lib/utils";

export async function CurrencyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <CurrencyProvider 
      initialConversionRate={settings.usdConversionRate}
      initialCurrency={(settings.currency as Currency) || "INR"}
    >
      {children}
    </CurrencyProvider>
  );
}

