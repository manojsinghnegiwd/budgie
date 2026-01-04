import { getSettings } from "@/app/actions/settings";
import { CurrencyProvider } from "./currency-provider";

export async function CurrencyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <CurrencyProvider initialConversionRate={settings.usdConversionRate}>
      {children}
    </CurrencyProvider>
  );
}

