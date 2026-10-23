import { useMemo, useState } from "react";
import { firstName, money, ownerLabel, units } from "@/components/format";
import { usePortfolio } from "@/components/portfolio-context";
import { Button } from "@/components/ui";
import { reportForFy, simulate, type CgtMethod, type EntityReport } from "@/lib/tax/engine";

const METHODS: CgtMethod[] = ["FIFO", "LIFO", "MIN_TAX"];

function worksheet(report: EntityReport, name: string, fy: string): string {
  const lines = [
    `Helio worksheet · ${name} · ${fy}`,
    "Not a lodgement. Not tax advice.",
    "",
    "Item 11 dividends",
    `Unfranked: ${money(report.unfranked)}`,
    `Franked: ${money(report.franked)}`,
    `Franking credits: ${money(report.frankingCredits)}`,
    `Grossed-up: ${money(report.grossDividends)}`,
    "",
    "Item 18 capital gains",
    `Discountable gross gains: ${money(report.cgt.discountableGross)}`,
    `Other gross gains: ${money(report.cgt.nonDiscountableGross)}`,
    `Current year losses: ${money(report.cgt.currentYearLosses)}`,
    `Losses carried in: ${money(report.cgt.lossesCarriedIn)}`,
    `Applied to non-discount gains: ${money(report.cgt.lossesAppliedToNonDiscount)}`,
    `Applied to discount gains: ${money(report.cgt.lossesAppliedToDiscount)}`,
    `50% discount: ${money(report.cgt.discountAmount)}`,
    `Net capital gain: ${money(report.cgt.netCapitalGain)}`,
    `Losses carried forward: ${money(report.cgt.lossesCarriedForward)}`,
  ];
  if (report.minor?.applies) {
    lines.push("", `Unearned dividend income: ${money(report.minor.eligibleIncome)}`, `Illustrative Div 6AA tax: ${money(report.minor.illustrativeTax)}`);
  }
  return lines.join("\n");
}

