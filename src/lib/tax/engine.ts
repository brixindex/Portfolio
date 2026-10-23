/**
 * On-device ATO worksheets for a family share portfolio.
 * Figures are preparation estimates, not a lodgement and not tax advice.
 *
 * Rounding: reported dollar amounts are half-up to the cent.
 * Discount test follows the product spec: disposal date − acquisition date > 365 days.
 * Loss offset: current and carried-forward losses reduce gross gains before the
 * 50% discount, and they exhaust non-discount gains first (taxpayer-favourable
 * ordering the ATO permits).
 */

export type OwnerType = "Individual" | "Minor_Designated" | "Minor_Direct";
export type TxType =
  | "BUY"
  | "SELL"
  | "DIVIDEND_CASH"
  | "DIVIDEND_DRP"
  | "SPLIT"
  | "RETURN_OF_CAPITAL";
export type AssetClass = "AU Equities" | "Intl Equities" | "REITs" | "Cash";
export type CgtMethod = "FIFO" | "LIFO" | "MIN_TAX";
export type TfnStatus = "Quoted" | "Not quoted";

export type Account = {
  id: string;
  name: string;
  ownerType: OwnerType;
  tfnStatus: TfnStatus;
};

export type Security = {
  ticker: string;
  name: string;
  gicsSector: string;
  assetClass: AssetClass;
  exchange: string;
  companyTaxRate: number;
  lastPrice: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  ticker: string;
  type: TxType;
  tradeDate: string;
  units: number;
  price: number;
  brokerage: number;
  totalAud: number;
  unfrankedAud: number;
  frankedAud: number;
  companyTaxRate: number;
  drpPrice: number;
  splitRatio: number;
  note: string;
};

export type BenchmarkRates = {
  au: number;
  intl: number;
  reit: number;
  cash: number;
};

export type Settings = {
  cgtMethod: CgtMethod;
  financialYear: string;
  valuationDate: string;
  benchmarkRates: BenchmarkRates;
  /** Positive dollars of capital losses from before the first ledger event, by account. */
  openingLosses: Record<string, number>;
};

export type Portfolio = {
  version: 1;
  accounts: Account[];
  securities: Security[];
  transactions: Transaction[];
  settings: Settings;
};

export type Warning = {
  txId: string;
  code: "OVERSELL" | "NO_HOLDING" | "BAD_SPLIT" | "BAD_PRICE" | "AFTER_VALUATION" | "UNKNOWN";
  message: string;
};

export type Parcel = {
  id: string;
  accountId: string;
  ticker: string;
  acquisitionDate: string;
  unitsRemaining: number;
  totalCostBase: number;
  source: "BUY" | "DRP";
  sourceTxId: string;
};

export type DividendLine = {
  txId: string;
  accountId: string;
  ticker: string;
  paymentDate: string;
  unfranked: number;
  franked: number;
  frankingCredit: number;
  gross: number;
  cash: number;
  isDrp: boolean;
  drpUnits: number;
  drpPrice: number;
  residualAfter: number;
};

export type DisposalLine = {
  id: string;
  txId: string;
  accountId: string;
  ticker: string;
  acquisitionDate: string;
  disposalDate: string;
  units: number;
  costBase: number;
  proceeds: number;
  grossGain: number;
  daysHeld: number;
  discountEligible: boolean;
  kind: "SELL" | "G1";
};

export type Simulation = {
  warnings: Warning[];
  parcels: Parcel[];
  residuals: { accountId: string; ticker: string; cash: number }[];
  dividends: DividendLine[];
  disposals: DisposalLine[];
  /** DRP units created, keyed by transaction id. */
  drpUnitsByTx: Record<string, number>;
};

export type LossApplication = {
  discountableGross: number;
  nonDiscountableGross: number;
  currentYearLosses: number;
  lossesCarriedIn: number;
  lossesAppliedToNonDiscount: number;
  lossesAppliedToDiscount: number;
  discountableRemaining: number;
  nonDiscountableRemaining: number;
  discountAmount: number;
  netCapitalGain: number;
  lossesCarriedForward: number;
};

