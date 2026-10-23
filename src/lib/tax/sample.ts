import type { Portfolio, Security, Transaction } from "./engine.ts";
import { blankTransaction, tradeTotal } from "./engine.ts";

const securities: Security[] = [
  { ticker: "VAS.AX", name: "Vanguard Australian Shares", gicsSector: "Diversified", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 105.4 },
  { ticker: "BHP.AX", name: "BHP Group", gicsSector: "Materials", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 42.15 },
  { ticker: "CSL.AX", name: "CSL", gicsSector: "Health Care", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 278.5 },
  { ticker: "VGS.AX", name: "Vanguard MSCI International", gicsSector: "Global blend", assetClass: "Intl Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 131.8 },
  { ticker: "VAP.AX", name: "Vanguard Australian Property", gicsSector: "Real Estate", assetClass: "REITs", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 96.2 },
  { ticker: "CBA.AX", name: "Commonwealth Bank", gicsSector: "Financials", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 168.4 },
  { ticker: "WES.AX", name: "Wesfarmers", gicsSector: "Consumer Discretionary", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 82.3 },
  { ticker: "WOW.AX", name: "Woolworths Group", gicsSector: "Consumer Staples", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 29.1 },
  { ticker: "MQG.AX", name: "Macquarie Group", gicsSector: "Financials", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 214 },
  { ticker: "TCL.AX", name: "Transurban", gicsSector: "Industrials", assetClass: "AU Equities", exchange: "ASX", companyTaxRate: 0.3, lastPrice: 14.05 },
];

function tx(partial: Partial<Transaction> & Pick<Transaction, "id" | "accountId" | "ticker" | "type" | "tradeDate">): Transaction {
  const row = blankTransaction({ companyTaxRate: 0.3, ...partial });
  return { ...row, totalAud: tradeTotal(row) };
}

const transactions: Transaction[] = [
  tx({ id: "h-vas-1", accountId: "acc-harper", ticker: "VAS.AX", type: "BUY", tradeDate: "2023-08-15", units: 120, price: 89.2, brokerage: 9.5, note: "Opening VAS parcel" }),
  tx({ id: "h-bhp-1", accountId: "acc-harper", ticker: "BHP.AX", type: "BUY", tradeDate: "2024-02-12", units: 200, price: 45.1, brokerage: 9.95 }),
  tx({ id: "h-wow-1", accountId: "acc-harper", ticker: "WOW.AX", type: "BUY", tradeDate: "2024-03-01", units: 50, price: 32, brokerage: 9.95 }),
  tx({ id: "h-vgs-1", accountId: "acc-harper", ticker: "VGS.AX", type: "BUY", tradeDate: "2024-06-20", units: 40, price: 118, brokerage: 9.5 }),
  tx({ id: "h-csl-1", accountId: "acc-harper", ticker: "CSL.AX", type: "BUY", tradeDate: "2024-11-04", units: 15, price: 290, brokerage: 9.95 }),
  tx({ id: "h-wow-s", accountId: "acc-harper", ticker: "WOW.AX", type: "SELL", tradeDate: "2024-11-20", units: 50, price: 28.4, brokerage: 9.95, note: "Loss to carry forward" }),
  tx({ id: "h-vap-1", accountId: "acc-harper", ticker: "VAP.AX", type: "BUY", tradeDate: "2025-01-16", units: 50, price: 92.4, brokerage: 9.5 }),
  tx({ id: "h-vas-div-1", accountId: "acc-harper", ticker: "VAS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-07-16", unfrankedAud: 18.4, frankedAud: 142.8 }),
  tx({ id: "h-bhp-div-1", accountId: "acc-harper", ticker: "BHP.AX", type: "DIVIDEND_CASH", tradeDate: "2025-09-24", frankedAud: 186 }),
  tx({ id: "h-vas-drp", accountId: "acc-harper", ticker: "VAS.AX", type: "DIVIDEND_DRP", tradeDate: "2025-10-15", unfrankedAud: 12, frankedAud: 156, drpPrice: 98.4, note: "DRP residual tracked" }),
  tx({ id: "h-vgs-div", accountId: "acc-harper", ticker: "VGS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-07-15", unfrankedAud: 36, companyTaxRate: 0.3 }),
  tx({ id: "h-bhp-s", accountId: "acc-harper", ticker: "BHP.AX", type: "SELL", tradeDate: "2025-09-18", units: 80, price: 43.2, brokerage: 9.95 }),
  tx({ id: "h-vas-2", accountId: "acc-harper", ticker: "VAS.AX", type: "BUY", tradeDate: "2025-09-02", units: 30, price: 102.1, brokerage: 9.95 }),
  tx({ id: "h-bhp-div-2", accountId: "acc-harper", ticker: "BHP.AX", type: "DIVIDEND_CASH", tradeDate: "2025-09-25", frankedAud: 111.6 }),
  tx({ id: "h-vap-roc", accountId: "acc-harper", ticker: "VAP.AX", type: "RETURN_OF_CAPITAL", tradeDate: "2025-12-10", price: 0.42, note: "Cost base reduction" }),
  tx({ id: "h-vas-s", accountId: "acc-harper", ticker: "VAS.AX", type: "SELL", tradeDate: "2026-03-02", units: 40, price: 108.5, brokerage: 9.95, note: "Discounted gain" }),

  tx({ id: "a-vas", accountId: "acc-ava", ticker: "VAS.AX", type: "BUY", tradeDate: "2024-07-08", units: 25, price: 96.5, brokerage: 9.95 }),
  tx({ id: "a-div", accountId: "acc-ava", ticker: "VAS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-07-16", unfrankedAud: 3.2, frankedAud: 28.5, note: "Trustee income" }),

  tx({ id: "n-bhp", accountId: "acc-noah", ticker: "BHP.AX", type: "BUY", tradeDate: "2024-09-01", units: 10, price: 40.2, brokerage: 9.95 }),
  tx({ id: "n-vas", accountId: "acc-noah", ticker: "VAS.AX", type: "BUY", tradeDate: "2024-12-02", units: 4, price: 99, brokerage: 0 }),
  tx({ id: "n-bhp-div", accountId: "acc-noah", ticker: "BHP.AX", type: "DIVIDEND_CASH", tradeDate: "2025-09-26", frankedAud: 9.3 }),
  tx({ id: "n-vas-div", accountId: "acc-noah", ticker: "VAS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-07-17", frankedAud: 6.4, unfrankedAud: 0.8 }),

  tx({ id: "m-cba", accountId: "acc-mia", ticker: "CBA.AX", type: "BUY", tradeDate: "2024-08-20", units: 40, price: 138, brokerage: 9.95 }),
  tx({ id: "m-wes", accountId: "acc-mia", ticker: "WES.AX", type: "BUY", tradeDate: "2024-10-01", units: 60, price: 68, brokerage: 9.95 }),
  tx({ id: "m-cba-div", accountId: "acc-mia", ticker: "CBA.AX", type: "DIVIDEND_CASH", tradeDate: "2025-09-28", frankedAud: 100 }),
  tx({ id: "m-wes-div", accountId: "acc-mia", ticker: "WES.AX", type: "DIVIDEND_CASH", tradeDate: "2025-10-02", frankedAud: 220 }),

  tx({ id: "l-vas", accountId: "acc-leo", ticker: "VAS.AX", type: "BUY", tradeDate: "2023-11-20", units: 80, price: 88, brokerage: 9.95 }),
  tx({ id: "l-bhp", accountId: "acc-leo", ticker: "BHP.AX", type: "BUY", tradeDate: "2024-01-20", units: 100, price: 46, brokerage: 9.95 }),
  tx({ id: "l-mqg", accountId: "acc-leo", ticker: "MQG.AX", type: "BUY", tradeDate: "2024-12-12", units: 15, price: 220, brokerage: 9.95 }),
  tx({ id: "l-tcl", accountId: "acc-leo", ticker: "TCL.AX", type: "BUY", tradeDate: "2024-05-06", units: 100, price: 13.2, brokerage: 9.95 }),
  tx({ id: "l-vas-div-1", accountId: "acc-leo", ticker: "VAS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-07-18", frankedAud: 220, unfrankedAud: 40 }),
  tx({ id: "l-bhp-div", accountId: "acc-leo", ticker: "BHP.AX", type: "DIVIDEND_CASH", tradeDate: "2025-09-26", frankedAud: 93 }),
  tx({ id: "l-vas-div-2", accountId: "acc-leo", ticker: "VAS.AX", type: "DIVIDEND_CASH", tradeDate: "2025-10-16", frankedAud: 240, unfrankedAud: 30 }),
  tx({ id: "l-mqg-div", accountId: "acc-leo", ticker: "MQG.AX", type: "DIVIDEND_CASH", tradeDate: "2025-11-12", frankedAud: 420 }),
  tx({ id: "l-split", accountId: "acc-leo", ticker: "TCL.AX", type: "SPLIT", tradeDate: "2025-11-03", splitRatio: 2, note: "2-for-1" }),
  tx({ id: "l-vas-s", accountId: "acc-leo", ticker: "VAS.AX", type: "SELL", tradeDate: "2026-02-10", units: 10, price: 112, brokerage: 9.95 }),
];

export function samplePortfolio(): Portfolio {
  return {
    version: 1,
    accounts: [
      { id: "acc-harper", name: "Harper Chen", ownerType: "Individual", tfnStatus: "Quoted" },
      { id: "acc-ava", name: "Ava Chen", ownerType: "Minor_Designated", tfnStatus: "Quoted" },
      { id: "acc-noah", name: "Noah Chen", ownerType: "Minor_Direct", tfnStatus: "Quoted" },
      { id: "acc-mia", name: "Mia Chen", ownerType: "Minor_Direct", tfnStatus: "Quoted" },
      { id: "acc-leo", name: "Leo Chen", ownerType: "Minor_Direct", tfnStatus: "Quoted" },
    ],
    securities,
    transactions,
    settings: {
      cgtMethod: "FIFO",
      financialYear: "2025-26",
      valuationDate: "2026-10-21",
      benchmarkRates: { au: 0.085, intl: 0.1, reit: 0.06, cash: 0.04 },
      openingLosses: {},
    },
  };
}

export function emptyPortfolio(): Portfolio {
  const base = samplePortfolio();
  return {
    ...base,
    securities: base.securities.map((s) => ({ ...s })),
    transactions: [],
    settings: { ...base.settings, openingLosses: {} },
  };
}
