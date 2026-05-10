export interface CurrencyConfig {
  currency: string;
  symbol: string;
  position: "before" | "after";
  rate: number; // approximate conversion rate from PLN
}

export const currencyByLocale: Record<string, CurrencyConfig> = {
  pl: { currency: "PLN", symbol: "zł", position: "after", rate: 1 },
  en: { currency: "USD", symbol: "$", position: "before", rate: 0.25 },
  de: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  fr: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  es: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  it: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  pt: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  nl: { currency: "EUR", symbol: "€", position: "before", rate: 0.23 },
  cs: { currency: "CZK", symbol: "Kč", position: "after", rate: 5.8 },
  uk: { currency: "UAH", symbol: "₴", position: "before", rate: 10.2 },
};

export function formatPrice(pricePln: number, locale: string): string {
  const config = currencyByLocale[locale] ?? currencyByLocale.pl;
  const converted = Math.round(pricePln * config.rate);
  return config.position === "before"
    ? `${config.symbol}${converted}`
    : `${converted} ${config.symbol}`;
}

export function getCurrencyConfig(locale: string): CurrencyConfig {
  return currencyByLocale[locale] ?? currencyByLocale.pl;
}