export type SourceSlice = {
  accountId: string;
  unfranked: number;
  franked: number;
  frankingCredits: number;
  gross: number;
  discountableGains: number;
  otherGains: number;
  losses: number;
};

export type MinorBand = "nil" | "penalty66" | "top45";

export type EntityReport = {
  entityAccountId: string;
  ownerType: OwnerType;
  includesAccountIds: string[];
  unfranked: number;
  franked: number;
  frankingCredits: number;
  grossDividends: number;
  sources: SourceSlice[];
  cgt: LossApplication;
  disposals: DisposalLine[];
  minor: {
    applies: boolean;
    eligibleIncome: number;
    band: MinorBand;
    illustrativeTax: number;
    roomTo416: number;
    roomTo1307: number;
  } | null;
};

export type Position = {
  accountId: string;
  ticker: string;
  name: string;
  gicsSector: string;
  assetClass: AssetClass;
  units: number;
  costBase: number;
  lastPrice: number;
  marketValue: number;
  unrealised: number;
  benchmarkValue: number;
  discountReadyUnits: number;
  parcels: Parcel[];
};

const TYPE_ORDER: Record<TxType, number> = {
  SPLIT: 0,
  RETURN_OF_CAPITAL: 1,
  BUY: 2,
  DIVIDEND_DRP: 3,
  DIVIDEND_CASH: 4,
  SELL: 5,
};

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100 + (n >= 0 ? 1e-8 : -1e-8)) / 100;
}

export function roundUnits(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 1e6) / 1e6;
  return Math.abs(r) < 1e-8 ? 0 : r;
}

export function daysBetween(earlier: string, later: string): number {
  const [ay, am, ad] = earlier.split("-").map(Number);
  const [by, bm, bd] = later.split("-").map(Number);
  if (!ay || !am || !ad || !by || !bm || !bd) return 0;
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86_400_000);
}

export function discountEligible(acquisitionDate: string, disposalDate: string): boolean {
  return daysBetween(acquisitionDate, disposalDate) > 365;
}

/** Franking credit = franked × (company tax rate / (1 − company tax rate)). */
export function frankingCredit(frankedAud: number, companyTaxRate: number): number {
  if (!(frankedAud > 0) || !(companyTaxRate > 0) || companyTaxRate >= 1) return 0;
  if (Math.abs(companyTaxRate - 0.3) < 1e-9) return (frankedAud * 3) / 7;
  if (Math.abs(companyTaxRate - 0.25) < 1e-9) return frankedAud / 3;
  return frankedAud * (companyTaxRate / (1 - companyTaxRate));
}

export function grossDividend(unfranked: number, franked: number, credit: number): number {
  return unfranked + franked + credit;
}

/**
 * DRP units are whole hundredths of a basis point (4 d.p.), rounded down so the
 * plan never spends more cash than was available. Leftover cash carries forward.
 */
export function drpAllocation(
  cashAvailable: number,
  drpPrice: number,
): { units: number; spent: number; residual: number } {
  if (!(drpPrice > 0) || !(cashAvailable > 0)) {
    return { units: 0, spent: 0, residual: Math.max(0, cashAvailable) };
  }
  const units = Math.floor((cashAvailable / drpPrice) * 10_000 + 1e-4) / 10_000;
  const spent = units * drpPrice;
  const residual = cashAvailable - spent;
  return { units: roundUnits(units), spent, residual: Math.max(0, residual) };
}

export function dateToFy(iso: string): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  if (!y || !m) return "1970-71";
  const start = m >= 7 ? y : y - 1;
  return formatFy(start);
}

