import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCapitalLosses,
  blankTransaction,
  discountEligible,
  drpAllocation,
  frankingCredit,
  minorUnearnedTax,
  reportForFy,
  simulate,
  type Portfolio,
  type Transaction,
} from "./engine.ts";
import { emptyPortfolio, samplePortfolio } from "./sample.ts";

function cents(n: number): number {
  return Math.round(n * 100);
}

function portfolio(txs: Transaction[], method: Portfolio["settings"]["cgtMethod"] = "FIFO"): Portfolio {
  const accounts = [
    { id: "adult", name: "Adult", ownerType: "Individual" as const, tfnStatus: "Quoted" as const },
    { id: "des", name: "Kid designated", ownerType: "Minor_Designated" as const, tfnStatus: "Quoted" as const },
    { id: "own", name: "Kid direct", ownerType: "Minor_Direct" as const, tfnStatus: "Quoted" as const },
  ];
  const tickers = [...new Set(txs.map((t) => t.ticker))];
  return {
    version: 1,
    accounts,
    securities: tickers.map((ticker) => ({
      ticker,
      name: ticker,
      gicsSector: "Materials",
      assetClass: "AU Equities" as const,
      exchange: "ASX",
      companyTaxRate: 0.3,
      lastPrice: 1,
    })),
    transactions: txs,
    settings: {
      cgtMethod: method,
      financialYear: "2025-26",
      valuationDate: "2026-10-21",
      benchmarkRates: { au: 0.08, intl: 0.1, reit: 0.06, cash: 0.04 },
      openingLosses: {},
    },
  };
}

function buy(partial: Partial<Transaction> & Pick<Transaction, "id" | "tradeDate" | "units" | "price">): Transaction {
  return blankTransaction({
    accountId: "adult",
    ticker: "BHP.AX",
    type: "BUY",
    brokerage: 0,
    ...partial,
  });
}

describe("franking", () => {
  it("grosses up at 30% and 25%", () => {
    assert.equal(cents(frankingCredit(70, 0.3)), 3000);
    assert.equal(cents(frankingCredit(75, 0.25)), 2500);
    assert.equal(cents(frankingCredit(142.8, 0.3)), 6120);
  });
});

describe("DRP", () => {
  it("floors units to 4 d.p. and carries residual cash", () => {
    const first = drpAllocation(168, 98.4);
    assert.equal(first.units, 1.7073);
    assert.ok(Math.abs(first.spent + first.residual - 168) < 1e-6);
    const second = drpAllocation(10, 3);
    assert.equal(second.units, 3.3333);
    assert.ok(second.residual > 0 && second.residual < 0.001);
  });

  it("creates a separate parcel and keeps the dividend taxable", () => {
    const sim = simulate(
      portfolio([
        buy({ id: "b", tradeDate: "2024-01-02", units: 10, price: 20, brokerage: 0 }),
        blankTransaction({
          id: "d",
          accountId: "adult",
          ticker: "BHP.AX",
          type: "DIVIDEND_DRP",
          tradeDate: "2025-04-16",
          frankedAud: 156,
          unfrankedAud: 12,
          companyTaxRate: 0.3,
          drpPrice: 98.4,
        }),
      ]),
      "FIFO",
    );
    const div = sim.dividends[0];
    assert.ok(div);
    assert.equal(cents(div!.frankingCredit), 6686);
    assert.equal(sim.drpUnitsByTx.d, 1.7073);
    const drp = sim.parcels.find((p) => p.source === "DRP");
    assert.equal(drp?.acquisitionDate, "2025-04-16");
    assert.equal(drp?.unitsRemaining, 1.7073);
  });
});

describe("CGT discount boundary", () => {
  it("requires more than 365 days", () => {
    assert.equal(discountEligible("2023-01-01", "2024-01-01"), false);
    assert.equal(discountEligible("2023-01-01", "2024-01-02"), true);
    assert.equal(discountEligible("2024-01-01", "2025-01-01"), true);
  });
});

