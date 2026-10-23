import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as ScrollText, c as ChartPie, i as Shield, o as Scale, r as SlidersHorizontal, s as LayoutDashboard, t as Users } from "../_libs/lucide-react.mjs";
import { a as object, i as number, n as array, o as record, r as literal, s as string, t as _enum } from "../_libs/zod.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as Pie, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-3Aza49fp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPE_ORDER = {
	SPLIT: 0,
	RETURN_OF_CAPITAL: 1,
	BUY: 2,
	DIVIDEND_DRP: 3,
	DIVIDEND_CASH: 4,
	SELL: 5
};
function round2(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.round(n * 100 + (n >= 0 ? 1e-8 : -1e-8)) / 100;
}
function roundUnits(n) {
	if (!Number.isFinite(n)) return 0;
	const r = Math.round(n * 1e6) / 1e6;
	return Math.abs(r) < 1e-8 ? 0 : r;
}
function daysBetween(earlier, later) {
	const [ay, am, ad] = earlier.split("-").map(Number);
	const [by, bm, bd] = later.split("-").map(Number);
	if (!ay || !am || !ad || !by || !bm || !bd) return 0;
	const utcA = Date.UTC(ay, am - 1, ad);
	const utcB = Date.UTC(by, bm - 1, bd);
	return Math.round((utcB - utcA) / 864e5);
}
function discountEligible(acquisitionDate, disposalDate) {
	return daysBetween(acquisitionDate, disposalDate) > 365;
}
/** Franking credit = franked × (company tax rate / (1 − company tax rate)). */
function frankingCredit(frankedAud, companyTaxRate) {
	if (!(frankedAud > 0) || !(companyTaxRate > 0) || companyTaxRate >= 1) return 0;
	if (Math.abs(companyTaxRate - .3) < 1e-9) return frankedAud * 3 / 7;
	if (Math.abs(companyTaxRate - .25) < 1e-9) return frankedAud / 3;
	return frankedAud * (companyTaxRate / (1 - companyTaxRate));
}
function grossDividend(unfranked, franked, credit) {
	return unfranked + franked + credit;
}
/**
* DRP units are whole hundredths of a basis point (4 d.p.), rounded down so the
* plan never spends more cash than was available. Leftover cash carries forward.
*/
function drpAllocation(cashAvailable, drpPrice) {
	if (!(drpPrice > 0) || !(cashAvailable > 0)) return {
		units: 0,
		spent: 0,
		residual: Math.max(0, cashAvailable)
	};
	const units = Math.floor(cashAvailable / drpPrice * 1e4 + 1e-4) / 1e4;
	const spent = units * drpPrice;
	const residual = cashAvailable - spent;
	return {
		units: roundUnits(units),
		spent,
		residual: Math.max(0, residual)
	};
}
function dateToFy(iso) {
	const y = Number(iso.slice(0, 4));
	const m = Number(iso.slice(5, 7));
	if (!y || !m) return "1970-71";
	return formatFy(m >= 7 ? y : y - 1);
}
function formatFy(startYear) {
	return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
function legalEntityId(account, accounts) {
	if (account.ownerType === "Minor_Designated") return accounts.find((a) => a.ownerType === "Individual")?.id ?? account.id;
	return account.id;
}
function applyCapitalLosses(input) {
	let nonDisc = Math.max(0, input.nonDiscountableGross);
	let disc = Math.max(0, input.discountableGross);
	let losses = Math.max(0, input.currentYearLosses) + Math.max(0, input.carriedIn);
	const toNon = Math.min(losses, nonDisc);
	nonDisc -= toNon;
	losses -= toNon;
	const toDisc = Math.min(losses, disc);
	disc -= toDisc;
	losses -= toDisc;
	const discountAmount = round2(disc * .5);
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
		lossesCarriedForward: round2(losses)
	};
}
function minorUnearnedTax(eligibleIncome) {
	const income = round2(Math.max(0, eligibleIncome));
	const cents = Math.round(income * 100);
	if (cents <= 41600) return {
		band: "nil",
		illustrativeTax: 0,
		roomTo416: round2(416 - income),
		roomTo1307: round2(1307 - income)
	};
	if (cents <= 130700) return {
		band: "penalty66",
		illustrativeTax: Math.round((cents - 41600) * .66) / 100,
		roomTo416: 0,
		roomTo1307: round2(1307 - income)
	};
	return {
		band: "top45",
		illustrativeTax: Math.round(cents * .45) / 100,
		roomTo416: 0,
		roomTo1307: 0
	};
}
function emptyTx() {
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
		companyTaxRate: .3,
		drpPrice: 0,
		splitRatio: 0,
		note: ""
	};
}
function tradeTotal(tx) {
	if (tx.type === "BUY") return round2(tx.units * tx.price + tx.brokerage);
	if (tx.type === "SELL") return round2(tx.units * tx.price - tx.brokerage);
	if (tx.type === "DIVIDEND_CASH" || tx.type === "DIVIDEND_DRP") return round2(tx.unfrankedAud + tx.frankedAud);
	if (tx.type === "RETURN_OF_CAPITAL") return round2(tx.units * tx.price);
	return 0;
}
function blankTransaction(partial) {
	return {
		...emptyTx(),
		...partial,
		id: partial.id ?? ""
	};
}
function unitCost(p) {
	if (p.unitsRemaining <= 1e-9) return 0;
	return p.totalCostBase / p.unitsRemaining;
}
function assessablePerUnit(p, proceedsPerUnit, disposalDate) {
	const gain = proceedsPerUnit - unitCost(p);
	if (gain > 0 && discountEligible(p.acquisitionDate, disposalDate)) return gain * .5;
	return gain;
}
function simulate(portfolio, method) {
	const warnings = [];
	const parcels = [];
	const dividends = [];
	const disposals = [];
	const drpUnitsByTx = {};
	const residual = /* @__PURE__ */ new Map();
	const asOf = portfolio.settings.valuationDate;
	const knownAccounts = new Set(portfolio.accounts.map((a) => a.id));
	const knownTickers = new Set(portfolio.securities.map((s) => s.ticker));
	const txs = [...portfolio.transactions].sort((a, b) => {
		if (a.tradeDate !== b.tradeDate) return a.tradeDate < b.tradeDate ? -1 : 1;
		const order = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
		if (order) return order;
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	});
	const keyOf = (accountId, ticker) => `${accountId}|${ticker}`;
	const holdings = (accountId, ticker) => parcels.filter((p) => p.accountId === accountId && p.ticker === ticker && p.unitsRemaining > 1e-8);
	for (const tx of txs) {
		if (!knownAccounts.has(tx.accountId) || !knownTickers.has(tx.ticker)) {
			warnings.push({
				txId: tx.id,
				code: "UNKNOWN",
				message: "Event skipped because the account or ticker is not on the ledger."
			});
			continue;
		}
		if (asOf && tx.tradeDate > asOf) {
			warnings.push({
				txId: tx.id,
				code: "AFTER_VALUATION",
				message: "Dated after the valuation date, so it is excluded from holdings and tax worksheets."
			});
			continue;
		}
		if (tx.type === "BUY") {
			if (!(tx.units > 0) || !(tx.price >= 0)) {
				warnings.push({
					txId: tx.id,
					code: "BAD_PRICE",
					message: "Buy needs a positive unit count."
				});
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
				sourceTxId: tx.id
			});
			continue;
		}
		if (tx.type === "SPLIT") {
			const ratio = tx.splitRatio;
			const open = holdings(tx.accountId, tx.ticker);
			if (!(ratio > 0) || ratio === 1) {
				warnings.push({
					txId: tx.id,
					code: "BAD_SPLIT",
					message: "Split ratio must be a positive number other than 1."
				});
				continue;
			}
			if (open.length === 0) {
				warnings.push({
					txId: tx.id,
					code: "NO_HOLDING",
					message: "Split ignored — no units were held on that date."
				});
				continue;
			}
			for (const p of open) p.unitsRemaining = roundUnits(p.unitsRemaining * ratio);
			continue;
		}
		if (tx.type === "RETURN_OF_CAPITAL") {
			const perUnit = tx.price;
			const open = holdings(tx.accountId, tx.ticker);
			if (!(perUnit > 0)) {
				warnings.push({
					txId: tx.id,
					code: "BAD_PRICE",
					message: "Capital return needs an amount per unit."
				});
				continue;
			}
			if (open.length === 0) {
				warnings.push({
					txId: tx.id,
					code: "NO_HOLDING",
					message: "Capital return ignored — no units were held."
				});
				continue;
			}
			open.forEach((p, index) => {
				const wanted = p.unitsRemaining * perUnit;
				const applied = Math.min(p.totalCostBase, wanted);
				const excess = wanted - applied;
				p.totalCostBase -= applied;
				if (p.totalCostBase < 1e-8) p.totalCostBase = 0;
				if (excess > 1e-6) disposals.push({
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
					kind: "G1"
				});
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
				if (!(drpPrice > 0)) warnings.push({
					txId: tx.id,
					code: "BAD_PRICE",
					message: "DRP has no issue price. The dividend is still income; no units were created."
				});
				else {
					const alloc = drpAllocation(cash + residualAfter, drpPrice);
					drpUnits = alloc.units;
					residualAfter = alloc.residual;
					residual.set(mapKey, residualAfter);
					if (drpUnits > 0) parcels.push({
						id: `drp-${tx.id}`,
						accountId: tx.accountId,
						ticker: tx.ticker,
						acquisitionDate: tx.tradeDate,
						unitsRemaining: drpUnits,
						totalCostBase: alloc.spent,
						source: "DRP",
						sourceTxId: tx.id
					});
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
				residualAfter
			});
			continue;
		}
		if (tx.type === "SELL") {
			if (!(tx.units > 0)) {
				warnings.push({
					txId: tx.id,
					code: "BAD_PRICE",
					message: "Sell needs a positive unit count."
				});
				continue;
			}
			const open = holdings(tx.accountId, tx.ticker);
			const available = open.reduce((s, p) => s + p.unitsRemaining, 0);
			const sellUnits = Math.min(tx.units, available);
			if (sellUnits + 1e-8 < tx.units) warnings.push({
				txId: tx.id,
				code: "OVERSELL",
				message: `Only ${roundUnits(available)} units were open. The excess was not matched.`
			});
			if (!(sellUnits > 0)) continue;
			const proceedsTotal = sellUnits * tx.price - Math.max(0, tx.brokerage) * (sellUnits / tx.units);
			const proceedsPerUnit = proceedsTotal / sellUnits;
			const ordered = [...open];
			if (method === "FIFO") ordered.sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate) || a.id.localeCompare(b.id));
			else if (method === "LIFO") ordered.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate) || b.id.localeCompare(a.id));
			else ordered.sort((a, b) => {
				const diff = assessablePerUnit(a, proceedsPerUnit, tx.tradeDate) - assessablePerUnit(b, proceedsPerUnit, tx.tradeDate);
				if (Math.abs(diff) > 1e-9) return diff;
				return a.acquisitionDate.localeCompare(b.acquisitionDate) || a.id.localeCompare(b.id);
			});
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
					kind: "SELL"
				});
			}
		}
	}
	const residuals = [...residual.entries()].filter(([, cash]) => cash > 1e-6).map(([key, cash]) => {
		const [accountId, ticker] = key.split("|");
		return {
			accountId: accountId ?? "",
			ticker: ticker ?? "",
			cash
		};
	});
	return {
		warnings,
		parcels: parcels.filter((p) => p.unitsRemaining > 1e-8),
		residuals,
		dividends,
		disposals,
		drpUnitsByTx
	};
}
function sumGainBuckets(lines) {
	let discountable = 0;
	let nonDiscountable = 0;
	let losses = 0;
	for (const line of lines) if (line.grossGain < 0) losses += -line.grossGain;
	else if (line.discountEligible) discountable += line.grossGain;
	else nonDiscountable += line.grossGain;
	return {
		discountable,
		nonDiscountable,
		losses
	};
}
function reportForFy(sim, portfolio, fy) {
	const accounts = portfolio.accounts;
	const groups = /* @__PURE__ */ new Map();
	for (const account of accounts) {
		const entity = legalEntityId(account, accounts);
		const list = groups.get(entity) ?? [];
		list.push(account.id);
		groups.set(entity, list);
	}
	const reports = [];
	for (const [entityAccountId, includesAccountIds] of groups) {
		const entity = accounts.find((a) => a.id === entityAccountId);
		if (!entity) continue;
		const member = new Set(includesAccountIds);
		const dates = [...sim.disposals.filter((d) => member.has(d.accountId)).map((d) => d.disposalDate), ...sim.dividends.filter((d) => member.has(d.accountId)).map((d) => d.paymentDate)];
		let minFy = fy;
		for (const date of dates) {
			const eventFy = dateToFy(date);
			if (eventFy < minFy) minFy = eventFy;
		}
		const start = Number(minFy.slice(0, 4));
		const end = Number(fy.slice(0, 4));
		let carried = includesAccountIds.reduce((s, id) => s + Math.max(0, portfolio.settings.openingLosses[id] ?? 0), 0);
		let snapshot = applyCapitalLosses({
			discountableGross: 0,
			nonDiscountableGross: 0,
			currentYearLosses: 0,
			carriedIn: carried
		});
		let yearDisposals = [];
		let yearDividends = [];
		if (start <= end) for (let y = start; y <= end; y++) {
			const year = formatFy(y);
			yearDisposals = sim.disposals.filter((d) => member.has(d.accountId) && dateToFy(d.disposalDate) === year);
			yearDividends = sim.dividends.filter((d) => member.has(d.accountId) && dateToFy(d.paymentDate) === year);
			const buckets = sumGainBuckets(yearDisposals);
			snapshot = applyCapitalLosses({
				discountableGross: buckets.discountable,
				nonDiscountableGross: buckets.nonDiscountable,
				currentYearLosses: buckets.losses,
				carriedIn: carried
			});
			carried = snapshot.lossesCarriedForward;
		}
		const sources = includesAccountIds.map((accountId) => {
			const divs = yearDividends.filter((d) => d.accountId === accountId);
			const buckets = sumGainBuckets(yearDisposals.filter((d) => d.accountId === accountId));
			return {
				accountId,
				unfranked: round2(divs.reduce((s, d) => s + d.unfranked, 0)),
				franked: round2(divs.reduce((s, d) => s + d.franked, 0)),
				frankingCredits: round2(divs.reduce((s, d) => s + d.frankingCredit, 0)),
				gross: round2(divs.reduce((s, d) => s + d.gross, 0)),
				discountableGains: round2(buckets.discountable),
				otherGains: round2(buckets.nonDiscountable),
				losses: round2(buckets.losses)
			};
		});
		const grossDividends = round2(sources.reduce((s, src) => s + src.gross, 0));
		const minor = entity.ownerType === "Minor_Direct" ? {
			applies: true,
			eligibleIncome: grossDividends,
			...minorUnearnedTax(grossDividends)
		} : null;
		reports.push({
			entityAccountId,
			ownerType: entity.ownerType,
			includesAccountIds,
			unfranked: round2(sources.reduce((s, src) => s + src.unfranked, 0)),
			franked: round2(sources.reduce((s, src) => s + src.franked, 0)),
			frankingCredits: round2(sources.reduce((s, src) => s + src.frankingCredits, 0)),
			grossDividends,
			sources: sources.filter((s) => s.gross > 0 || s.discountableGains > 0 || s.otherGains > 0 || s.losses > 0 || includesAccountIds.length === 1),
			cgt: snapshot,
			disposals: yearDisposals,
			minor
		});
	}
	return reports;
}
function rateFor(assetClass, rates) {
	if (assetClass === "Intl Equities") return rates.intl;
	if (assetClass === "REITs") return rates.reit;
	if (assetClass === "Cash") return rates.cash;
	return rates.au;
}
function buildPositions(sim, portfolio) {
	const asOf = portfolio.settings.valuationDate;
	const byKey = /* @__PURE__ */ new Map();
	for (const parcel of sim.parcels) {
		const key = `${parcel.accountId}|${parcel.ticker}`;
		const list = byKey.get(key) ?? [];
		list.push(parcel);
		byKey.set(key, list);
	}
	const positions = [];
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
			const years = Math.max(0, daysBetween(parcel.acquisitionDate, asOf)) / 365.25;
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
			parcels: [...parcels].sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate))
		});
	}
	positions.sort((a, b) => b.marketValue - a.marketValue || a.ticker.localeCompare(b.ticker));
	return positions;
}
function diversificationScore(weights) {
	const clean = weights.filter((w) => w > 0);
	if (clean.length <= 1) return 0;
	const score = (1 - clean.reduce((s, w) => s + w * w, 0)) * 100;
	return Math.max(0, Math.min(100, Math.round(score)));
}
function financialYearOptions(portfolio) {
	const dates = portfolio.transactions.map((t) => t.tradeDate).filter(Boolean);
	dates.push(portfolio.settings.valuationDate);
	let min = Number(dateToFy(portfolio.settings.valuationDate).slice(0, 4));
	let max = min;
	for (const date of dates) {
		const y = Number(dateToFy(date).slice(0, 4));
		if (y < min) min = y;
		if (y > max) max = y;
	}
	const list = [];
	for (let y = min; y <= max; y++) list.push(formatFy(y));
	return list.reverse();
}
var aud = new Intl.NumberFormat("en-AU", {
	style: "currency",
	currency: "AUD"
});
function money$1(n) {
	if (!Number.isFinite(n)) return "—";
	return aud.format(round2(n));
}
function moneySigned(n) {
	if (!Number.isFinite(n)) return "—";
	const rounded = round2(n);
	if (rounded > 0) return `+${aud.format(rounded)}`;
	return aud.format(rounded);
}
function units(n) {
	return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 4 }).format(n);
}
function pct(n) {
	if (!Number.isFinite(n)) return "—";
	const value = n * 100;
	return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
function ownerLabel(owner) {
	if (owner === "Individual") return "Individual";
	if (owner === "Minor_Designated") return "Minor · designated";
	return "Minor · own TFN";
}
function firstName(name) {
	return name.split(" ")[0] || name;
}
function txLabel(type) {
	switch (type) {
		case "BUY": return "Buy";
		case "SELL": return "Sell";
		case "DIVIDEND_CASH": return "Cash dividend";
		case "DIVIDEND_DRP": return "DRP";
		case "SPLIT": return "Split";
		case "RETURN_OF_CAPITAL": return "Capital return";
	}
}
function scoreLabel(score) {
	if (score >= 80) return "Wide spread";
	if (score >= 60) return "Balanced";
	if (score >= 30) return "Building";
	return "Concentrated";
}
var CHART_FILLS = [
	"var(--color-teal)",
	"var(--color-blue)",
	"var(--color-mint)",
	"var(--color-coral)",
	"color-mix(in oklab, var(--color-teal) 55%, var(--color-blue))",
	"color-mix(in oklab, var(--color-mint) 70%, var(--color-fg))",
	"color-mix(in oklab, var(--color-blue) 40%, var(--color-coral))",
	"color-mix(in oklab, var(--color-teal) 35%, var(--color-fg))",
	"color-mix(in oklab, var(--color-blue) 30%, var(--color-mint))"
];
function AllocationChart({ rows }) {
	if (rows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-52 place-items-center text-sm text-muted",
		children: "No market value yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-52",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
				data: rows,
				dataKey: "value",
				nameKey: "name",
				innerRadius: 58,
				outerRadius: 78,
				paddingAngle: 2,
				stroke: "transparent",
				children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: CHART_FILLS[index % CHART_FILLS.length] }, row.name))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
				formatter: (value) => money$1(Number(value ?? 0)),
				contentStyle: {
					background: "var(--color-surface)",
					border: "1px solid var(--color-line)",
					borderRadius: "12px",
					color: "var(--color-fg)"
				}
			})] })
		})
	});
}
var securities = [
	{
		ticker: "VAS.AX",
		name: "Vanguard Australian Shares",
		gicsSector: "Diversified",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 105.4
	},
	{
		ticker: "BHP.AX",
		name: "BHP Group",
		gicsSector: "Materials",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 42.15
	},
	{
		ticker: "CSL.AX",
		name: "CSL",
		gicsSector: "Health Care",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 278.5
	},
	{
		ticker: "VGS.AX",
		name: "Vanguard MSCI International",
		gicsSector: "Global blend",
		assetClass: "Intl Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 131.8
	},
	{
		ticker: "VAP.AX",
		name: "Vanguard Australian Property",
		gicsSector: "Real Estate",
		assetClass: "REITs",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 96.2
	},
	{
		ticker: "CBA.AX",
		name: "Commonwealth Bank",
		gicsSector: "Financials",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 168.4
	},
	{
		ticker: "WES.AX",
		name: "Wesfarmers",
		gicsSector: "Consumer Discretionary",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 82.3
	},
	{
		ticker: "WOW.AX",
		name: "Woolworths Group",
		gicsSector: "Consumer Staples",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 29.1
	},
	{
		ticker: "MQG.AX",
		name: "Macquarie Group",
		gicsSector: "Financials",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 214
	},
	{
		ticker: "TCL.AX",
		name: "Transurban",
		gicsSector: "Industrials",
		assetClass: "AU Equities",
		exchange: "ASX",
		companyTaxRate: .3,
		lastPrice: 14.05
	}
];
function tx(partial) {
	const row = blankTransaction({
		companyTaxRate: .3,
		...partial
	});
	return {
		...row,
		totalAud: tradeTotal(row)
	};
}
var transactions = [
	tx({
		id: "h-vas-1",
		accountId: "acc-harper",
		ticker: "VAS.AX",
		type: "BUY",
		tradeDate: "2023-08-15",
		units: 120,
		price: 89.2,
		brokerage: 9.5,
		note: "Opening VAS parcel"
	}),
	tx({
		id: "h-bhp-1",
		accountId: "acc-harper",
		ticker: "BHP.AX",
		type: "BUY",
		tradeDate: "2024-02-12",
		units: 200,
		price: 45.1,
		brokerage: 9.95
	}),
	tx({
		id: "h-wow-1",
		accountId: "acc-harper",
		ticker: "WOW.AX",
		type: "BUY",
		tradeDate: "2024-03-01",
		units: 50,
		price: 32,
		brokerage: 9.95
	}),
	tx({
		id: "h-vgs-1",
		accountId: "acc-harper",
		ticker: "VGS.AX",
		type: "BUY",
		tradeDate: "2024-06-20",
		units: 40,
		price: 118,
		brokerage: 9.5
	}),
	tx({
		id: "h-csl-1",
		accountId: "acc-harper",
		ticker: "CSL.AX",
		type: "BUY",
		tradeDate: "2024-11-04",
		units: 15,
		price: 290,
		brokerage: 9.95
	}),
	tx({
		id: "h-wow-s",
		accountId: "acc-harper",
		ticker: "WOW.AX",
		type: "SELL",
		tradeDate: "2024-11-20",
		units: 50,
		price: 28.4,
		brokerage: 9.95,
		note: "Loss to carry forward"
	}),
	tx({
		id: "h-vap-1",
		accountId: "acc-harper",
		ticker: "VAP.AX",
		type: "BUY",
		tradeDate: "2025-01-16",
		units: 50,
		price: 92.4,
		brokerage: 9.5
	}),
	tx({
		id: "h-vas-div-1",
		accountId: "acc-harper",
		ticker: "VAS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-07-16",
		unfrankedAud: 18.4,
		frankedAud: 142.8
	}),
	tx({
		id: "h-bhp-div-1",
		accountId: "acc-harper",
		ticker: "BHP.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-09-24",
		frankedAud: 186
	}),
	tx({
		id: "h-vas-drp",
		accountId: "acc-harper",
		ticker: "VAS.AX",
		type: "DIVIDEND_DRP",
		tradeDate: "2025-10-15",
		unfrankedAud: 12,
		frankedAud: 156,
		drpPrice: 98.4,
		note: "DRP residual tracked"
	}),
	tx({
		id: "h-vgs-div",
		accountId: "acc-harper",
		ticker: "VGS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-07-15",
		unfrankedAud: 36,
		companyTaxRate: .3
	}),
	tx({
		id: "h-bhp-s",
		accountId: "acc-harper",
		ticker: "BHP.AX",
		type: "SELL",
		tradeDate: "2025-09-18",
		units: 80,
		price: 43.2,
		brokerage: 9.95
	}),
	tx({
		id: "h-vas-2",
		accountId: "acc-harper",
		ticker: "VAS.AX",
		type: "BUY",
		tradeDate: "2025-09-02",
		units: 30,
		price: 102.1,
		brokerage: 9.95
	}),
	tx({
		id: "h-bhp-div-2",
		accountId: "acc-harper",
		ticker: "BHP.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-09-25",
		frankedAud: 111.6
	}),
	tx({
		id: "h-vap-roc",
		accountId: "acc-harper",
		ticker: "VAP.AX",
		type: "RETURN_OF_CAPITAL",
		tradeDate: "2025-12-10",
		price: .42,
		note: "Cost base reduction"
	}),
	tx({
		id: "h-vas-s",
		accountId: "acc-harper",
		ticker: "VAS.AX",
		type: "SELL",
		tradeDate: "2026-03-02",
		units: 40,
		price: 108.5,
		brokerage: 9.95,
		note: "Discounted gain"
	}),
	tx({
		id: "a-vas",
		accountId: "acc-ava",
		ticker: "VAS.AX",
		type: "BUY",
		tradeDate: "2024-07-08",
		units: 25,
		price: 96.5,
		brokerage: 9.95
	}),
	tx({
		id: "a-div",
		accountId: "acc-ava",
		ticker: "VAS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-07-16",
		unfrankedAud: 3.2,
		frankedAud: 28.5,
		note: "Trustee income"
	}),
	tx({
		id: "n-bhp",
		accountId: "acc-noah",
		ticker: "BHP.AX",
		type: "BUY",
		tradeDate: "2024-09-01",
		units: 10,
		price: 40.2,
		brokerage: 9.95
	}),
	tx({
		id: "n-vas",
		accountId: "acc-noah",
		ticker: "VAS.AX",
		type: "BUY",
		tradeDate: "2024-12-02",
		units: 4,
		price: 99,
		brokerage: 0
	}),
	tx({
		id: "n-bhp-div",
		accountId: "acc-noah",
		ticker: "BHP.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-09-26",
		frankedAud: 9.3
	}),
	tx({
		id: "n-vas-div",
		accountId: "acc-noah",
		ticker: "VAS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-07-17",
		frankedAud: 6.4,
		unfrankedAud: .8
	}),
	tx({
		id: "m-cba",
		accountId: "acc-mia",
		ticker: "CBA.AX",
		type: "BUY",
		tradeDate: "2024-08-20",
		units: 40,
		price: 138,
		brokerage: 9.95
	}),
	tx({
		id: "m-wes",
		accountId: "acc-mia",
		ticker: "WES.AX",
		type: "BUY",
		tradeDate: "2024-10-01",
		units: 60,
		price: 68,
		brokerage: 9.95
	}),
	tx({
		id: "m-cba-div",
		accountId: "acc-mia",
		ticker: "CBA.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-09-28",
		frankedAud: 100
	}),
	tx({
		id: "m-wes-div",
		accountId: "acc-mia",
		ticker: "WES.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-10-02",
		frankedAud: 220
	}),
	tx({
		id: "l-vas",
		accountId: "acc-leo",
		ticker: "VAS.AX",
		type: "BUY",
		tradeDate: "2023-11-20",
		units: 80,
		price: 88,
		brokerage: 9.95
	}),
	tx({
		id: "l-bhp",
		accountId: "acc-leo",
		ticker: "BHP.AX",
		type: "BUY",
		tradeDate: "2024-01-20",
		units: 100,
		price: 46,
		brokerage: 9.95
	}),
	tx({
		id: "l-mqg",
		accountId: "acc-leo",
		ticker: "MQG.AX",
		type: "BUY",
		tradeDate: "2024-12-12",
		units: 15,
		price: 220,
		brokerage: 9.95
	}),
	tx({
		id: "l-tcl",
		accountId: "acc-leo",
		ticker: "TCL.AX",
		type: "BUY",
		tradeDate: "2024-05-06",
		units: 100,
		price: 13.2,
		brokerage: 9.95
	}),
	tx({
		id: "l-vas-div-1",
		accountId: "acc-leo",
		ticker: "VAS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-07-18",
		frankedAud: 220,
		unfrankedAud: 40
	}),
	tx({
		id: "l-bhp-div",
		accountId: "acc-leo",
		ticker: "BHP.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-09-26",
		frankedAud: 93
	}),
	tx({
		id: "l-vas-div-2",
		accountId: "acc-leo",
		ticker: "VAS.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-10-16",
		frankedAud: 240,
		unfrankedAud: 30
	}),
	tx({
		id: "l-mqg-div",
		accountId: "acc-leo",
		ticker: "MQG.AX",
		type: "DIVIDEND_CASH",
		tradeDate: "2025-11-12",
		frankedAud: 420
	}),
	tx({
		id: "l-split",
		accountId: "acc-leo",
		ticker: "TCL.AX",
		type: "SPLIT",
		tradeDate: "2025-11-03",
		splitRatio: 2,
		note: "2-for-1"
	}),
	tx({
		id: "l-vas-s",
		accountId: "acc-leo",
		ticker: "VAS.AX",
		type: "SELL",
		tradeDate: "2026-02-10",
		units: 10,
		price: 112,
		brokerage: 9.95
	})
];
function samplePortfolio() {
	return {
		version: 1,
		accounts: [
			{
				id: "acc-harper",
				name: "Harper Chen",
				ownerType: "Individual",
				tfnStatus: "Quoted"
			},
			{
				id: "acc-ava",
				name: "Ava Chen",
				ownerType: "Minor_Designated",
				tfnStatus: "Quoted"
			},
			{
				id: "acc-noah",
				name: "Noah Chen",
				ownerType: "Minor_Direct",
				tfnStatus: "Quoted"
			},
			{
				id: "acc-mia",
				name: "Mia Chen",
				ownerType: "Minor_Direct",
				tfnStatus: "Quoted"
			},
			{
				id: "acc-leo",
				name: "Leo Chen",
				ownerType: "Minor_Direct",
				tfnStatus: "Quoted"
			}
		],
		securities,
		transactions,
		settings: {
			cgtMethod: "FIFO",
			financialYear: "2025-26",
			valuationDate: "2026-10-21",
			benchmarkRates: {
				au: .085,
				intl: .1,
				reit: .06,
				cash: .04
			},
			openingLosses: {}
		}
	};
}
function emptyPortfolio() {
	const base = samplePortfolio();
	return {
		...base,
		securities: base.securities.map((s) => ({ ...s })),
		transactions: [],
		settings: {
			...base.settings,
			openingLosses: {}
		}
	};
}
/**
* On-device seal. The passphrase is used only to derive a non-extractable
* AES-256-GCM key, then discarded by the caller. The key is never written
* to storage. OWASP's PBKDF2-SHA256 floor is 600,000 iterations; older
* seals from 100,000 upward still open.
*/
var KDF_ITERATIONS = 6e5;
var IDLE_LOCK_MS = 3e5;
var HIDDEN_LOCK_MS = 6e4;
var B64 = /^[A-Za-z0-9+/]+={0,2}$/;
var COMMON_PASSPHRASES = /* @__PURE__ */ new Set([
	"password",
	"passphrase",
	"password123",
	"passphrase123",
	"helioledger",
	"letmeinplease",
	"qwertyuiopas",
	"123456789012",
	"changeme123",
	"iloveyou123"
]);
function vaultAvailable() {
	return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}