export function formatFy(startYear: number): string {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function fyLabel(fy: string): string {
  const start = Number(fy.slice(0, 4));
  if (!start) return fy;
  return `FY ${fy} · 1 Jul ${start} – 30 Jun ${start + 1}`;
}

export function legalEntityId(account: Account, accounts: Account[]): string {
  if (account.ownerType === "Minor_Designated") {
    const adult = accounts.find((a) => a.ownerType === "Individual");
    return adult?.id ?? account.id;
  }
  return account.id;
}

export function applyCapitalLosses(input: {
  discountableGross: number;
  nonDiscountableGross: number;
  currentYearLosses: number;
  carriedIn: number;
}): LossApplication {
  let nonDisc = Math.max(0, input.nonDiscountableGross);
  let disc = Math.max(0, input.discountableGross);
  let losses = Math.max(0, input.currentYearLosses) + Math.max(0, input.carriedIn);

  const toNon = Math.min(losses, nonDisc);
  nonDisc -= toNon;
  losses -= toNon;
  const toDisc = Math.min(losses, disc);
  disc -= toDisc;
  losses -= toDisc;

  const discountAmount = round2(disc * 0.5);
  const netCapitalGain = round2(round2(nonDisc) + discountAmount);

  return {
    discountableGross: round2(Math.max(0, input.discountableGross)),
    nonDiscountableGross: round2(Math.max(0, input.nonDiscountableGross)),
    currentYearLosses: round2(Math.max(0, input.currentYearLosses)),
    lossesCarriedIn: round2(Math.max(0, input.carriedIn)),
    lossesAppliedToNonDiscount: round2(toNon),
    lossesAppliedToDiscount: round2(toDisc),
    discountableRemaining: round2(disc),
    nonDiscountableRemaining: round2(nonDisc),
    discountAmount,
    netCapitalGain,
    lossesCarriedForward: round2(losses),
  };
}

export function minorUnearnedTax(eligibleIncome: number): {
  band: MinorBand;
  illustrativeTax: number;
  roomTo416: number;
  roomTo1307: number;
} {
  const income = round2(Math.max(0, eligibleIncome));
  const cents = Math.round(income * 100);
  if (cents <= 41_600) {
    return {
      band: "nil",
      illustrativeTax: 0,
      roomTo416: round2(416 - income),
      roomTo1307: round2(1307 - income),
    };
  }
  if (cents <= 130_700) {
    return {
      band: "penalty66",
      illustrativeTax: Math.round((cents - 41_600) * 0.66) / 100,
      roomTo416: 0,
      roomTo1307: round2(1307 - income),
    };
  }
  return {
    band: "top45",
    illustrativeTax: Math.round(cents * 0.45) / 100,
    roomTo416: 0,
    roomTo1307: 0,
  };
}

function emptyTx(): Transaction {
  return {
    id: "",
    accountId: "",
    ticker: "",
    type: "BUY",
    tradeDate: "",
    units: 0,
    price: 0,
    brokerage: 0,
    totalAud: 0,
    unfrankedAud: 0,
    frankedAud: 0,
    companyTaxRate: 0.3,
    drpPrice: 0,
    splitRatio: 0,
    note: "",
  };
}

export function tradeTotal(tx: Pick<Transaction, "type" | "units" | "price" | "brokerage" | "unfrankedAud" | "frankedAud">): number {
  if (tx.type === "BUY") return round2(tx.units * tx.price + tx.brokerage);
  if (tx.type === "SELL") return round2(tx.units * tx.price - tx.brokerage);
  if (tx.type === "DIVIDEND_CASH" || tx.type === "DIVIDEND_DRP") return round2(tx.unfrankedAud + tx.frankedAud);
  if (tx.type === "RETURN_OF_CAPITAL") return round2(tx.units * tx.price);
  return 0;
}

export function blankTransaction(partial: Partial<Transaction>): Transaction {
  return { ...emptyTx(), ...partial, id: partial.id ?? "" };
}

function unitCost(p: Parcel): number {
  if (p.unitsRemaining <= 1e-9) return 0;
  return p.totalCostBase / p.unitsRemaining;
}

function assessablePerUnit(p: Parcel, proceedsPerUnit: number, disposalDate: string): number {
  const gain = proceedsPerUnit - unitCost(p);
  if (gain > 0 && discountEligible(p.acquisitionDate, disposalDate)) return gain * 0.5;
  return gain;
}

export function simulate(portfolio: Portfolio, method: CgtMethod): Simulation {
  const warnings: Warning[] = [];
  const parcels: Parcel[] = [];
  const dividends: DividendLine[] = [];
  const disposals: DisposalLine[] = [];
  const drpUnitsByTx: Record<string, number> = {};
  const residual = new Map<string, number>();
  const asOf = portfolio.settings.valuationDate;
  const knownAccounts = new Set(portfolio.accounts.map((a) => a.id));
  const knownTickers = new Set(portfolio.securities.map((s) => s.ticker));

  const txs = [...portfolio.transactions].sort((a, b) => {
    if (a.tradeDate !== b.tradeDate) return a.tradeDate < b.tradeDate ? -1 : 1;
    const order = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    if (order) return order;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const keyOf = (accountId: string, ticker: string) => `${accountId}|${ticker}`;

  const holdings = (accountId: string, ticker: string) =>
    parcels.filter((p) => p.accountId === accountId && p.ticker === ticker && p.unitsRemaining > 1e-8);

  for (const tx of txs) {
    if (!knownAccounts.has(tx.accountId) || !knownTickers.has(tx.ticker)) {
      warnings.push({
        txId: tx.id,
        code: "UNKNOWN",
        message: "Event skipped because the account or ticker is not on the ledger.",
      });
      continue;
    }
    if (asOf && tx.tradeDate > asOf) {
      warnings.push({
        txId: tx.id,
        code: "AFTER_VALUATION",
        message: "Dated after the valuation date, so it is excluded from holdings and tax worksheets.",
      });
      continue;
    }

    if (tx.type === "BUY") {
      if (!(tx.units > 0) || !(tx.price >= 0)) {
        warnings.push({ txId: tx.id, code: "BAD_PRICE", message: "Buy needs a positive unit count." });
        continue;
      }
      const total = tx.units * tx.price + Math.max(0, tx.brokerage);
      parcels.push({
        id: `buy-${tx.id}`,
        accountId: tx.accountId,
        ticker: tx.ticker,
        acquisitionDate: tx.tradeDate,
        unitsRemaining: roundUnits(tx.units),
        totalCostBase: total,
        source: "BUY",
        sourceTxId: tx.id,
      });
      continue;
    }

    if (tx.type === "SPLIT") {
      const ratio = tx.splitRatio;
      const open = holdings(tx.accountId, tx.ticker);
      if (!(ratio > 0) || ratio === 1) {
        warnings.push({ txId: tx.id, code: "BAD_SPLIT", message: "Split ratio must be a positive number other than 1." });
        continue;
      }
      if (open.length === 0) {
        warnings.push({ txId: tx.id, code: "NO_HOLDING", message: "Split ignored — no units were held on that date." });
        continue;
      }
      for (const p of open) {
        p.unitsRemaining = roundUnits(p.unitsRemaining * ratio);
      }
      continue;
    }

    if (tx.type === "RETURN_OF_CAPITAL") {
      const perUnit = tx.price;
      const open = holdings(tx.accountId, tx.ticker);
      if (!(perUnit > 0)) {
        warnings.push({ txId: tx.id, code: "BAD_PRICE", message: "Capital return needs an amount per unit." });
        continue;
      }
      if (open.length === 0) {
        warnings.push({ txId: tx.id, code: "NO_HOLDING", message: "Capital return ignored — no units were held." });
        continue;
      }
      open.forEach((p, index) => {
        const wanted = p.unitsRemaining * perUnit;
        const applied = Math.min(p.totalCostBase, wanted);
        const excess = wanted - applied;
        p.totalCostBase -= applied;
        if (p.totalCostBase < 1e-8) p.totalCostBase = 0;
        if (excess > 0.000001) {
          disposals.push({
            id: `${tx.id}:${p.id}:${index}`,
            txId: tx.id,
            accountId: tx.accountId,
            ticker: tx.ticker,
            acquisitionDate: p.acquisitionDate,
            disposalDate: tx.tradeDate,
            units: 0,
            costBase: 0,
            proceeds: excess,
            grossGain: excess,
            daysHeld: daysBetween(p.acquisitionDate, tx.tradeDate),
            discountEligible: discountEligible(p.acquisitionDate, tx.tradeDate),
            kind: "G1",
          });
        }
      });
      continue;
    }

    if (tx.type === "DIVIDEND_CASH" || tx.type === "DIVIDEND_DRP") {
      const unfranked = Math.max(0, tx.unfrankedAud);
      const franked = Math.max(0, tx.frankedAud);
      const credit = frankingCredit(franked, tx.companyTaxRate);
      const cash = unfranked + franked;
      const mapKey = keyOf(tx.accountId, tx.ticker);
      let drpUnits = 0;
      let drpPrice = 0;
      let residualAfter = residual.get(mapKey) ?? 0;

      if (tx.type === "DIVIDEND_DRP") {
        drpPrice = tx.drpPrice;
        if (!(drpPrice > 0)) {
          warnings.push({
            txId: tx.id,
            code: "BAD_PRICE",
            message: "DRP has no issue price. The dividend is still income; no units were created.",
          });
        } else {
          const available = cash + residualAfter;
          const alloc = drpAllocation(available, drpPrice);
          drpUnits = alloc.units;
          residualAfter = alloc.residual;
          residual.set(mapKey, residualAfter);
          if (drpUnits > 0) {
            parcels.push({
              id: `drp-${tx.id}`,
              accountId: tx.accountId,
              ticker: tx.ticker,
              acquisitionDate: tx.tradeDate,
              unitsRemaining: drpUnits,
              totalCostBase: alloc.spent,
              source: "DRP",
              sourceTxId: tx.id,
            });
          }
        }
        drpUnitsByTx[tx.id] = drpUnits;
      }

      dividends.push({
        txId: tx.id,
        accountId: tx.accountId,
        ticker: tx.ticker,
        paymentDate: tx.tradeDate,
        unfranked,
        franked,
        frankingCredit: credit,
        gross: grossDividend(unfranked, franked, credit),
        cash,
        isDrp: tx.type === "DIVIDEND_DRP",
        drpUnits,
        drpPrice,
        residualAfter,
      });
      continue;
    }

    if (tx.type === "SELL") {
      if (!(tx.units > 0)) {
        warnings.push({ txId: tx.id, code: "BAD_PRICE", message: "Sell needs a positive unit count." });
        continue;
      }
      const open = holdings(tx.accountId, tx.ticker);
      const available = open.reduce((s, p) => s + p.unitsRemaining, 0);
      const sellUnits = Math.min(tx.units, available);
      if (sellUnits + 1e-8 < tx.units) {
        warnings.push({
          txId: tx.id,
          code: "OVERSELL",
          message: `Only ${roundUnits(available)} units were open. The excess was not matched.`,
        });
      }
      if (!(sellUnits > 0)) continue;

      const proceedsTotal = sellUnits * tx.price - Math.max(0, tx.brokerage) * (sellUnits / tx.units);
      const proceedsPerUnit = proceedsTotal / sellUnits;
      const ordered = [...open];
      if (method === "FIFO") {
        ordered.sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate) || a.id.localeCompare(b.id));
      } else if (method === "LIFO") {
        ordered.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate) || b.id.localeCompare(a.id));
      } else {
        ordered.sort((a, b) => {
          const diff =
            assessablePerUnit(a, proceedsPerUnit, tx.tradeDate) -
            assessablePerUnit(b, proceedsPerUnit, tx.tradeDate);
          if (Math.abs(diff) > 1e-9) return diff;
          return a.acquisitionDate.localeCompare(b.acquisitionDate) || a.id.localeCompare(b.id);
        });
      }

      let left = sellUnits;
      for (const p of ordered) {
        if (left <= 1e-8) break;
        const take = Math.min(p.unitsRemaining, left);
        const cost = unitCost(p) * take;
        const sliceProceeds = proceedsTotal * (take / sellUnits);
        p.unitsRemaining = roundUnits(p.unitsRemaining - take);
        p.totalCostBase -= cost;
        if (p.unitsRemaining === 0 || p.totalCostBase < 1e-8) p.totalCostBase = Math.max(0, p.totalCostBase);
        if (p.unitsRemaining === 0) p.totalCostBase = 0;
        left -= take;
        disposals.push({
          id: `${tx.id}:${p.id}`,
          txId: tx.id,
          accountId: tx.accountId,
          ticker: tx.ticker,
          acquisitionDate: p.acquisitionDate,
          disposalDate: tx.tradeDate,
          units: roundUnits(take),
          costBase: cost,
          proceeds: sliceProceeds,
          grossGain: sliceProceeds - cost,
          daysHeld: daysBetween(p.acquisitionDate, tx.tradeDate),
          discountEligible: discountEligible(p.acquisitionDate, tx.tradeDate),
          kind: "SELL",
        });
      }
    }
  }

  const residuals = [...residual.entries()]
    .filter(([, cash]) => cash > 0.000001)
    .map(([key, cash]) => {
      const [accountId, ticker] = key.split("|");
      return { accountId: accountId ?? "", ticker: ticker ?? "", cash };
    });

  return {
    warnings,
    parcels: parcels.filter((p) => p.unitsRemaining > 1e-8),
    residuals,
    dividends,
    disposals,
    drpUnitsByTx,
  };
}