describe("loss offset", () => {
  it("applies losses to gross gains before the discount, non-discount first", () => {
    const result = applyCapitalLosses({
      discountableGross: 1000,
      nonDiscountableGross: 100,
      currentYearLosses: 150,
      carriedIn: 0,
    });
    assert.equal(result.lossesAppliedToNonDiscount, 100);
    assert.equal(result.lossesAppliedToDiscount, 50);
    assert.equal(result.discountAmount, 475);
    assert.equal(result.netCapitalGain, 475);
    assert.equal(result.lossesCarriedForward, 0);
  });
});

describe("parcel methods", () => {
  const txs: Transaction[] = [
    buy({ id: "old", tradeDate: "2023-01-01", units: 10, price: 10, brokerage: 0 }),
    buy({ id: "new", tradeDate: "2025-06-01", units: 10, price: 40, brokerage: 0 }),
    blankTransaction({
      id: "sell",
      accountId: "adult",
      ticker: "BHP.AX",
      type: "SELL",
      tradeDate: "2026-03-01",
      units: 10,
      price: 30,
      brokerage: 0,
    }),
  ];

  it("FIFO takes the old discounted parcel and realises a gain", () => {
    const sim = simulate(portfolio(txs, "FIFO"), "FIFO");
    assert.equal(sim.disposals.length, 1);
    assert.equal(sim.disposals[0]?.acquisitionDate, "2023-01-01");
    assert.equal(sim.disposals[0]?.discountEligible, true);
    assert.equal(cents(sim.disposals[0]!.grossGain), 20000);
  });

  it("LIFO takes the new parcel and realises a loss", () => {
    const sim = simulate(portfolio(txs, "LIFO"), "LIFO");
    assert.equal(sim.disposals[0]?.acquisitionDate, "2025-06-01");
    assert.equal(sim.disposals[0]?.discountEligible, false);
    assert.equal(cents(sim.disposals[0]!.grossGain), -10000);
  });

  it("min-tax realises the loss before the discounted gain", () => {
    const sim = simulate(portfolio(txs, "MIN_TAX"), "MIN_TAX");
    assert.equal(sim.disposals[0]?.acquisitionDate, "2025-06-01");
    assert.ok(sim.disposals[0]!.grossGain < 0);
  });
});

describe("corporate actions", () => {
  it("a split scales units and preserves cost base", () => {
    const sim = simulate(
      portfolio([
        buy({ id: "b", tradeDate: "2024-05-06", units: 10, price: 10, brokerage: 0 }),
        blankTransaction({
          id: "s",
          accountId: "adult",
          ticker: "BHP.AX",
          type: "SPLIT",
          tradeDate: "2025-11-03",
          splitRatio: 2,
        }),
      ]),
      "FIFO",
    );
    assert.equal(sim.parcels[0]?.unitsRemaining, 20);
    assert.equal(cents(sim.parcels[0]!.totalCostBase), 10000);
  });

  it("return of capital above the cost base is a G1 gain", () => {
    const sim = simulate(
      portfolio([
        buy({ id: "b", tradeDate: "2023-01-01", units: 10, price: 1, brokerage: 0 }),
        blankTransaction({
          id: "r",
          accountId: "adult",
          ticker: "BHP.AX",
          type: "RETURN_OF_CAPITAL",
          tradeDate: "2025-12-10",
          price: 2,
        }),
      ]),
      "FIFO",
    );
    assert.equal(sim.parcels[0]?.totalCostBase, 0);
    assert.equal(sim.disposals[0]?.kind, "G1");
    assert.equal(cents(sim.disposals[0]!.grossGain), 1000);
    assert.equal(sim.disposals[0]?.discountEligible, true);
  });
});

