import type { ActiveLocale } from "@bandinghidup/core";

export function getCurrencyLocale(locale: ActiveLocale): string {
  switch (locale) {
    case "de":
      return "de-DE";
    case "ja":
      return "ja-JP";
    case "id":
      return "id-ID";
    case "en":
    default:
      return "en-US";
  }
}

export function formatMoney(
  amountMajor: number,
  currencyOrCountry: string,
  locale: ActiveLocale,
  maxFractionDigits: number = 0
): string {
  const loc = getCurrencyLocale(locale);
  let currencyCode = currencyOrCountry.trim();
  if (currencyCode === "DE" || currencyCode === "€") currencyCode = "EUR";
  else if (currencyCode === "JP" || currencyCode === "¥") currencyCode = "JPY";
  else if (currencyCode === "ID" || currencyCode === "Rp" || currencyCode === "Rp ") currencyCode = "IDR";
  else if (currencyCode === "US" || currencyCode === "$") currencyCode = "USD";

  const isNeg = amountMajor < 0;
  const absAmount = Math.abs(amountMajor);

  let formatted = "";
  if (["EUR", "JPY", "IDR", "USD"].includes(currencyCode)) {
    formatted = new Intl.NumberFormat(loc, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: maxFractionDigits,
    }).format(Math.round(absAmount));
  } else {
    formatted = `${currencyOrCountry}${Math.round(absAmount).toLocaleString(loc)}`;
  }

  return isNeg ? `−${formatted}` : formatted;
}
