import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(n: number) {
  return formatMoney(n, "USD");
}

const LOCALE_FOR_CURRENCY: Record<string, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
  CHF: "de-CH",
};

export function formatMoney(n: number, currency: string = "USD") {
  const locale = LOCALE_FOR_CURRENCY[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: n < 100 ? 2 : 0,
  }).format(n);
}

export function pluralize(n: number, singular: string, plural?: string) {
  return n === 1 ? singular : plural ?? `${singular}s`;
}