function sumGainBuckets(lines: DisposalLine[]): {
  discountable: number;
  nonDiscountable: number;
  losses: number;
} {
  let discountable = 0;
  let nonDiscountable = 0;
  let losses = 0;
  for (const line of lines) {
    if (line.grossGain < 0) losses += -line.grossGain;
    else if (line.discountEligible) discountable += line.grossGain;
    else nonDiscountable += line.grossGain;
  }
  return { discountable, nonDiscountable, losses };
}

export function reportForFy(sim: Simulation, portfolio: Portfolio, fy: string): EntityReport[] {
  const accounts = portfolio.accounts;
  const groups = new Map<string, string[]>();
  for (const account of accounts) {
    const entity = legalEntityId(account, accounts);
    const list = groups.get(entity) ?? [];
    list.push(account.id);
    groups.set(entity, list);
  }

  const reports: EntityReport[] = [];
  for (const [entityAccountId, includesAccountIds] of groups) {
    const entity = accounts.find((a) => a.id === entityAccountId);
    if (!entity) continue;
    const member = new Set(includesAccountIds);

    const dates = [
      ...sim.disposals.filter((d) => member.has(d.accountId)).map((d) => d.disposalDate),
      ...sim.dividends.filter((d) => member.has(d.accountId)).map((d) => d.paymentDate),
    ];
    let minFy = fy;
    for (const date of dates) {
      const eventFy = dateToFy(date);
      if (eventFy < minFy) minFy = eventFy;
    }
    const start = Number(minFy.slice(0, 4));
    const end = Number(fy.slice(0, 4));
    let carried = includesAccountIds.reduce((s, id) => s + Math.max(0, portfolio.settings.openingLosses[id] ?? 0), 0);

    let snapshot: LossApplication = applyCapitalLosses({
      discountableGross: 0,
      nonDiscountableGross: 0,
      currentYearLosses: 0,
      carriedIn: carried,
    });
    let yearDisposals: DisposalLine[] = [];
    let yearDividends: DividendLine[] = [];

    if (start <= end) {
      for (let y = start; y <= end; y++) {
        const year = formatFy(y);
        yearDisposals = sim.disposals.filter((d) => member.has(d.accountId) && dateToFy(d.disposalDate) === year);
        yearDividends = sim.dividends.filter((d) => member.has(d.accountId) && dateToFy(d.paymentDate) === year);
        const buckets = sumGainBuckets(yearDisposals);
        snapshot = applyCapitalLosses({
          discountableGross: buckets.discountable,
          nonDiscountableGross: buckets.nonDiscountable,
          currentYearLosses: buckets.losses,
          carriedIn: carried,
        });
        carried = snapshot.lossesCarriedForward;
      }
    }

    const sources: SourceSlice[] = includesAccountIds.map((accountId) => {
      const divs = yearDividends.filter((d) => d.accountId === accountId);
      const slices = yearDisposals.filter((d) => d.accountId === accountId);
      const buckets = sumGainBuckets(slices);
      return {
        accountId,
        unfranked: round2(divs.reduce((s, d) => s + d.unfranked, 0)),
        franked: round2(divs.reduce((s, d) => s + d.franked, 0)),
        frankingCredits: round2(divs.reduce((s, d) => s + d.frankingCredit, 0)),
        gross: round2(divs.reduce((s, d) => s + d.gross, 0)),
        discountableGains: round2(buckets.discountable),
        otherGains: round2(buckets.nonDiscountable),
        losses: round2(buckets.losses),
      };
    });

    const grossDividends = round2(sources.reduce((s, src) => s + src.gross, 0));
    const minor =
      entity.ownerType === "Minor_Direct"
        ? {
            applies: true,
            eligibleIncome: grossDividends,
            ...minorUnearnedTax(grossDividends),
          }
        : null;

    reports.push({
      entityAccountId,
      ownerType: entity.ownerType,
      includesAccountIds,
      unfranked: round2(sources.reduce((s, src) => s + src.unfranked, 0)),
      franked: round2(sources.reduce((s, src) => s + src.franked, 0)),
      frankingCredits: round2(sources.reduce((s, src) => s + src.frankingCredits, 0)),
      grossDividends,
      sources: sources.filter(
        (s) => s.gross > 0 || s.discountableGains > 0 || s.otherGains > 0 || s.losses > 0 || includesAccountIds.length === 1,
      ),
      cgt: snapshot,
      disposals: yearDisposals,
      minor,
    });
  }

  return reports;
}