function passphraseIssue(passphrase) {
	if (passphrase.length < 12) return "Use at least 12 characters. A short sentence works well.";
	if (passphrase.length > 128) return "Use at most 128 characters.";
	if (/^\s|\s$/.test(passphrase)) return "Don't start or end with a space.";
	if (COMMON_PASSPHRASES.has(passphrase.toLowerCase())) return "That passphrase is too common.";
	if (/^(.)\1+$/.test(passphrase)) return "Don't repeat a single character.";
	if (passphrase.length < 16 && (!/[A-Za-z]/.test(passphrase) || !/\d/.test(passphrase))) return "Under 16 characters, include a letter and a number — or use a longer sentence.";
	return null;
}
function bytesToB64(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
function b64ToBytes(value) {
	if (!B64.test(value) || value.length % 4 !== 0) return null;
	try {
		const binary = atob(value);
		const out = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
		return out;
	} catch {
		return null;
	}
}
function iterationsOk(iterations) {
	return Number.isInteger(iterations) && iterations >= 1e5 && iterations <= 1e6;
}
async function deriveKey(passphrase, salt, iterations) {
	const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
	return crypto.subtle.deriveKey({
		name: "PBKDF2",
		salt,
		iterations,
		hash: "SHA-256"
	}, base, {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
}
function isSealedRecord(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	if (row.kind !== "sealed" || row.kdf !== "PBKDF2-SHA256") return false;
	if (!iterationsOk(row.iterations)) return false;
	if (typeof row.salt !== "string" || typeof row.iv !== "string" || typeof row.ct !== "string") return false;
	if (!B64.test(row.salt) || !B64.test(row.iv) || !B64.test(row.ct)) return false;
	if (row.salt.length < 16 || row.iv.length < 8 || row.ct.length < 16 || row.ct.length > 5e6) return false;
	return true;
}
async function createSession(passphrase) {
	if (!vaultAvailable()) throw new Error("This browser cannot seal a ledger.");
	const issue = passphraseIssue(passphrase);
	if (issue) throw new Error(issue);
	const salt = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	return {
		key: await deriveKey(passphrase, salt, KDF_ITERATIONS),
		salt: bytesToB64(salt),
		iterations: KDF_ITERATIONS
	};
}
async function openSession(passphrase, record) {
	if (!vaultAvailable() || !isSealedRecord(record)) return null;
	try {
		const salt = b64ToBytes(record.salt);
		const iv = b64ToBytes(record.iv);
		const ct = b64ToBytes(record.ct);
		if (!salt || !iv || !ct || salt.length !== 16 || iv.length !== 12) return null;
		const key = await deriveKey(passphrase, salt, record.iterations);
		const plain = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv
		}, key, ct);
		return {
			plain: new TextDecoder().decode(plain),
			session: {
				key,
				salt: record.salt,
				iterations: record.iterations
			}
		};
	} catch {
		return null;
	}
}
async function sealWithSession(session, json) {
	const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const ct = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, session.key, new TextEncoder().encode(json));
	return {
		kind: "sealed",
		kdf: "PBKDF2-SHA256",
		iterations: session.iterations,
		salt: session.salt,
		iv: bytesToB64(iv),
		ct: bytesToB64(new Uint8Array(ct))
	};
}
var LEDGER_KEY = "helio.ledger.v1";
var bannedKey = /^(tfn|taxfile|taxfilenumber|tax_file|tax_file_number|password|passphrase|secret|bsb|accountnumber|account_number)$/i;
var finite = number().finite();
var money = finite.min(0).max(1e9);
var ticker = string().trim().min(1).max(16).regex(/^[A-Z0-9]+(\.[A-Z0-9]+)?$/, "Use an exchange code such as VAS.AX");
var portfolioSchema = object({
	version: literal(1),
	accounts: array(object({
		id: string().min(1).max(40),
		name: string().trim().min(1).max(60),
		ownerType: _enum([
			"Individual",
			"Minor_Designated",
			"Minor_Direct"
		]),
		tfnStatus: _enum(["Quoted", "Not quoted"])
	})).min(1).max(12),
	securities: array(object({
		ticker,
		name: string().trim().min(1).max(80),
		gicsSector: string().trim().min(1).max(40),
		assetClass: _enum([
			"AU Equities",
			"Intl Equities",
			"REITs",
			"Cash"
		]),
		exchange: string().trim().min(1).max(16),
		companyTaxRate: number().refine((n) => n === .25 || n === .3, "Use 25% or 30%"),
		lastPrice: money
	})).max(200),
	transactions: array(object({
		id: string().min(1).max(60),
		accountId: string().min(1).max(40),
		ticker,
		type: _enum([
			"BUY",
			"SELL",
			"DIVIDEND_CASH",
			"DIVIDEND_DRP",
			"SPLIT",
			"RETURN_OF_CAPITAL"
		]),
		tradeDate: string().regex(/^\d{4}-\d{2}-\d{2}$/),
		units: money,
		price: money,
		brokerage: money,
		totalAud: finite.min(-1e9).max(1e9),
		unfrankedAud: money,
		frankedAud: money,
		companyTaxRate: number().refine((n) => n === .25 || n === .3),
		drpPrice: money,
		splitRatio: finite.min(0).max(100),
		note: string().max(280)
	})).max(5e3),
	settings: object({
		cgtMethod: _enum([
			"FIFO",
			"LIFO",
			"MIN_TAX"
		]),
		financialYear: string().regex(/^\d{4}-\d{2}$/),
		valuationDate: string().regex(/^\d{4}-\d{2}-\d{2}$/),
		benchmarkRates: object({
			au: finite.min(-.5).max(.5),
			intl: finite.min(-.5).max(.5),
			reit: finite.min(-.5).max(.5),
			cash: finite.min(-.5).max(.5)
		}),
		openingLosses: record(string().max(40), money)
	})
});
function rejectSensitiveKeys(value) {
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
function parsePortfolioJson(raw) {
	const blocked = rejectSensitiveKeys(raw);
	if (blocked) return {
		ok: false,
		error: blocked
	};
	const parsed = portfolioSchema.safeParse(raw);
	if (!parsed.success) return {
		ok: false,
		error: "That file is not a Helio ledger."
	};
	if (new Set(parsed.data.accounts.map((a) => a.id)).size !== parsed.data.accounts.length) return {
		ok: false,
		error: "Account ids must be unique."
	};
	if (new Set(parsed.data.securities.map((s) => s.ticker)).size !== parsed.data.securities.length) return {
		ok: false,
		error: "Tickers must be unique."
	};
	if (!parsed.data.accounts.some((a) => a.ownerType === "Individual")) return {
		ok: false,
		error: "Keep at least one individual account for trustee income."
	};
	return {
		ok: true,
		portfolio: parsed.data
	};
}
function isSealed(value) {
	return isSealedRecord(value);
}
function readStorage() {
	if (typeof localStorage === "undefined") return { kind: "empty" };
	const raw = localStorage.getItem(LEDGER_KEY);
	if (!raw) return { kind: "empty" };
	try {
		const json = JSON.parse(raw);
		if (isSealed(json)) return {
			kind: "sealed",
			record: json
		};
		if (json && typeof json === "object" && json.kind === "open") {
			const parsed = parsePortfolioJson(json.portfolio);
			if (!parsed.ok) return {
				kind: "corrupt",
				message: parsed.error
			};
			return {
				kind: "open",
				portfolio: parsed.portfolio
			};
		}
		return {
			kind: "corrupt",
			message: "The saved ledger could not be read."
		};
	} catch {
		return {
			kind: "corrupt",
			message: "The saved ledger could not be read."
		};
	}
}
function writeOpen(portfolio) {
	localStorage.setItem(LEDGER_KEY, JSON.stringify({
		kind: "open",
		portfolio
	}));
}
function writeSealed(record) {
	localStorage.setItem(LEDGER_KEY, JSON.stringify(record));
}
function clearStorage() {
	localStorage.removeItem(LEDGER_KEY);
}
/** A live seal always wins. Otherwise a readable copy is written only after an explicit choice. */
function persistenceMode(hasSession, plainStored) {
	if (hasSession) return "sealed";
	if (plainStored) return "plain";
	return "memory";
}
var PortfolioContext = (0, import_react.createContext)(null);
function PortfolioProvider({ children }) {
	const [portfolio, setPortfolio] = (0, import_react.useState)(() => samplePortfolio());
	const [source, setSource] = (0, import_react.useState)("sample");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [sealed, setSealed] = (0, import_react.useState)(false);
	const [plainStored, setPlainStored] = (0, import_react.useState)(false);
	const [unsaved, setUnsaved] = (0, import_react.useState)(false);
	const [corrupt, setCorrupt] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [lockReason, setLockReason] = (0, import_react.useState)(null);
	const [cooldownUntil, setCooldownUntil] = (0, import_react.useState)(0);
	const portfolioRef = (0, import_react.useRef)(portfolio);
	const sessionRef = (0, import_react.useRef)(null);
	const sealedRef = (0, import_react.useRef)(null);
	const plainStoredRef = (0, import_react.useRef)(false);
	const unsavedRef = (0, import_react.useRef)(false);
	const hydratedRef = (0, import_react.useRef)(false);
	const chain = (0, import_react.useRef)(Promise.resolve());
	const epoch = (0, import_react.useRef)(0);
	const failsRef = (0, import_react.useRef)(0);
	const waitUntilRef = (0, import_react.useRef)(0);
	const canSeal = vaultAvailable();
	portfolioRef.current = portfolio;
	const blankMemory = () => {
		const blank = emptyPortfolio();
		portfolioRef.current = blank;
		setPortfolio(blank);
	};
	const dropSession = () => {
		sessionRef.current = null;
	};
	const markPlain = (value) => {
		plainStoredRef.current = value;
		setPlainStored(value);
	};
	const markUnsaved = (value) => {
		unsavedRef.current = value;
		setUnsaved(value);
	};
	(0, import_react.useEffect)(() => {
		const loaded = readStorage();
		if (loaded.kind === "corrupt") {
			setCorrupt(loaded.message);
			const blank = emptyPortfolio();
			portfolioRef.current = blank;
			setPortfolio(blank);
			markPlain(false);
		} else if (loaded.kind === "sealed") {
			sealedRef.current = loaded.record;
			setSealed(true);
			setLocked(true);
			markPlain(false);
			const blank = emptyPortfolio();
			portfolioRef.current = blank;
			setPortfolio(blank);
		} else if (loaded.kind === "open") {
			portfolioRef.current = loaded.portfolio;
			setPortfolio(loaded.portfolio);
			setSource("saved");
			markPlain(true);
		} else markPlain(false);
		hydratedRef.current = true;
		setHydrated(true);
	}, []);
	const persist = (next) => {
		const ticket = ++epoch.current;
		const session = sessionRef.current;
		const snapshot = JSON.stringify(next);
		chain.current = chain.current.then(async () => {
			if (ticket !== epoch.current) return;
			if (session) {
				const record = await sealWithSession(session, snapshot);
				if (ticket !== epoch.current) return;
				if (sessionRef.current && sessionRef.current !== session) return;
				sealedRef.current = record;
				writeSealed(record);
				return;
			}
			if (ticket !== epoch.current || sessionRef.current) return;
			if (persistenceMode(false, plainStoredRef.current) !== "plain") return;
			writeOpen(JSON.parse(snapshot));
		}).catch(() => setNotice("The ledger could not be saved in this browser."));
	};
	const commit = (next, savedNotice) => {
		if (!hydratedRef.current) return false;
		const parsed = parsePortfolioJson(next);
		if (!parsed.ok) {
			setNotice(parsed.error);
			return false;
		}
		portfolioRef.current = parsed.portfolio;
		setPortfolio(parsed.portfolio);
		const durable = persistenceMode(Boolean(sessionRef.current), plainStoredRef.current) !== "memory";
		setSource(durable ? "saved" : "memory");
		markUnsaved(!durable);
		setCorrupt(null);
		persist(parsed.portfolio);
		if (savedNotice) setNotice(savedNotice);
		return true;
	};
	const update = (recipe) => commit(recipe(portfolioRef.current));
	const replace = (next) => {
		commit(next, "Ledger replaced on this device.");
	};
	const tooManyAttempts = () => Date.now() < waitUntilRef.current;
	const noteFailure = () => {
		failsRef.current += 1;
		if (failsRef.current >= 5) {
			failsRef.current = 0;
			const until = Date.now() + 3e4;
			waitUntilRef.current = until;
			setCooldownUntil(until);
		}
	};
	const unlock = async (passphrase) => {
		const record = sealedRef.current;
		if (!record) return "denied";
		if (tooManyAttempts()) return "cooldown";
		setBusy(true);
		const opened = await openSession(passphrase, record);
		setBusy(false);
		if (!opened) {
			noteFailure();
			return Date.now() < waitUntilRef.current ? "cooldown" : "denied";
		}
		try {
			const parsed = parsePortfolioJson(JSON.parse(opened.plain));
			if (!parsed.ok) {
				setCorrupt(parsed.error);
				setLocked(false);
				dropSession();
				return "denied";
			}
			failsRef.current = 0;
			waitUntilRef.current = 0;
			setCooldownUntil(0);
			sessionRef.current = opened.session;
			portfolioRef.current = parsed.portfolio;
			setPortfolio(parsed.portfolio);
			setSource("saved");
			markPlain(false);
			markUnsaved(false);
			setLocked(false);
			setLockReason(null);
			return "ok";
		} catch {
			return "denied";
		}
	};
	const lock = () => {
		if (!sealedRef.current && !sessionRef.current) return;
		dropSession();
		blankMemory();
		setLocked(true);
	};
	const seal = async (passphrase) => {
		const issue = passphraseIssue(passphrase);
		if (issue) {
			setNotice(issue);
			return false;
		}
		if (!canSeal) {
			setNotice("This browser cannot seal a ledger.");
			return false;
		}
		setBusy(true);
		const ticket = ++epoch.current;
		const job = chain.current.then(async () => {
			const session = await createSession(passphrase);
			if (ticket !== epoch.current) {
				setNotice("Seal cancelled because the ledger changed.");
				return false;
			}
			sessionRef.current = session;
			const record = await sealWithSession(session, JSON.stringify(portfolioRef.current));
			if (ticket !== epoch.current || sessionRef.current !== session) {
				if (sessionRef.current === session) dropSession();
				setNotice("Seal cancelled because the ledger changed.");
				return false;
			}
			sealedRef.current = record;
			writeSealed(record);
			markPlain(false);
			markUnsaved(false);
			setSealed(true);
			setSource("saved");
			setNotice("Sealed. Nothing readable is stored. The passphrase is not saved, and the screen locks after 5 idle minutes or 1 minute in a hidden tab.");
			return true;
		}).catch(() => {
			setNotice("The ledger could not be sealed in this browser.");
			return false;
		}).finally(() => setBusy(false));
		chain.current = job.then(() => void 0);
		return job;
	};
	const unseal = async (passphrase) => {
		const record = sealedRef.current;
		if (!record) return "denied";
		if (tooManyAttempts()) return "cooldown";
		setBusy(true);
		const opened = await openSession(passphrase, record);
		setBusy(false);
		if (!opened) {
			noteFailure();
			return Date.now() < waitUntilRef.current ? "cooldown" : "denied";
		}
		try {
			const parsed = parsePortfolioJson(JSON.parse(opened.plain));
			if (!parsed.ok) {
				setCorrupt(parsed.error);
				return "denied";
			}
			epoch.current += 1;
			dropSession();
			sealedRef.current = null;
			clearStorage();
			markPlain(false);
			portfolioRef.current = parsed.portfolio;
			setPortfolio(parsed.portfolio);
			setSealed(false);
			setSource("memory");
			markUnsaved(true);
			failsRef.current = 0;
			waitUntilRef.current = 0;
			setCooldownUntil(0);
			setNotice("Seal removed. The encrypted copy was deleted and no readable copy was written. This tab still has the ledger until you leave or seal it again.");
			return "ok";
		} catch {
			return "denied";
		}
	};
	const installSealed = (record) => {
		if (!isSealedRecord(record)) return false;
		epoch.current += 1;
		dropSession();
		sealedRef.current = record;
		writeSealed(record);
		markPlain(false);
		markUnsaved(false);
		setSealed(true);
		setLocked(true);
		setLockReason("Sealed backup restored. Unlock it with that backup's passphrase.");
		setSource("saved");
		setCorrupt(null);
		blankMemory();
		return true;
	};
	const exportBackup = async () => {
		await chain.current;
		if (sessionRef.current && sealedRef.current) return {
			filename: "helio-ledger.sealed.json",
			body: JSON.stringify(sealedRef.current),
			encrypted: true
		};
		return {
			filename: "helio-ledger.json",
			body: JSON.stringify(portfolioRef.current, null, 2),
			encrypted: false
		};
	};
	const rememberPlain = () => {
		if (sessionRef.current || sealedRef.current) {
			setNotice("A sealed ledger is not also stored in readable form.");
			return;
		}
		const parsed = parsePortfolioJson(portfolioRef.current);
		if (!parsed.ok) {
			setNotice(parsed.error);
			return;
		}
		markPlain(true);
		writeOpen(parsed.portfolio);
		setSource("saved");
		markUnsaved(false);
		setNotice("A readable copy is now stored in this browser. Anyone who can open it can read the ledger.");
	};
	const forgetPlain = () => {
		if (sessionRef.current || sealedRef.current) return;
		epoch.current += 1;
		clearStorage();
		markPlain(false);
		setSource("memory");
		markUnsaved(true);
		setNotice("Readable copy removed. This tab still has the ledger until you leave or seal it.");
	};
	const restoreDemo = () => {
		epoch.current += 1;
		dropSession();
		sealedRef.current = null;
		clearStorage();
		markPlain(false);
		markUnsaved(false);
		const demo = samplePortfolio();
		portfolioRef.current = demo;
		setPortfolio(demo);
		setSealed(false);
		setLocked(false);
		setLockReason(null);
		setCorrupt(null);
		setSource("sample");
		setNotice("Demo family is in this tab only. It is not stored on this device.");
	};
	const erase = () => {
		epoch.current += 1;
		dropSession();
		sealedRef.current = null;
		clearStorage();
		markPlain(false);
		markUnsaved(false);
		const blank = emptyPortfolio();
		portfolioRef.current = blank;
		setPortfolio(blank);
		setSealed(false);
		setLocked(false);
		setLockReason(null);
		setCorrupt(null);
		setSource("memory");
		setNotice("Ledger deleted from this browser. This tab is blank. A reload shows the demo, not your old figures.");
	};
	(0, import_react.useEffect)(() => {
		if (!unsaved) return;
		const onBefore = (event) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", onBefore);
		return () => window.removeEventListener("beforeunload", onBefore);
	}, [unsaved]);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !sealed || locked) return;
		let idleTimer = window.setTimeout(() => lock(), IDLE_LOCK_MS);
		let hiddenTimer;
		const bump = () => {
			window.clearTimeout(idleTimer);
			idleTimer = window.setTimeout(() => lock(), IDLE_LOCK_MS);
		};
		const onVis = () => {
			if (document.visibilityState === "hidden") hiddenTimer = window.setTimeout(() => lock(), HIDDEN_LOCK_MS);
			else if (hiddenTimer) {
				window.clearTimeout(hiddenTimer);
				hiddenTimer = void 0;
			}
		};
		const onPageHide = () => lock();
		const onPageShow = (event) => {
			if (event.persisted) lock();
		};
		window.addEventListener("pointerdown", bump);
		window.addEventListener("keydown", bump);
		document.addEventListener("visibilitychange", onVis);
		window.addEventListener("pagehide", onPageHide);
		window.addEventListener("pageshow", onPageShow);
		return () => {
			window.clearTimeout(idleTimer);
			if (hiddenTimer) window.clearTimeout(hiddenTimer);
			window.removeEventListener("pointerdown", bump);
			window.removeEventListener("keydown", bump);
			document.removeEventListener("visibilitychange", onVis);
			window.removeEventListener("pagehide", onPageHide);
			window.removeEventListener("pageshow", onPageShow);
		};
	}, [
		hydrated,
		sealed,
		locked
	]);
	(0, import_react.useEffect)(() => {
		const onStorage = (event) => {
			if (event.key !== "helio.ledger.v1") return;
			epoch.current += 1;
			dropSession();
			const loaded = readStorage();
			if (loaded.kind === "sealed") {
				sealedRef.current = loaded.record;
				markPlain(false);
				markUnsaved(false);
				setSealed(true);
				setLocked(true);
				setLockReason("Locked because this ledger changed in another tab.");
				blankMemory();
				return;
			}
			if (loaded.kind === "open") {
				sealedRef.current = null;
				setSealed(false);
				setLocked(false);
				setLockReason(null);
				markPlain(true);
				markUnsaved(false);
				portfolioRef.current = loaded.portfolio;
				setPortfolio(loaded.portfolio);
				setSource("saved");
				setNotice("This tab picked up a ledger change from another tab.");
				return;
			}
			if (loaded.kind === "empty") {
				sealedRef.current = null;
				markPlain(false);
				setSealed(false);
				setLocked(false);
				if (unsavedRef.current) {
					setNotice("The saved copy was removed in another tab. This tab still has unsaved edits.");
					return;
				}
				const demo = samplePortfolio();
				portfolioRef.current = demo;
				setPortfolio(demo);
				setSource("sample");
				return;
			}
			setCorrupt(loaded.message);
			setLocked(false);
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);
	const sim = (0, import_react.useMemo)(() => simulate(portfolio, portfolio.settings.cgtMethod), [portfolio]);
	const value = {
		portfolio,
		source,
		hydrated,
		locked,
		sealed,
		plainStored,
		unsaved,
		canSeal,
		corrupt,
		busy,
		notice,
		lockReason,
		cooldownUntil,
		sim,
		positions: (0, import_react.useMemo)(() => buildPositions(sim, portfolio), [sim, portfolio]),
		reports: (0, import_react.useMemo)(() => reportForFy(sim, portfolio, portfolio.settings.financialYear), [sim, portfolio]),
		setNotice,
		update,
		replace,
		unlock,
		lock,
		seal,
		unseal,
		installSealed,
		rememberPlain,
		forgetPlain,
		exportBackup,
		restoreDemo,
		erase
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioContext.Provider, {
		value,
		children
	});
}
function usePortfolio() {
	const value = (0, import_react.useContext)(PortfolioContext);
	if (!value) throw new Error("Portfolio missing");
	return value;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonStyles = cva("inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50", {
	variants: {
		variant: {
			primary: "border-teal bg-teal text-bg hover:opacity-90",
			ghost: "border-line bg-surface text-fg hover:border-teal",
			quiet: "border-transparent bg-transparent text-muted hover:text-fg",
			danger: "border-coral/40 bg-transparent text-coral hover:bg-coral/10"
		},
		size: {
			md: "min-h-11 px-4",
			sm: "min-h-11 px-3 text-xs"
		}
	},
	defaultVariants: {
		variant: "ghost",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonStyles({
			variant,
			size
		}), className),
		...props
	});
}
function Modal({ open, title, description, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-bg/75 backdrop-blur-sm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed top-1/2 left-1/2 z-50 max-h-[min(88vh,820px)] w-[min(100%-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-surface p-5 text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-xl font-semibold",
					children: title
				}),
				description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-1 text-sm text-muted",
					children: description
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children
				})
			]
		})] })
	});
}
var fieldClass = "min-h-11 w-full rounded-xl border border-line bg-raise px-3 text-sm text-fg outline-none";
function TextField({ label, hint, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1 text-sm text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				...props,
				className: cn(fieldClass, props.className)
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
function SelectField({ label, hint, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1 text-sm text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				...props,
				className: cn(fieldClass, props.className),
				children
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
function Stat({ label, value, hint, tone = "fg" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-card border border-line bg-surface/90 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-wide text-faint uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-2 font-mono text-2xl font-medium tabular-nums", tone === "mint" ? "text-mint" : tone === "coral" ? "text-coral" : tone === "teal" ? "text-teal" : "text-fg"),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
function sum(values) {
	return values.reduce((total, value) => total + value, 0);
}
function Cockpit({ accountId, positions, reports, warnings }) {
	const { portfolio } = usePortfolio();
	const visible = positions.filter((row) => accountId === "all" || row.accountId === accountId);
	const market = sum(visible.map((row) => row.marketValue));
	const cost = sum(visible.map((row) => row.costBase));
	const unrealised = market - cost;
	const bench = sum(visible.map((row) => row.benchmarkValue));
	const unitCount = sum(visible.map((row) => row.units));
	const readyUnits = sum(visible.map((row) => row.discountReadyUnits));
	const readyShare = unitCount > 0 ? readyUnits / unitCount : 0;
	const byClass = /* @__PURE__ */ new Map();
	const bySector = /* @__PURE__ */ new Map();
	for (const row of visible) {
		byClass.set(row.assetClass, (byClass.get(row.assetClass) ?? 0) + row.marketValue);
		bySector.set(row.gicsSector, (bySector.get(row.gicsSector) ?? 0) + row.marketValue);
	}
	const classRows = [...byClass.entries()].map(([name, value]) => ({
		name,
		value
	})).sort((a, b) => b.value - a.value);
	const sectorRows = [...bySector.entries()].map(([name, value]) => ({
		name,
		value
	})).sort((a, b) => b.value - a.value);
	const score = diversificationScore(sectorRows.map((row) => market > 0 ? row.value / market : 0));
	const account = portfolio.accounts.find((item) => item.id === accountId);
	const relevantReports = accountId === "all" ? reports : reports.filter((report) => report.includesAccountIds.includes(accountId) || report.entityAccountId === accountId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Market value",
						value: money$1(market),
						hint: "At your manual marks"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Cost base",
						value: money$1(cost),
						hint: "Open parcels, brokerage in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Unrealised",
						value: moneySigned(unrealised),
						tone: unrealised >= 0 ? "mint" : "coral",
						hint: cost > 0 ? pct(unrealised / cost) : "No cost base"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Discount-ready",
						value: pct(readyShare).replace("+", ""),
						tone: "teal",
						hint: "Units held more than 365 days"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "glow-card rounded-card border border-line bg-surface/90 p-4 lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "Allocation"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-faint",
							children: "Asset class · market value"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid items-center gap-2 md:grid-cols-[13rem_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationChart, { rows: classRows }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "grid gap-2",
							children: [classRows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-2.5 rounded-full",
										style: { background: CHART_FILLS[index % CHART_FILLS.length] }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs tabular-nums text-muted",
										children: [
											market > 0 ? `${Math.round(row.value / market * 100)}%` : "—",
											" · ",
											money$1(row.value)
										]
									})
								]
							}, row.name)), classRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted",
								children: "Record a buy to see the mix."
							}) : null]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-surface/90 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold",
									children: "Spread"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-sm text-teal tabular-nums",
									children: score
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [scoreLabel(score), " across GICS sectors. 100 is perfectly even."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 h-2 overflow-hidden rounded-full bg-raise",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-teal",
									style: { width: `${score}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 grid gap-1.5",
								children: sectorRows.slice(0, 5).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "grid grid-cols-[1fr_auto] gap-2 text-xs text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular-nums",
										children: market > 0 ? `${Math.round(row.value / market * 100)}%` : "—"
									})]
								}, row.name))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-surface/90 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-semibold",
								children: "Vs your benchmark"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: moneySigned(market - bench).startsWith("+") ? "mt-2 font-mono text-2xl text-mint tabular-nums" : "mt-2 font-mono text-2xl text-coral tabular-nums",
								children: moneySigned(market - bench)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted",
								children: [
									"Marks ",
									money$1(market),
									" against ",
									money$1(bench),
									". Rates compound from each parcel to ",
									portfolio.settings.valuationDate,
									". Illustrative only — not a live index."
								]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 md:grid-cols-2",
				children: [
					relevantReports.filter((report) => report.minor?.applies).map((report) => {
						const owner = portfolio.accounts.find((item) => item.id === report.entityAccountId);
						const band = report.minor?.band;
						const hot = band !== "nil";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-card border border-line bg-surface/90 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-wide text-faint uppercase",
									children: "Section 102AA · unearned dividends"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 text-lg font-semibold",
									children: owner ? firstName(owner.name) : "Minor"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: hot ? "mt-2 font-mono text-xl text-coral tabular-nums" : "mt-2 font-mono text-xl text-mint tabular-nums",
									children: money$1(report.grossDividends)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: band === "nil" ? `${money$1(report.minor?.roomTo416 ?? 0)} of room under the $416 tax-free amount.` : band === "penalty66" ? `Inside the 66% band. Illustrative tax ${money$1(report.minor?.illustrativeTax ?? 0)}.` : `Over $1,307. Illustrative tax is 45% of the whole amount: ${money$1(report.minor?.illustrativeTax ?? 0)}.`
								})
							]
						}, report.entityAccountId);
					}),
					account?.ownerType === "Minor_Designated" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-surface/90 p-4 md:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-semibold",
							children: "Reported with the adult"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [firstName(account.name), " is a designated minor. Dividends are taxed at the adult's marginal rate and CGT stays with the trustee. Open the individual account for the combined worksheet."]
						})]
					}) : null,
					warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-coral/40 bg-surface/90 p-4 md:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-semibold text-coral",
							children: "Ledger warnings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 grid gap-1 text-sm text-muted",
							children: warnings.slice(0, 4).map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: warning.message }, `${warning.txId}-${warning.code}`))
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-card border border-line bg-surface/90 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Largest positions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid gap-2",
					children: [visible.slice(0, 6).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[1fr_auto] gap-2 border-b border-line/70 py-2 text-sm last:border-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: row.ticker
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								units(row.units),
								" · ",
								row.name
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono tabular-nums",
								children: money$1(row.marketValue)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: row.unrealised >= 0 ? "font-mono text-xs text-mint tabular-nums" : "font-mono text-xs text-coral tabular-nums",
								children: moneySigned(row.unrealised)
							})]
						})]
					}, `${row.accountId}-${row.ticker}`)), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No open parcels in this view."
					}) : null]
				})]
			})
		]
	});
}
var TYPES = [
	"BUY",
	"SELL",
	"DIVIDEND_CASH",
	"DIVIDEND_DRP",
	"SPLIT",
	"RETURN_OF_CAPITAL"
];
function num(value) {
	const trimmed = value.trim();
	if (!trimmed) return 0;
	if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1e9) return null;
	return parsed;
}
function TransactionDialog({ initial, presetAccount, onClose }) {
	const { portfolio, update } = usePortfolio();
	const [error, setError] = (0, import_react.useState)(null);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [accountId, setAccountId] = (0, import_react.useState)(initial?.accountId ?? (presetAccount === "all" ? portfolio.accounts[0]?.id ?? "" : presetAccount));
	const [tickerChoice, setTickerChoice] = (0, import_react.useState)(initial?.ticker ?? portfolio.securities[0]?.ticker ?? "__new");
	const [newTicker, setNewTicker] = (0, import_react.useState)("");
	const [securityName, setSecurityName] = (0, import_react.useState)("");
	const [sector, setSector] = (0, import_react.useState)("Diversified");
	const [assetClass, setAssetClass] = (0, import_react.useState)("AU Equities");
	const [taxRate, setTaxRate] = (0, import_react.useState)("0.3");
	const [mark, setMark] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)(initial?.type ?? "BUY");
	const [tradeDate, setTradeDate] = (0, import_react.useState)(initial?.tradeDate ?? portfolio.settings.valuationDate);
	const [unitsValue, setUnitsValue] = (0, import_react.useState)(initial ? String(initial.units || "") : "");
	const [price, setPrice] = (0, import_react.useState)(initial ? String(initial.price || "") : "");
	const [brokerage, setBrokerage] = (0, import_react.useState)(initial ? String(initial.brokerage || "") : "");
	const [unfranked, setUnfranked] = (0, import_react.useState)(initial ? String(initial.unfrankedAud || "") : "");
	const [franked, setFranked] = (0, import_react.useState)(initial ? String(initial.frankedAud || "") : "");
	const [eventRate, setEventRate] = (0, import_react.useState)(initial?.companyTaxRate === .25 ? "0.25" : "0.3");
	const [drpPrice, setDrpPrice] = (0, import_react.useState)(initial ? String(initial.drpPrice || "") : "");
	const [splitRatio, setSplitRatio] = (0, import_react.useState)(initial?.splitRatio ? String(initial.splitRatio) : "2");
	const [note, setNote] = (0, import_react.useState)(initial?.note ?? "");
	const ticker = tickerChoice === "__new" ? newTicker.trim().toUpperCase() : tickerChoice;
	const preview = (0, import_react.useMemo)(() => {
		const draft = blankTransaction({
			type,
			units: num(unitsValue) ?? 0,
			price: num(price) ?? 0,
			brokerage: num(brokerage) ?? 0,
			unfrankedAud: num(unfranked) ?? 0,
			frankedAud: num(franked) ?? 0,
			companyTaxRate: Number(eventRate)
		});
		const credit = frankingCredit(draft.frankedAud, draft.companyTaxRate);
		return {
			total: tradeTotal(draft),
			credit,
			gross: draft.unfrankedAud + draft.frankedAud + credit
		};
	}, [
		type,
		unitsValue,
		price,
		brokerage,
		unfranked,
		franked,
		eventRate
	]);
	const save = () => {
		const unitsN = num(unitsValue);
		const priceN = num(price);
		const brokerageN = num(brokerage);
		const unfrankedN = num(unfranked);
		const frankedN = num(franked);
		const drpN = num(drpPrice);
		const splitN = num(splitRatio);
		const markN = num(mark);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) return setError("Use a real date.");
		if ([
			unitsN,
			priceN,
			brokerageN,
			unfrankedN,
			frankedN,
			drpN,
			splitN
		].some((value) => value === null)) return setError("Amounts need to be plain numbers, zero or more.");
		if (!/^[A-Z0-9]+(\.[A-Z0-9]+)?$/.test(ticker)) return setError("Ticker should look like VAS.AX.");
		if (tickerChoice === "__new" && (!securityName.trim() || markN === null)) return setError("New tickers need a name and a mark.");
		if ((type === "BUY" || type === "SELL") && !(unitsN > 0)) return setError("Enter the units.");
		if (type === "DIVIDEND_DRP" && !(drpN > 0)) return setError("DRP needs an issue price.");
		if (type === "SPLIT" && (splitN === 1 || !(splitN > 0))) return setError("Split ratio should be like 2 or 0.5.");
		if (type === "RETURN_OF_CAPITAL" && !(priceN > 0)) return setError("Enter the capital returned per unit.");
		const tx = blankTransaction({
			id: initial?.id ?? crypto.randomUUID(),
			accountId,
			ticker,
			type,
			tradeDate,
			units: unitsN ?? 0,
			price: priceN ?? 0,
			brokerage: brokerageN ?? 0,
			unfrankedAud: unfrankedN ?? 0,
			frankedAud: frankedN ?? 0,
			companyTaxRate: Number(eventRate),
			drpPrice: drpN ?? 0,
			splitRatio: type === "SPLIT" ? splitN ?? 0 : 0,
			note: note.slice(0, 280)
		});
		tx.totalAud = tradeTotal(tx);
		update((current) => {
			let securities = current.securities;
			if (!securities.some((security) => security.ticker === ticker)) securities = [...securities, {
				ticker,
				name: securityName.trim(),
				gicsSector: sector.trim() || "Unclassified",
				assetClass,
				exchange: "ASX",
				companyTaxRate: Number(taxRate),
				lastPrice: markN ?? 0
			}];
			const transactions = initial ? current.transactions.map((row) => row.id === initial.id ? tx : row) : [...current.transactions, tx];
			return {
				...current,
				securities,
				transactions
			};
		});
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: true,
		title: initial ? "Edit event" : "Record event",
		description: "Stored only in this browser. Franking credits are calculated from the company tax rate. A TFN is never asked for.",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
					label: "Account",
					value: accountId,
					onChange: (event) => setAccountId(event.target.value),
					children: portfolio.accounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: account.id,
						children: [
							account.name,
							" · ",
							ownerLabel(account.ownerType)
						]
					}, account.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
					label: "Ticker",
					value: tickerChoice,
					onChange: (event) => setTickerChoice(event.target.value),
					children: [portfolio.securities.map((security) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: security.ticker,
						children: [
							security.ticker,
							" · ",
							security.name
						]
					}, security.ticker)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "__new",
						children: "Add a ticker"
					})]
				}),
				tickerChoice === "__new" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Code",
							value: newTicker,
							onChange: (event) => setNewTicker(event.target.value.toUpperCase()),
							placeholder: "VAS.AX"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Name",
							value: securityName,
							onChange: (event) => setSecurityName(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "GICS sector",
							value: sector,
							onChange: (event) => setSector(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
							label: "Asset class",
							value: assetClass,
							onChange: (event) => setAssetClass(event.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "AU Equities" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Intl Equities" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "REITs" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Cash" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
							label: "Company tax rate",
							value: taxRate,
							onChange: (event) => setTaxRate(event.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.3",
								children: "30%"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.25",
								children: "25% base rate"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Mark",
							inputMode: "decimal",
							value: mark,
							onChange: (event) => setMark(event.target.value)
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						label: "Type",
						value: type,
						onChange: (event) => setType(event.target.value),
						children: TYPES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item,
							children: item === "DIVIDEND_CASH" ? "Cash dividend" : item === "DIVIDEND_DRP" ? "Dividend reinvestment" : item === "RETURN_OF_CAPITAL" ? "Capital return" : item === "SPLIT" ? "Split / consolidation" : item === "BUY" ? "Buy" : "Sell"
						}, item))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: "Date",
						type: "date",
						value: tradeDate,
						onChange: (event) => setTradeDate(event.target.value)
					})]
				}),
				type === "BUY" || type === "SELL" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Units",
							inputMode: "decimal",
							value: unitsValue,
							onChange: (event) => setUnitsValue(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Price",
							inputMode: "decimal",
							value: price,
							onChange: (event) => setPrice(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Brokerage",
							inputMode: "decimal",
							value: brokerage,
							onChange: (event) => setBrokerage(event.target.value)
						})
					]
				}) : null,
				type === "DIVIDEND_CASH" || type === "DIVIDEND_DRP" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Unfranked AUD",
							inputMode: "decimal",
							value: unfranked,
							onChange: (event) => setUnfranked(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Franked AUD",
							inputMode: "decimal",
							value: franked,
							onChange: (event) => setFranked(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
							label: "Company tax rate",
							value: eventRate,
							onChange: (event) => setEventRate(event.target.value),
							hint: "Credit = franked × rate / (1 − rate).",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.3",
								children: "30% · multiply by 3/7"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.25",
								children: "25% · multiply by 1/3"
							})]
						}),
						type === "DIVIDEND_DRP" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "DRP price",
							inputMode: "decimal",
							value: drpPrice,
							onChange: (event) => setDrpPrice(event.target.value),
							hint: "Units are rounded down to 4 d.p. Cash left over carries forward."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted sm:col-span-2",
							children: [
								"Franking credit ",
								preview.credit.toFixed(2),
								" · grossed-up ",
								preview.gross.toFixed(2),
								". A DRP is still income on the payment date, plus a new parcel."
							]
						})
					]
				}) : null,
				type === "SPLIT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
					label: "New units per old unit",
					inputMode: "decimal",
					value: splitRatio,
					onChange: (event) => setSplitRatio(event.target.value),
					hint: "2 means a 2-for-1 split. Cost base stays the same."
				}) : null,
				type === "RETURN_OF_CAPITAL" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
					label: "Returned per unit",
					inputMode: "decimal",
					value: price,
					onChange: (event) => setPrice(event.target.value),
					hint: "Reduces cost base. Anything above the cost base is a CGT event G1."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
					label: "Note",
					value: note,
					maxLength: 280,
					onChange: (event) => setNote(event.target.value)
				}),
				type === "BUY" || type === "SELL" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"Cash total ",
						preview.total.toFixed(2),
						" AUD, brokerage ",
						type === "BUY" ? "added to" : "taken off",
						" the consideration."
					]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-coral",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap justify-between gap-2",
					children: [initial ? confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: () => {
							update((current) => ({
								...current,
								transactions: current.transactions.filter((row) => row.id !== initial.id)
							}));
							onClose();
						},
						children: "Confirm delete"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: () => setConfirmDelete(true),
						children: "Delete"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onClose,
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "primary",
							onClick: save,
							children: "Save on this device"
						})]
					})]
				})
			]
		})
	});
}
function AssumptionsDialog({ onClose }) {
	const { portfolio, update } = usePortfolio();
	const years = financialYearOptions(portfolio);
	const [losses, setLosses] = (0, import_react.useState)(() => Object.fromEntries(portfolio.accounts.map((account) => [account.id, String(portfolio.settings.openingLosses[account.id] ?? "")])));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: true,
		title: "Assumptions",
		description: "These change the worksheets. They are not downloaded from a broker.",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				const data = new FormData(event.currentTarget);
				const openingLosses = {};
				for (const account of portfolio.accounts) {
					const parsed = num(losses[account.id] ?? "");
					if (parsed === null) return;
					if (parsed > 0) openingLosses[account.id] = parsed;
				}
				if (update((current) => ({
					...current,
					settings: {
						...current.settings,
						financialYear: String(data.get("fy")),
						valuationDate: String(data.get("asof")),
						benchmarkRates: {
							au: Number(data.get("au")) / 100,
							intl: Number(data.get("intl")) / 100,
							reit: Number(data.get("reit")) / 100,
							cash: Number(data.get("cash")) / 100
						},
						openingLosses
					}
				}))) onClose();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
					label: "Financial year",
					name: "fy",
					defaultValue: portfolio.settings.financialYear,
					children: years.map((year) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: year,
						children: year
					}, year))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
					label: "Valuation date",
					name: "asof",
					type: "date",
					defaultValue: portfolio.settings.valuationDate,
					hint: "Events after this date are left out."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "AU equities % / yr",
							name: "au",
							inputMode: "decimal",
							defaultValue: String(portfolio.settings.benchmarkRates.au * 100)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Intl equities % / yr",
							name: "intl",
							inputMode: "decimal",
							defaultValue: String(portfolio.settings.benchmarkRates.intl * 100)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "REITs % / yr",
							name: "reit",
							inputMode: "decimal",
							defaultValue: String(portfolio.settings.benchmarkRates.reit * 100)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Cash % / yr",
							name: "cash",
							inputMode: "decimal",
							defaultValue: String(portfolio.settings.benchmarkRates.cash * 100)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "grid gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "text-sm text-muted",
						children: "Capital losses from before the ledger"
					}), portfolio.accounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: account.name,
						inputMode: "decimal",
						value: losses[account.id] ?? "",
						onChange: (event) => setLosses((current) => ({
							...current,
							[account.id]: event.target.value
						}))
					}, account.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: onClose,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "primary",
						children: "Apply"
					})]
				})
			]
		})
	});
}
function AccountsDialog({ onClose }) {
	const { portfolio, update } = usePortfolio();
	const [rows, setRows] = (0, import_react.useState)(portfolio.accounts);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: true,
		title: "Accounts",
		description: "Owner type decides who is taxed. Status is quoted or not — a TFN itself is never stored.",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3",
			children: [
				rows.map((account, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2 rounded-xl border border-line p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Name",
							value: account.name,
							onChange: (event) => setRows((current) => current.map((row, i) => i === index ? {
								...row,
								name: event.target.value
							} : row))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
							label: "Owner",
							value: account.ownerType,
							onChange: (event) => setRows((current) => current.map((row, i) => i === index ? {
								...row,
								ownerType: event.target.value
							} : row)),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Individual",
									children: "Individual"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Minor_Designated",
									children: "Minor · adult trustee"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Minor_Direct",
									children: "Minor · own TFN"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectField, {
							label: "TFN status",
							value: account.tfnStatus,
							onChange: (event) => setRows((current) => current.map((row, i) => i === index ? {
								...row,
								tfnStatus: event.target.value
							} : row)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Quoted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Not quoted" })]
						})
					]
				}, account.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setRows((current) => [...current, {
						id: `acc-${crypto.randomUUID().slice(0, 8)}`,
						name: "New account",
						ownerType: "Minor_Direct",
						tfnStatus: "Quoted"
					}]),
					children: "Add account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: onClose,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "primary",
						onClick: () => {
							if (!rows.some((row) => row.ownerType === "Individual")) return;
							update((current) => ({
								...current,
								accounts: rows.map((row) => ({
									...row,
									name: row.name.trim().slice(0, 60) || "Account"
								}))
							}));
							onClose();
						},
						children: "Save accounts"
					})]
				})
			]
		})
	});
}
function SecurityDialog({ onClose }) {
	const { notice, setNotice, busy, sealed, plainStored, canSeal, seal, unseal, lock, restoreDemo, erase, replace, installSealed, exportBackup, rememberPlain, forgetPlain } = usePortfolio();
	const [pass, setPass] = (0, import_react.useState)("");
	const [again, setAgain] = (0, import_react.useState)("");
	const [current, setCurrent] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [confirmErase, setConfirmErase] = (0, import_react.useState)(false);
	const [confirmPlain, setConfirmPlain] = (0, import_react.useState)(false);
	const [confirmStore, setConfirmStore] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setError(null), [
		pass,
		again,
		current
	]);
	const download = (filename, body) => {
		const blob = new Blob([body], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: true,
		title: "Privacy and seal",
		description: "The ledger stays in this browser. Nothing is uploaded, and a tax file number is never asked for or stored.",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 text-sm text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "grid gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Figures stay in this browser. Nothing is uploaded, and a tax file number is never asked for or stored." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Until you seal, edits stay in this tab and are not written to the device." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							"A seal encrypts the saved copy with AES-256-GCM. The key is derived with ",
							KDF_ITERATIONS.toLocaleString("en-AU"),
							" rounds of PBKDF2 and is kept only in memory. Helio cannot reset a forgotten passphrase."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The screen locks after 5 idle minutes, or after 1 minute in a hidden tab. Five wrong guesses impose a 30 second wait." })
					]
				}),
				sealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-2",
					onSubmit: async (event) => {
						event.preventDefault();
						const result = await unseal(current);
						setCurrent("");
						if (result === "ok") onClose();
						else setError(result === "cooldown" ? "Too many attempts. Wait 30 seconds." : "That passphrase did not open the seal.");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Saved copy is sealed. Removing the seal deletes that encrypted copy and does not leave a readable file behind."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Current passphrase",
							type: "password",
							autoComplete: "current-password",
							autoCapitalize: "off",
							autoCorrect: "off",
							spellCheck: false,
							value: current,
							onChange: (event) => setCurrent(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: busy,
								children: "Remove seal"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => {
									lock();
									onClose();
								},
								children: "Lock now"
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-2",
					onSubmit: async (event) => {
						event.preventDefault();
						const issue = passphraseIssue(pass);
						if (issue) return setError(issue);
						if (pass !== again) return setError("The two passphrases do not match.");
						const ok = await seal(pass);
						setPass("");
						setAgain("");
						if (ok) onClose();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "New passphrase",
							type: "password",
							autoComplete: "new-password",
							autoCapitalize: "off",
							autoCorrect: "off",
							spellCheck: false,
							value: pass,
							onChange: (event) => setPass(event.target.value),
							hint: !pass ? "12+ characters. A short sentence is stronger than a tricky word." : passphraseIssue(pass) ?? "Long enough to seal."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
							label: "Repeat passphrase",
							type: "password",
							autoComplete: "new-password",
							autoCapitalize: "off",
							autoCorrect: "off",
							spellCheck: false,
							value: again,
							onChange: (event) => setAgain(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "primary",
							disabled: busy || !canSeal,
							children: busy ? "Sealing…" : "Seal this ledger"
						})
					]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-coral",
					children: error
				}) : null,
				!canSeal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-coral",
					children: "This browser cannot run the seal. Don't enter real holdings here."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: async () => {
								const file = await exportBackup();
								if (!file.encrypted && !confirmPlain) {
									setConfirmPlain(true);
									setError("That download is readable. Choose export again to confirm, or seal first.");
									return;
								}
								download(file.filename, file.body);
								setConfirmPlain(false);
								setError(null);
							},
							children: sealed ? "Export sealed backup" : confirmPlain ? "Download readable file" : "Export backup"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4",
							children: ["Import", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "application/json,.json",
								className: "sr-only",
								onChange: async (event) => {
									const file = event.target.files?.[0];
									event.target.value = "";
									if (!file) return;
									if (file.size > 2e6) return setNotice("That file is too large.");
									try {
										const parsed = JSON.parse(await file.text());
										if (isSealedRecord(parsed)) {
											if (!installSealed(parsed)) return setNotice("That sealed file was rejected.");
											onClose();
											return;
										}
										const ledger = parsePortfolioJson(parsed);
										if (!ledger.ok) return setNotice(ledger.error);
										replace(ledger.portfolio);
										onClose();
									} catch {
										setNotice("That file could not be read.");
									}
								}
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: restoreDemo,
							children: "Restore demo"
						}),
						!sealed && !plainStored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								if (!confirmStore) {
									setConfirmStore(true);
									setError("That stores a readable ledger in this browser. Choose it again to confirm, or seal instead.");
									return;
								}
								rememberPlain();
								setConfirmStore(false);
							},
							children: confirmStore ? "Confirm readable copy" : "Store readable copy"
						}) : null,
						!sealed && plainStored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								forgetPlain();
								setConfirmStore(false);
							},
							children: "Remove readable copy"
						}) : null,
						confirmErase ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: () => {
								erase();
								onClose();
							},
							children: "Confirm delete"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: () => setConfirmErase(true),
							children: "Delete ledger"
						})
					]
				}),
				notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: notice }) : null
			]
		})
	});
}
function Holdings({ accountId, positions }) {
	const { portfolio, update, sim } = usePortfolio();
	const visible = positions.filter((row) => accountId === "all" || row.accountId === accountId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-end justify-between gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: "Open parcels"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Marks are yours. Change a price and the market value follows. Parcels follow the selected matching method."
				})] })
			}),
			visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-card border border-line bg-surface p-6 text-sm text-muted",
				children: "Nothing open here. Record a buy from the ledger."
			}) : null,
			visible.map((row) => {
				const owner = portfolio.accounts.find((account) => account.id === row.accountId);
				const residual = sim.residuals.find((item) => item.accountId === row.accountId && item.ticker === row.ticker);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line bg-surface/90 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-faint",
									children: [
										owner ? firstName(owner.name) : row.accountId,
										" · ",
										row.assetClass
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-semibold",
									children: row.ticker
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										row.name,
										" · ",
										row.gicsSector
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "grid gap-1 text-right",
								onSubmit: (event) => {
									event.preventDefault();
									const data = new FormData(event.currentTarget);
									const next = Number(data.get("mark"));
									if (!Number.isFinite(next) || next < 0) return;
									update((current) => ({
										...current,
										securities: current.securities.map((security) => security.ticker === row.ticker ? {
											...security,
											lastPrice: next
										} : security)
									}));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs text-faint",
									htmlFor: `mark-${row.accountId}-${row.ticker}`,
									children: "Mark"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: `mark-${row.accountId}-${row.ticker}`,
										name: "mark",
										inputMode: "decimal",
										defaultValue: row.lastPrice,
										className: "min-h-11 w-24 rounded-xl border border-line bg-raise px-3 text-right font-mono text-sm text-fg"
									}, `${row.ticker}-${row.lastPrice}`), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "min-h-11 rounded-full border border-line px-3 text-xs text-fg",
										children: "Set"
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "Units"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono tabular-nums",
									children: units(row.units)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "Cost base"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono tabular-nums",
									children: money$1(row.costBase)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "Value"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono tabular-nums",
									children: money$1(row.marketValue)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "Unrealised"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: row.unrealised >= 0 ? "font-mono text-mint tabular-nums" : "font-mono text-coral tabular-nums",
									children: moneySigned(row.unrealised)
								})] })
							]
						}),
						residual ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs text-teal",
							children: ["DRP residual carried: ", money$1(residual.cash)]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer text-sm text-blue",
								children: "Tax parcels"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 grid gap-2",
								children: row.parcels.map((parcel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "grid gap-1 rounded-xl bg-raise px-3 py-2 text-xs text-muted sm:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: parcel.acquisitionDate }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											parcel.source === "DRP" ? "DRP" : "Buy",
											" · ",
											units(parcel.unitsRemaining)
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono tabular-nums",
											children: money$1(parcel.totalCostBase)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono tabular-nums",
											children: ["Unit ", money$1(parcel.unitsRemaining ? parcel.totalCostBase / parcel.unitsRemaining : 0)]
										})
									]
								}, parcel.id))
							})]
						})
					]
				}, `${row.accountId}-${row.ticker}`);
			})
		]
	});
}
var FILTERS = [
	"ALL",
	"BUY",
	"SELL",
	"DIVIDEND_CASH",
	"DIVIDEND_DRP",
	"SPLIT",
	"RETURN_OF_CAPITAL"
];
function Ledger({ accountId, onCreate, onEdit }) {
	const { portfolio, sim } = usePortfolio();
	const [kind, setKind] = (0, import_react.useState)("ALL");
	const [query, setQuery] = (0, import_react.useState)("");
	const rows = (0, import_react.useMemo)(() => {
		const q = query.trim().toUpperCase();
		return [...portfolio.transactions].filter((tx) => (accountId === "all" || tx.accountId === accountId) && (kind === "ALL" || tx.type === kind)).filter((tx) => !q || tx.ticker.includes(q) || tx.note.toUpperCase().includes(q)).sort((a, b) => a.tradeDate < b.tradeDate ? 1 : a.tradeDate > b.tradeDate ? -1 : a.id < b.id ? 1 : -1);
	}, [
		portfolio.transactions,
		accountId,
		kind,
		query
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: "Events"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Buys, sells, dividends, DRPs, splits and capital returns. The engine re-sorts by date."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "primary",
					onClick: onCreate,
					children: "Record event"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: "Search ticker or note",
					"aria-label": "Search events",
					className: "min-h-11 flex-1 rounded-xl border border-line bg-raise px-3 text-sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: kind,
					onChange: (event) => setKind(event.target.value),
					"aria-label": "Event type",
					className: "min-h-11 rounded-xl border border-line bg-raise px-3 text-sm",
					children: FILTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: item,
						children: item === "ALL" ? "All types" : txLabel(item)
					}, item))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-2",
				children: rows.map((tx) => {
					const owner = portfolio.accounts.find((account) => account.id === tx.accountId);
					const dividend = sim.dividends.find((line) => line.txId === tx.id);
					const warning = sim.warnings.find((item) => item.txId === tx.id);
					const detail = tx.type === "BUY" || tx.type === "SELL" ? `${units(tx.units)} @ ${money$1(tx.price)}` : tx.type === "DIVIDEND_DRP" ? `${money$1(tx.unfrankedAud + tx.frankedAud)} → ${units(dividend?.drpUnits ?? sim.drpUnitsByTx[tx.id] ?? 0)} units` : tx.type === "DIVIDEND_CASH" ? money$1(tx.unfrankedAud + tx.frankedAud) : tx.type === "SPLIT" ? `${tx.splitRatio}-for-1` : `${money$1(tx.price)} / unit`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onEdit(tx),
						className: "grid w-full gap-1 rounded-card border border-line bg-surface/90 px-4 py-3 text-left transition-transform duration-150 active:scale-[0.99] sm:grid-cols-[7rem_1fr_auto]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-faint tabular-nums",
								children: tx.tradeDate
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: tx.ticker
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [" · ", txLabel(tx.type)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-0.5 block text-xs text-faint",
									children: [
										owner ? firstName(owner.name) : "Account",
										" · ",
										detail,
										dividend ? ` · credit ${money$1(dividend.frankingCredit)}` : "",
										warning ? ` · ${warning.message}` : ""
									]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm tabular-nums sm:text-right",
								children: money$1(tx.totalAud)
							})
						]
					}) }, tx.id);
				})
			}),
			rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No events match."
			}) : null
		]
	});
}
var METHODS = [
	"FIFO",
	"LIFO",
	"MIN_TAX"
];
function worksheet(report, name, fy) {
	const lines = [
		`Helio worksheet · ${name} · ${fy}`,
		"Not a lodgement. Not tax advice.",
		"",
		"Item 11 dividends",
		`Unfranked: ${money$1(report.unfranked)}`,
		`Franked: ${money$1(report.franked)}`,
		`Franking credits: ${money$1(report.frankingCredits)}`,
		`Grossed-up: ${money$1(report.grossDividends)}`,
		"",
		"Item 18 capital gains",
		`Discountable gross gains: ${money$1(report.cgt.discountableGross)}`,
		`Other gross gains: ${money$1(report.cgt.nonDiscountableGross)}`,
		`Current year losses: ${money$1(report.cgt.currentYearLosses)}`,
		`Losses carried in: ${money$1(report.cgt.lossesCarriedIn)}`,
		`Applied to non-discount gains: ${money$1(report.cgt.lossesAppliedToNonDiscount)}`,
		`Applied to discount gains: ${money$1(report.cgt.lossesAppliedToDiscount)}`,
		`50% discount: ${money$1(report.cgt.discountAmount)}`,
		`Net capital gain: ${money$1(report.cgt.netCapitalGain)}`,
		`Losses carried forward: ${money$1(report.cgt.lossesCarriedForward)}`
	];
	if (report.minor?.applies) lines.push("", `Unearned dividend income: ${money$1(report.minor.eligibleIncome)}`, `Illustrative Div 6AA tax: ${money$1(report.minor.illustrativeTax)}`);
	return lines.join("\n");
}
function TaxView({ accountId }) {
	const { portfolio, reports, update } = usePortfolio();
	const [copied, setCopied] = (0, import_react.useState)(false);
	const fy = portfolio.settings.financialYear;
	const focus = reports.filter((report) => {
		if (accountId === "all") return true;
		return report.entityAccountId === accountId || report.includesAccountIds.includes(accountId);
	});
	const comparison = (0, import_react.useMemo)(() => {
		return METHODS.map((method) => ({
			method,
			reports: reportForFy(simulate(portfolio, method), portfolio, fy)
		}));
	}, [portfolio, fy]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-semibold",
				children: "Tax worksheets"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Item 11 and Item 18 figures for ",
					fy,
					". Losses reduce gross gains before the 50% discount, and they clear non-discount gains first. Each legal owner is kept separate."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "overflow-x-auto rounded-card border border-line bg-surface/90 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-semibold",
						children: "Method comparison · net capital gain"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Min-tax picks the lowest estimated assessable gain per unit on each sale. It does not reshuffle the whole year."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "mt-3 w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-faint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Entity"
							}), METHODS.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: method === "MIN_TAX" ? "Min-tax" : method
							}, method))] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: reports.map((report) => {
							const name = portfolio.accounts.find((account) => account.id === report.entityAccountId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: name ? firstName(name.name) : report.entityAccountId
								}), comparison.map((column) => {
									const match = column.reports.find((item) => item.entityAccountId === report.entityAccountId);
									const active = portfolio.settings.cgtMethod === column.method;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: active ? "py-2 font-mono text-teal tabular-nums" : "py-2 font-mono tabular-nums",
										children: money$1(match?.cgt.netCapitalGain ?? 0)
									}, column.method);
								})]
							}, report.entityAccountId);
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: METHODS.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: portfolio.settings.cgtMethod === method ? "primary" : "ghost",
							onClick: () => update((current) => ({
								...current,
								settings: {
									...current.settings,
									cgtMethod: method
								}
							})),
							children: ["Use ", method === "MIN_TAX" ? "min-tax" : method]
						}, method))
					})
				]
			}),
			focus.map((report) => {
				const owner = portfolio.accounts.find((account) => account.id === report.entityAccountId);
				const name = owner?.name ?? "Entity";
				const meterMax = 1600;
				const income = report.minor?.eligibleIncome ?? 0;
				const width = Math.max(0, Math.min(100, income / meterMax * 100));
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line bg-surface/90 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs tracking-wide text-faint uppercase",
									children: [
										owner ? ownerLabel(owner.ownerType) : "Entity",
										" · TFN ",
										owner?.tfnStatus
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-semibold",
									children: name
								}),
								report.includesAccountIds.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										"Includes ",
										report.includesAccountIds.map((id) => firstName(portfolio.accounts.find((account) => account.id === id)?.name ?? id)).join(", "),
										". Designated minors stay on this return."
									]
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: async () => {
									const text = worksheet(report, name, fy);
									try {
										await navigator.clipboard.writeText(text);
										setCopied(true);
									} catch {
										setCopied(false);
										window.prompt("Copy this worksheet", text);
									}
								},
								children: copied ? "Copied" : "Copy worksheet"
							})]
						}),
						accountId !== "all" && accountId !== report.entityAccountId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 rounded-xl bg-raise px-3 py-2 text-sm text-muted",
							children: [
								"These amounts are reported on ",
								firstName(name),
								"'s return, not as the child's own income."
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-raise p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-medium text-teal",
									children: "Item 11 · dividends"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-2 grid gap-1 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Unfranked",
											value: money$1(report.unfranked)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Franked",
											value: money$1(report.franked)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Franking credits",
											value: money$1(report.frankingCredits)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Grossed-up income",
											value: money$1(report.grossDividends)
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-raise p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-medium text-blue",
									children: "Item 18 · capital gains"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-2 grid gap-1 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Discountable gross",
											value: money$1(report.cgt.discountableGross)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Other gross",
											value: money$1(report.cgt.nonDiscountableGross)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Losses applied",
											value: money$1(report.cgt.lossesAppliedToNonDiscount + report.cgt.lossesAppliedToDiscount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "50% discount",
											value: money$1(report.cgt.discountAmount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Net capital gain",
											value: money$1(report.cgt.netCapitalGain)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "Losses to carry",
											value: money$1(report.cgt.lossesCarriedForward)
										})
									]
								})]
							})]
						}),
						report.sources.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 grid gap-1 text-xs text-muted",
							children: report.sources.map((source) => {
								const sourceName = firstName(portfolio.accounts.find((account) => account.id === source.accountId)?.name ?? source.accountId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									sourceName,
									": gross dividends ",
									money$1(source.gross),
									", gains ",
									money$1(source.discountableGains + source.otherGains),
									", losses ",
									money$1(source.losses)
								] }, source.accountId);
							})
						}) : null,
						report.minor?.applies ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-medium",
										children: "Unearned income band"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-sm tabular-nums",
										children: money$1(income)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mt-2 h-3 rounded-full bg-bg",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: report.minor.band === "nil" ? "h-full rounded-full bg-mint" : "h-full rounded-full bg-coral",
											style: { width: `${width}%` }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute top-0 h-full w-px bg-fg/70",
											style: { left: `${416 / meterMax * 100}%` }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute top-0 h-full w-px bg-fg/70",
											style: { left: `${1307 / meterMax * 100}%` }
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted",
									children: "Markers at $416 and $1,307. Nil to $416, then 66% of the excess over $416 until $1,307, then 45% of the entire unearned amount. Medicare levy is not included. Capital gains are kept on Item 18 — ask a registered tax agent whether a gain is excepted."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm",
									children: report.minor.band === "nil" ? `${money$1(report.minor.roomTo416)} left inside the tax-free amount.` : `Illustrative tax ${money$1(report.minor.illustrativeTax)}.`
								})
							]
						}) : null,
						report.disposals.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer text-sm text-blue",
								children: "Disposal slices"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 grid gap-2",
								children: report.disposals.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "grid gap-1 rounded-xl bg-raise px-3 py-2 text-xs text-muted sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										line.ticker,
										" · ",
										line.kind === "G1" ? "CGT event G1" : `${units(line.units)} sold`,
										" · ",
										line.daysHeld,
										" days",
										line.discountEligible ? " · 50% eligible" : ""
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono tabular-nums sm:text-right",
										children: [
											"Proceeds ",
											money$1(line.proceeds),
											" · cost ",
											money$1(line.costBase),
											" · gain ",
											money$1(line.grossGain)
										]
									})]
								}, line.id))
							})]
						}) : null
					]
				}, report.entityAccountId);
			})
		]
	});
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-mono tabular-nums",
			children: value
		})]
	});
}
var VIEWS = [
	{
		id: "cockpit",
		label: "Cockpit",
		icon: LayoutDashboard
	},
	{
		id: "holdings",
		label: "Holdings",
		icon: ChartPie
	},
	{
		id: "ledger",
		label: "Ledger",
		icon: ScrollText
	},
	{
		id: "tax",
		label: "Tax",
		icon: Scale
	}
];
function HelioApp() {
	const app = usePortfolio();
	const [view, setView] = (0, import_react.useState)("cockpit");
	const [accountId, setAccountId] = (0, import_react.useState)("all");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [assumptions, setAssumptions] = (0, import_react.useState)(false);
	const [securityOpen, setSecurityOpen] = (0, import_react.useState)(false);
	const [accountsOpen, setAccountsOpen] = (0, import_react.useState)(false);
	if (app.corrupt) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto grid min-h-screen max-w-lg place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-card border border-line bg-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-teal",
					children: "HELIO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-2xl font-semibold",
					children: "Saved ledger could not be read"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [app.corrupt, " Nothing was sent anywhere."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "primary",
						onClick: app.restoreDemo,
						children: "Restore demo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: app.erase,
						children: "Delete saved data"
					})]
				})
			]
		})
	});
	if (app.locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockScreen, {});
	const warnings = app.sim.warnings.filter((warning) => {
		if (accountId === "all") return true;
		return app.portfolio.transactions.find((item) => item.id === warning.txId)?.accountId === accountId;
	});
	const years = financialYearOptions(app.portfolio);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto min-h-screen max-w-6xl px-4 pt-5 pb-28 md:pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "grid size-11 grid-cols-2 gap-0.5 rounded-xl bg-surface p-1.5",
								"aria-hidden": true,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rounded-sm bg-teal" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rounded-sm bg-blue" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rounded-sm bg-mint" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rounded-sm bg-fg" })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-widest text-teal",
									children: "HELIO"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-xl font-semibold",
									children: "Family share ledger"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-faint",
									children: "On this device only · TFNs never stored"
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									"aria-label": "Assumptions",
									onClick: () => setAssumptions(true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Assumptions"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									"aria-label": "Accounts",
									onClick: () => setAccountsOpen(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									"aria-label": "Privacy and seal",
									onClick: () => setSecurityOpen(true),
									className: app.sealed ? void 0 : "text-coral",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: app.sealed ? "Sealed" : app.plainStored ? "Readable" : "Not saved"
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-3xl text-sm text-muted",
						children: "Parent and children stay in separate tax entities. Franking credits, DRP parcels and CGT discounts are worked out here. Not an ATO lodgement and not personal tax advice."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid flex-1 gap-1 text-xs text-faint",
							children: ["Financial year", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-fg",
								value: app.portfolio.settings.financialYear,
								onChange: (event) => app.update((current) => ({
									...current,
									settings: {
										...current.settings,
										financialYear: event.target.value
									}
								})),
								children: years.map((year) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: year,
									children: year
								}, year))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid flex-1 gap-1 text-xs text-faint",
							children: ["Parcel method", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-fg",
								value: app.portfolio.settings.cgtMethod,
								onChange: (event) => app.update((current) => ({
									...current,
									settings: {
										...current.settings,
										cgtMethod: event.target.value
									}
								})),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "FIFO",
										children: "FIFO"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "LIFO",
										children: "LIFO"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "MIN_TAX",
										children: "Min-tax"
									})
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountPill, {
							active: accountId === "all",
							onClick: () => setAccountId("all"),
							children: "All accounts"
						}), app.portfolio.accounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccountPill, {
							active: accountId === account.id,
							onClick: () => setAccountId(account.id),
							children: [firstName(account.name), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs font-normal text-faint",
								children: ownerLabel(account.ownerType)
							})]
						}, account.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "hidden gap-2 md:flex",
						"aria-label": "Sections",
						children: VIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setView(item.id),
							className: cn("min-h-11 rounded-full px-4 text-sm", view === item.id ? "pill-on" : "text-muted"),
							children: item.label
						}, item.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-4",
				children: [
					app.source === "sample" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-card border border-line bg-surface/80 px-4 py-3 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Demo family loaded: Harper, plus Ava (designated), Noah under $416, Mia in the 66% band, and Leo over $1,307. The demo is not written to this browser. Seal the ledger before you type real holdings." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "primary",
							className: "mt-3",
							onClick: () => setSecurityOpen(true),
							children: "Seal before real data"
						})]
					}) : null,
					app.unsaved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-card border border-coral/40 bg-surface px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "These edits are only in this tab. Closing it drops them. Sealing stores an encrypted copy and nothing readable." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "primary",
							className: "mt-3",
							onClick: () => setSecurityOpen(true),
							children: "Seal to save"
						})]
					}) : null,
					app.plainStored && !app.sealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-card border border-coral/40 bg-surface px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A readable copy is stored in this browser. Anyone who can open it can read the ledger." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "primary",
							className: "mt-3",
							onClick: () => setSecurityOpen(true),
							children: "Seal this ledger"
						})]
					}) : null,
					app.notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-card border border-teal/40 bg-surface px-4 py-3 text-sm",
						role: "status",
						children: app.notice
					}) : null,
					view === "cockpit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cockpit, {
						accountId,
						positions: app.positions,
						reports: app.reports,
						warnings
					}) : null,
					view === "holdings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Holdings, {
						accountId,
						positions: app.positions
					}) : null,
					view === "ledger" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ledger, {
						accountId,
						onCreate: () => setDraft("new"),
						onEdit: (tx) => setDraft(tx)
					}) : null,
					view === "tax" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxView, { accountId }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur md:hidden",
				"aria-label": "Sections",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4",
					children: VIEWS.map((item) => {
						const Icon = item.icon;
						const active = view === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: cn("grid min-h-16 place-items-center text-xs", active ? "text-teal" : "text-muted"),
							onClick: () => setView(item.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
						}, item.id);
					})
				})
			}),
			draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionDialog, {
				initial: draft === "new" ? null : draft,
				presetAccount: accountId,
				onClose: () => setDraft(null)
			}) : null,
			assumptions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssumptionsDialog, { onClose: () => setAssumptions(false) }) : null,
			securityOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecurityDialog, { onClose: () => setSecurityOpen(false) }) : null,
			accountsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountsDialog, { onClose: () => setAccountsOpen(false) }) : null
		]
	});
}
function AccountPill({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("min-h-11 shrink-0 rounded-2xl border border-line px-3 py-1 text-left text-sm", active ? "pill-on" : "bg-surface text-muted"),
		children
	});
}
function LockScreen() {
	const { unlock, busy, lockReason } = usePortfolio();
	const [pass, setPass] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto grid min-h-screen max-w-md place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "w-full rounded-card border border-line bg-surface p-6",
			onSubmit: async (event) => {
				event.preventDefault();
				const result = await unlock(pass);
				setPass("");
				if (result === "ok") return;
				setError(result === "cooldown" ? "Too many attempts. Wait 30 seconds." : "That passphrase did not open the ledger.");
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-teal",
					children: "HELIO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-2xl font-semibold",
					children: "Ledger sealed"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: lockReason ?? "The passphrase never leaves this browser, and Helio cannot reset it. Unlocking checks a slow key derivation, so a wrong guess is expensive."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 grid gap-1 text-sm text-muted",
					children: ["Passphrase", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "password",
						autoComplete: "current-password",
						autoCapitalize: "off",
						autoCorrect: "off",
						spellCheck: false,
						value: pass,
						onChange: (event) => setPass(event.target.value),
						className: "min-h-11 rounded-xl border border-line bg-raise px-3 text-fg"
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-coral",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "primary",
					className: "mt-4 w-full",
					disabled: busy,
					children: busy ? "Checking passphrase…" : "Unlock"
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelioApp, {}) });
}
//#endregion
export { Home as component };
