import type { OwnerType, TxType } from "@/lib/tax/engine";
import { round2 } from "@/lib/tax/engine";

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return aud.format(round2(n));
}

export function moneySigned(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = round2(n);
  if (rounded > 0) return `+${aud.format(rounded)}`;
  return aud.format(rounded);
}

export function units(n: number): string {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 4 }).format(n);
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const value = n * 100;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function ownerLabel(owner: OwnerType): string {
  if (owner === "Individual") return "Individual";
  if (owner === "Minor_Designated") return "Minor · designated";
  return "Minor · own TFN";
}

export function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

export function txLabel(type: TxType): string {
  switch (type) {
    case "BUY":
      return "Buy";
    case "SELL":
      return "Sell";
    case "DIVIDEND_CASH":
      return "Cash dividend";
    case "DIVIDEND_DRP":
      return "DRP";
    case "SPLIT":
      return "Split";
    case "RETURN_OF_CAPITAL":
      return "Capital return";
  }
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Wide spread";
  if (score >= 60) return "Balanced";
  if (score >= 30) return "Building";
  return "Concentrated";
}