describe("family tax entities", () => {
  it("offsets a carried loss against a later discounted gain before halving", () => {
    const txs: Transaction[] = [
      buy({ id: "wow-b", ticker: "WOW.AX", tradeDate: "2024-03-01", units: 50, price: 32, brokerage: 9.95 }),
      blankTransaction({
        id: "wow-s",
        accountId: "adult",
        ticker: "WOW.AX",
        type: "SELL",
        tradeDate: "2024-11-20",
        units: 50,
        price: 28.4,
        brokerage: 9.95,
      }),
      buy({ id: "bhp-b", ticker: "BHP.AX", tradeDate: "2024-02-12", units: 200, price: 45.1, brokerage: 9.95 }),
      blankTransaction({
        id: "bhp-s",
        accountId: "adult",
        ticker: "BHP.AX",
        type: "SELL",
        tradeDate: "2025-09-18",
        units: 80,
        price: 43.2,
        brokerage: 9.95,
      }),
      buy({ id: "vas-b", ticker: "VAS.AX", tradeDate: "2023-08-15", units: 120, price: 89.2, brokerage: 9.5 }),
      blankTransaction({
        id: "vas-s",
        accountId: "adult",
        ticker: "VAS.AX",
        type: "SELL",
        tradeDate: "2026-03-02",
        units: 40,
        price: 108.5,
        brokerage: 9.95,
      }),
    ];
    const book = portfolio(txs);
    const sim = simulate(book, "FIFO");
    const [adult] = reportForFy(sim, book, "2025-26");
    assert.equal(adult?.cgt.currentYearLosses, 165.93);
    assert.equal(adult?.cgt.lossesCarriedIn, 199.9);
    assert.equal(adult?.cgt.lossesAppliedToDiscount, 365.83);
    assert.equal(adult?.cgt.netCapitalGain, 196.53);
  });

  it("attributes a designated minor to the adult and keeps a direct minor on section 102AA", () => {
    const book = portfolio([
      blankTransaction({
        id: "d1",
        accountId: "des",
        ticker: "BHP.AX",
        type: "DIVIDEND_CASH",
        tradeDate: "2025-09-01",
        frankedAud: 70,
        companyTaxRate: 0.3,
      }),
      blankTransaction({
        id: "d2",
        accountId: "own",
        ticker: "BHP.AX",
        type: "DIVIDEND_CASH",
        tradeDate: "2025-09-01",
        frankedAud: 70,
        unfrankedAud: 20,
        companyTaxRate: 0.3,
      }),
    ]);
    const reports = reportForFy(simulate(book, "FIFO"), book, "2025-26");
    const adult = reports.find((r) => r.entityAccountId === "adult");
    const own = reports.find((r) => r.entityAccountId === "own");
    assert.equal(reports.some((r) => r.entityAccountId === "des"), false);
    assert.equal(adult?.grossDividends, 100);
    assert.equal(adult?.minor, null);
    assert.equal(own?.grossDividends, 120);
    assert.equal(own?.minor?.applies, true);
    assert.equal(own?.minor?.band, "nil");
  });

  it("flags the 66% band and the 45% cliff", () => {
    const mid = minorUnearnedTax(457.14);
    assert.equal(mid.band, "penalty66");
    assert.equal(mid.illustrativeTax, 27.15);
    const high = minorUnearnedTax(1460);
    assert.equal(high.band, "top45");
    assert.equal(high.illustrativeTax, 657);
    const low = minorUnearnedTax(23.23);
    assert.equal(low.band, "nil");
    assert.equal(low.illustrativeTax, 0);
  });
});

describe("sample family", () => {
  it("places each child in the intended band and keeps Harper's discounted gain", () => {
    const book = samplePortfolio();
    const reports = reportForFy(simulate(book, "FIFO"), book, "2025-26");
    const harper = reports.find((r) => r.entityAccountId === "acc-harper");
    const noah = reports.find((r) => r.entityAccountId === "acc-noah");
    const mia = reports.find((r) => r.entityAccountId === "acc-mia");
    const leo = reports.find((r) => r.entityAccountId === "acc-leo");
    assert.equal(harper?.cgt.netCapitalGain, 196.53);
    assert.ok((harper?.grossDividends ?? 0) > 0);
    assert.equal(reports.some((r) => r.entityAccountId === "acc-ava"), false);
    assert.equal(noah?.minor?.band, "nil");
    assert.equal(mia?.minor?.band, "penalty66");
    assert.equal(leo?.minor?.band, "top45");
    assert.equal(leo?.minor?.illustrativeTax, 657);
    assert.equal(emptyPortfolio().transactions.length, 0);
  });
});