function rateFor(assetClass: AssetClass, rates: BenchmarkRates): number {
  if (assetClass === "Intl Equities") return rates.intl;
  if (assetClass === "REITs") return rates.reit;
  if (assetClass === "Cash") return rates.cash;
  return rates.au;
}

export function buildPositions(sim: Simulation, portfolio: Portfolio): Position[] {
  const asOf = portfolio.settings.valuationDate;
  const byKey = new Map<string, Parcel[]>();
  for (const parcel of sim.parcels) {
    const key = `${parcel.accountId}|${parcel.ticker}`;
    const list = byKey.get(key) ?? [];
    list.push(parcel);
    byKey.set(key, list);
  }
  const positions: Position[] = [];
  for (const [key, parcels] of byKey) {
    const [accountId, ticker] = key.split("|");
    const security = portfolio.securities.find((s) => s.ticker === ticker);
    const units = roundUnits(parcels.reduce((s, p) => s + p.unitsRemaining, 0));
    const costBase = parcels.reduce((s, p) => s + p.totalCostBase, 0);
    const lastPrice = security?.lastPrice ?? 0;
    const marketValue = units * lastPrice;
    const rate = rateFor(security?.assetClass ?? "AU Equities", portfolio.settings.benchmarkRates);
    let benchmarkValue = 0;
    let discountReadyUnits = 0;
    for (const parcel of parcels) {
      const days = Math.max(0, daysBetween(parcel.acquisitionDate, asOf));
      const years = days / 365.25;
      benchmarkValue += parcel.totalCostBase * Math.pow(1 + rate, years);
      if (daysBetween(parcel.acquisitionDate, asOf) > 365) discountReadyUnits += parcel.unitsRemaining;
    }
    positions.push({
      accountId: accountId ?? "",
      ticker: ticker ?? "",
      name: security?.name ?? ticker ?? "",
      gicsSector: security?.gicsSector ?? "Unclassified",
      assetClass: security?.assetClass ?? "AU Equities",
      units,
      costBase,
      lastPrice,
      marketValue,
      unrealised: marketValue - costBase,
      benchmarkValue,
      discountReadyUnits: roundUnits(discountReadyUnits),
      parcels: [...parcels].sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate)),
    });
  }
  positions.sort((a, b) => b.marketValue - a.marketValue || a.ticker.localeCompare(b.ticker));
  return positions;
}

export function diversificationScore(weights: number[]): number {
  const clean = weights.filter((w) => w > 0);
  if (clean.length <= 1) return 0;
  const hhi = clean.reduce((s, w) => s + w * w, 0);
  const score = (1 - hhi) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function financialYearOptions(portfolio: Portfolio): string[] {
  const dates = portfolio.transactions.map((t) => t.tradeDate).filter(Boolean);
  dates.push(portfolio.settings.valuationDate);
  let min = Number(dateToFy(portfolio.settings.valuationDate).slice(0, 4));
  let max = min;
  for (const date of dates) {
    const y = Number(dateToFy(date).slice(0, 4));
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const list: string[] = [];
  for (let y = min; y <= max; y++) list.push(formatFy(y));
  return list.reverse();
}