export function TaxView({ accountId }: { accountId: string | "all" }) {
  const { portfolio, reports, update } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const fy = portfolio.settings.financialYear;
  const focus = reports.filter((report) => {
    if (accountId === "all") return true;
    return report.entityAccountId === accountId || report.includesAccountIds.includes(accountId);
  });

  const comparison = useMemo(() => {
    return METHODS.map((method) => ({
      method,
      reports: reportForFy(simulate(portfolio, method), portfolio, fy),
    }));
  }, [portfolio, fy]);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Tax worksheets</h2>
        <p className="text-sm text-muted">
          Item 11 and Item 18 figures for {fy}. Losses reduce gross gains before the 50% discount, and they clear non-discount gains first. Each legal owner is kept separate.
        </p>
      </div>

      <article className="overflow-x-auto rounded-card border border-line bg-surface/90 p-4">
        <h3 className="text-lg font-semibold">Method comparison · net capital gain</h3>
        <p className="mt-1 text-xs text-muted">Min-tax picks the lowest estimated assessable gain per unit on each sale. It does not reshuffle the whole year.</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs text-faint">
            <tr>
              <th className="py-2 font-medium">Entity</th>
              {METHODS.map((method) => (
                <th key={method} className="py-2 font-medium">{method === "MIN_TAX" ? "Min-tax" : method}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const name = portfolio.accounts.find((account) => account.id === report.entityAccountId);
              return (
                <tr key={report.entityAccountId} className="border-t border-line">
                  <td className="py-2">{name ? firstName(name.name) : report.entityAccountId}</td>
                  {comparison.map((column) => {
                    const match = column.reports.find((item) => item.entityAccountId === report.entityAccountId);
                    const active = portfolio.settings.cgtMethod === column.method;
                    return (
                      <td key={column.method} className={active ? "py-2 font-mono text-teal tabular-nums" : "py-2 font-mono tabular-nums"}>
                        {money(match?.cgt.netCapitalGain ?? 0)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap gap-2">
          {METHODS.map((method) => (
            <Button
              key={method}
              size="sm"
              variant={portfolio.settings.cgtMethod === method ? "primary" : "ghost"}
              onClick={() => update((current) => ({ ...current, settings: { ...current.settings, cgtMethod: method } }))}
            >
              Use {method === "MIN_TAX" ? "min-tax" : method}
            </Button>
          ))}
        </div>
      </article>

      {focus.map((report) => {
        const owner = portfolio.accounts.find((account) => account.id === report.entityAccountId);
        const name = owner?.name ?? "Entity";
        const meterMax = 1600;
        const income = report.minor?.eligibleIncome ?? 0;
        const width = Math.max(0, Math.min(100, (income / meterMax) * 100));
        return (
          <article key={report.entityAccountId} className="rounded-card border border-line bg-surface/90 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-wide text-faint uppercase">{owner ? ownerLabel(owner.ownerType) : "Entity"} · TFN {owner?.tfnStatus}</p>
                <h3 className="text-lg font-semibold">{name}</h3>
                {report.includesAccountIds.length > 1 ? (
                  <p className="text-sm text-muted">
                    Includes {report.includesAccountIds.map((id) => firstName(portfolio.accounts.find((account) => account.id === id)?.name ?? id)).join(", ")}. Designated minors stay on this return.
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  const text = worksheet(report, name, fy);
                  try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                    window.prompt("Copy this worksheet", text);
                  }
                }}
              >
                {copied ? "Copied" : "Copy worksheet"}
              </Button>
            </div>

            {accountId !== "all" && accountId !== report.entityAccountId ? (
              <p className="mt-3 rounded-xl bg-raise px-3 py-2 text-sm text-muted">
                These amounts are reported on {firstName(name)}'s return, not as the child's own income.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-raise p-3">
                <h4 className="text-sm font-medium text-teal">Item 11 · dividends</h4>
                <dl className="mt-2 grid gap-1 text-sm">
                  <Row label="Unfranked" value={money(report.unfranked)} />
                  <Row label="Franked" value={money(report.franked)} />
                  <Row label="Franking credits" value={money(report.frankingCredits)} />
                  <Row label="Grossed-up income" value={money(report.grossDividends)} />
                </dl>
              </div>
              <div className="rounded-xl bg-raise p-3">
                <h4 className="text-sm font-medium text-blue">Item 18 · capital gains</h4>
                <dl className="mt-2 grid gap-1 text-sm">
                  <Row label="Discountable gross" value={money(report.cgt.discountableGross)} />
                  <Row label="Other gross" value={money(report.cgt.nonDiscountableGross)} />
                  <Row label="Losses applied" value={money(report.cgt.lossesAppliedToNonDiscount + report.cgt.lossesAppliedToDiscount)} />
                  <Row label="50% discount" value={money(report.cgt.discountAmount)} />
                  <Row label="Net capital gain" value={money(report.cgt.netCapitalGain)} />
                  <Row label="Losses to carry" value={money(report.cgt.lossesCarriedForward)} />
                </dl>
              </div>
            </div>

            {report.sources.length > 1 ? (
              <ul className="mt-3 grid gap-1 text-xs text-muted">
                {report.sources.map((source) => {
                  const sourceName = firstName(portfolio.accounts.find((account) => account.id === source.accountId)?.name ?? source.accountId);
                  return (
                    <li key={source.accountId}>
                      {sourceName}: gross dividends {money(source.gross)}, gains {money(source.discountableGains + source.otherGains)}, losses {money(source.losses)}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {report.minor?.applies ? (
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-medium">Unearned income band</h4>
                  <p className="font-mono text-sm tabular-nums">{money(income)}</p>
                </div>
                <div className="relative mt-2 h-3 rounded-full bg-bg">
                  <div className={report.minor.band === "nil" ? "h-full rounded-full bg-mint" : "h-full rounded-full bg-coral"} style={{ width: `${width}%` }} />
                  <span className="absolute top-0 h-full w-px bg-fg/70" style={{ left: `${(416 / meterMax) * 100}%` }} />
                  <span className="absolute top-0 h-full w-px bg-fg/70" style={{ left: `${(1307 / meterMax) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Markers at $416 and $1,307. Nil to $416, then 66% of the excess over $416 until $1,307, then 45% of the entire unearned amount. Medicare levy is not included. Capital gains are kept on Item 18 — ask a registered tax agent whether a gain is excepted.
                </p>
                <p className="mt-1 text-sm">
                  {report.minor.band === "nil"
                    ? `${money(report.minor.roomTo416)} left inside the tax-free amount.`
                    : `Illustrative tax ${money(report.minor.illustrativeTax)}.`}
                </p>
              </div>
            ) : null}

            {report.disposals.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue">Disposal slices</summary>
                <ul className="mt-2 grid gap-2">
                  {report.disposals.map((line) => (
                    <li key={line.id} className="grid gap-1 rounded-xl bg-raise px-3 py-2 text-xs text-muted sm:grid-cols-2">
                      <span>
                        {line.ticker} · {line.kind === "G1" ? "CGT event G1" : `${units(line.units)} sold`} · {line.daysHeld} days
                        {line.discountEligible ? " · 50% eligible" : ""}
                      </span>
                      <span className="font-mono tabular-nums sm:text-right">
                        Proceeds {money(line.proceeds)} · cost {money(line.costBase)} · gain {money(line.grossGain)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}
