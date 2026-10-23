import { z } from "zod";
import { isSealedRecord, type SealedRecord } from "./vault.ts";

export const LEDGER_KEY = "helio.ledger.v1";
export const MAX_IMPORT_BYTES = 2_000_000;

const bannedKey = /^(tfn|taxfile|taxfilenumber|tax_file|tax_file_number|password|passphrase|secret|bsb|accountnumber|account_number)$/i;

const finite = z.number().finite();
const money = finite.min(0).max(1_000_000_000);
const ticker = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[A-Z0-9]+(\.[A-Z0-9]+)?$/, "Use an exchange code such as VAS.AX");

export const portfolioSchema = z.object({
  version: z.literal(1),
  accounts: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        name: z.string().trim().min(1).max(60),
        ownerType: z.enum(["Individual", "Minor_Designated", "Minor_Direct"]),
        tfnStatus: z.enum(["Quoted", "Not quoted"]),
      }),
    )
    .min(1)
    .max(12),
  securities: z
    .array(
      z.object({
        ticker,
        name: z.string().trim().min(1).max(80),
        gicsSector: z.string().trim().min(1).max(40),
        assetClass: z.enum(["AU Equities", "Intl Equities", "REITs", "Cash"]),
        exchange: z.string().trim().min(1).max(16),
        companyTaxRate: z.number().refine((n) => n === 0.25 || n === 0.3, "Use 25% or 30%"),
        lastPrice: money,
      }),
    )
    .max(200),
  transactions: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        accountId: z.string().min(1).max(40),
        ticker,
        type: z.enum(["BUY", "SELL", "DIVIDEND_CASH", "DIVIDEND_DRP", "SPLIT", "RETURN_OF_CAPITAL"]),
        tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        units: money,
        price: money,
        brokerage: money,
        totalAud: finite.min(-1_000_000_000).max(1_000_000_000),
        unfrankedAud: money,
        frankedAud: money,
        companyTaxRate: z.number().refine((n) => n === 0.25 || n === 0.3),
        drpPrice: money,
        splitRatio: finite.min(0).max(100),
        note: z.string().max(280),
      }),
    )
    .max(5000),
  settings: z.object({
    cgtMethod: z.enum(["FIFO", "LIFO", "MIN_TAX"]),
    financialYear: z.string().regex(/^\d{4}-\d{2}$/),
    valuationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    benchmarkRates: z.object({
      au: finite.min(-0.5).max(0.5),
      intl: finite.min(-0.5).max(0.5),
      reit: finite.min(-0.5).max(0.5),
      cash: finite.min(-0.5).max(0.5),
    }),
    openingLosses: z.record(z.string().max(40), money),
  }),
});

export type StoredPortfolio = z.infer<typeof portfolioSchema>;

function rejectSensitiveKeys(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const hit = rejectSensitiveKeys(entry);
      if (hit) return hit;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return "That file contains a blocked key.";
    if (bannedKey.test(key)) return "Tax file numbers, account numbers and passphrases are not stored.";
    const hit = rejectSensitiveKeys(entry);
    if (hit) return hit;
  }
  return null;
}

export function parsePortfolioJson(raw: unknown): { ok: true; portfolio: StoredPortfolio } | { ok: false; error: string } {
  const blocked = rejectSensitiveKeys(raw);
  if (blocked) return { ok: false, error: blocked };
  const parsed = portfolioSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "That file is not a Helio ledger." };
  const ids = new Set(parsed.data.accounts.map((a) => a.id));
  if (ids.size !== parsed.data.accounts.length) return { ok: false, error: "Account ids must be unique." };
  const tickers = new Set(parsed.data.securities.map((s) => s.ticker));
  if (tickers.size !== parsed.data.securities.length) return { ok: false, error: "Tickers must be unique." };
  if (!parsed.data.accounts.some((a) => a.ownerType === "Individual")) {
    return { ok: false, error: "Keep at least one individual account for trustee income." };
  }
  return { ok: true, portfolio: parsed.data };
}

export type Loaded =
  | { kind: "empty" }
  | { kind: "open"; portfolio: StoredPortfolio }
  | { kind: "sealed"; record: SealedRecord }
  | { kind: "corrupt"; message: string };

function isSealed(value: unknown): value is SealedRecord {
  return isSealedRecord(value);
}

export function readStorage(): Loaded {
  if (typeof localStorage === "undefined") return { kind: "empty" };
  const raw = localStorage.getItem(LEDGER_KEY);
  if (!raw) return { kind: "empty" };
  try {
    const json = JSON.parse(raw) as unknown;
    if (isSealed(json)) return { kind: "sealed", record: json };
    if (json && typeof json === "object" && (json as { kind?: string }).kind === "open") {
      const parsed = parsePortfolioJson((json as { portfolio?: unknown }).portfolio);
      if (!parsed.ok) return { kind: "corrupt", message: parsed.error };
      return { kind: "open", portfolio: parsed.portfolio };
    }
    return { kind: "corrupt", message: "The saved ledger could not be read." };
  } catch {
    return { kind: "corrupt", message: "The saved ledger could not be read." };
  }
}

export function writeOpen(portfolio: StoredPortfolio) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify({ kind: "open", portfolio }));
}

export function writeSealed(record: SealedRecord) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(record));
}

export function clearStorage() {
  localStorage.removeItem(LEDGER_KEY);
}

export type PersistenceMode = "sealed" | "plain" | "memory";

/** A live seal always wins. Otherwise a readable copy is written only after an explicit choice. */
export function persistenceMode(hasSession: boolean, plainStored: boolean): PersistenceMode {
  if (hasSession) return "sealed";
  if (plainStored) return "plain";
  return "memory";
}
