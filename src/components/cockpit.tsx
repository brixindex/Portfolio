import { CHART_FILLS, AllocationChart } from "@/components/charts";
import { firstName, money, moneySigned, pct, scoreLabel, units } from "@/components/format";
import { usePortfolio } from "@/components/portfolio-context";
import { Stat } from "@/components/ui";
import { diversificationScore, type EntityReport, type Position, type Warning } from "@/lib/tax/engine";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function Cockpit({
  accountId,
  positions,
  reports,
  warnings,
}: {
  accountId: string | "all";
  positions: Position[];
  reports: EntityReport[];
  warnings: Warning[];
}) {
  const { portfolio } = usePortfolio();
  const visible = positions.filter((row) => accountId === "all" || row.accountId === accountId);
  const market = sum(visible.map((row) => row.marketValue));
  const cost = sum(visible.map((row) => row.costBase));
  const unrealised = market - cost;
  const bench = sum(visible.map((row) => row.benchmarkValue));
  const unitCount = sum(visible.map((row) => row.units));
  const readyUnits = sum(visible.map((row) => row.discountReadyUnits));
  const readyShare = unitCount > 0 ? readyUnits / unitCount : 0;

  const byClass = new Map<string, number>();
  const bySector = new Map<string, number>();
  for (const row of visible) {
    byClass.set(row.assetClass, (byClass.get(row.assetClass) ?? 0) + row.marketValue);
    bySector.set(row.gicsSector, (bySector.get(row.gicsSector) ?? 0) + row.marketValue);
  }
  const classRows = [...byClass.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const sectorRows = [...bySector.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const score = diversificationScore(sectorRows.map((row) => (market > 0 ? row.value / market : 0)));
  const account = portfolio.accounts.find((item) => item.id === accountId);
  const relevantReports =
    accountId === "all" ? reports : reports.filter((report) => report.includesAccountIds.includes(accountId) || report.entityAccountId === accountId);

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Market value" value={money(market)} hint="At your manual marks" />
        <Stat label="Cost base" value={money(cost)} hint="Open parcels, brokerage in" />
        <Stat
          label="Unrealised"
          value={moneySigned(unrealised)}
          tone={unrealised >= 0 ? "mint" : "coral"}
          hint={cost > 0 ? pct(unrealised / cost) : "No cost base"}
        />
        <Stat label="Discount-ready" value={pct(readyShare).replace("+", "")} tone="teal" hint="Units held more than 365 days" />
      </section>

      <section className="grid gap-3 lg:grid-cols-5">
        <article className="glow-card rounded-card border border-line bg-surface/90 p-4 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Allocation</h2>
            <p className="text-xs text-faint">Asset class · market value</p>
          </div>
          <div className="mt-2 grid items-center gap-2 md:grid-cols-[13rem_1fr]">
            <AllocationChart rows={classRows} />
            <ul className="grid gap-2">
              {classRows.map((row, index) => (
                <li key={row.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: CHART_FILLS[index % CHART_FILLS.length] }} />
                  <span>{row.name}</span>
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {market > 0 ? `${Math.round((row.value / market) * 100)}%` : "—"} · {money(row.value)}
                  </span>
                </li>
              ))}
              {classRows.length === 0 ? <li className="text-sm text-muted">Record a buy to see the mix.</li> : null}
            </ul>
          </div>
        </article>

        <div className="grid gap-3 lg:col-span-2">
          <article className="rounded-card border border-line bg-surface/90 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Spread</h2>
              <p className="font-mono text-sm text-teal tabular-nums">{score}</p>
            </div>
            <p className="mt-1 text-sm text-muted">{scoreLabel(score)} across GICS sectors. 100 is perfectly even.</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-raise">
              <div className="h-full rounded-full bg-teal" style={{ width: `${score}%` }} />
            </div>
            <ul className="mt-3 grid gap-1.5">
              {sectorRows.slice(0, 5).map((row) => (
                <li key={row.name} className="grid grid-cols-[1fr_auto] gap-2 text-xs text-muted">
                  <span>{row.name}</span>
                  <span className="font-mono tabular-nums">{market > 0 ? `${Math.round((row.value / market) * 100)}%` : "—"}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-card border border-line bg-surface/90 p-4">
            <h2 className="text-lg font-semibold">Vs your benchmark</h2>
            <p className={moneySigned(market - bench).startsWith("+") ? "mt-2 font-mono text-2xl text-mint tabular-nums" : "mt-2 font-mono text-2xl text-coral tabular-nums"}>
              {moneySigned(market - bench)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Marks {money(market)} against {money(bench)}. Rates compound from each parcel to {portfolio.settings.valuationDate}. Illustrative only — not a live index.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {relevantReports
          .filter((report) => report.minor?.applies)
          .map((report) => {
            const owner = portfolio.accounts.find((item) => item.id === report.entityAccountId);
            const band = report.minor?.band;
            const hot = band !== "nil";
            return (
              <article key={report.entityAccountId} className="rounded-card border border-line bg-surface/90 p-4">
                <p className="text-xs tracking-wide text-faint uppercase">Section 102AA · unearned dividends</p>
                <h3 className="mt-1 text-lg font-semibold">{owner ? firstName(owner.name) : "Minor"}</h3>
                <p className={hot ? "mt-2 font-mono text-xl text-coral tabular-nums" : "mt-2 font-mono text-xl text-mint tabular-nums"}>
                  {money(report.grossDividends)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {band === "nil"
                    ? `${money(report.minor?.roomTo416 ?? 0)} of room under the $416 tax-free amount.`
                    : band === "penalty66"
                      ? `Inside the 66% band. Illustrative tax ${money(report.minor?.illustrativeTax ?? 0)}.`
                      : `Over $1,307. Illustrative tax is 45% of the whole amount: ${money(report.minor?.illustrativeTax ?? 0)}.`}
                </p>
              </article>
            );
          })}
        {account?.ownerType === "Minor_Designated" ? (
          <article className="rounded-card border border-line bg-surface/90 p-4 md:col-span-2">
            <h3 className="text-lg font-semibold">Reported with the adult</h3>
            <p className="mt-1 text-sm text-muted">
              {firstName(account.name)} is a designated minor. Dividends are taxed at the adult's marginal rate and CGT stays with the trustee. Open the individual account for the combined worksheet.
            </p>
          </article>
        ) : null}
        {warnings.length > 0 ? (
          <article className="rounded-card border border-coral/40 bg-surface/90 p-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-coral">Ledger warnings</h3>
            <ul className="mt-2 grid gap-1 text-sm text-muted">
              {warnings.slice(0, 4).map((warning) => (
                <li key={`${warning.txId}-${warning.code}`}>{warning.message}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>

      <section className="rounded-card border border-line bg-surface/90 p-4">
        <h2 className="text-lg font-semibold">Largest positions</h2>
        <div className="mt-3 grid gap-2">
          {visible.slice(0, 6).map((row) => (
            <div key={`${row.accountId}-${row.ticker}`} className="grid grid-cols-[1fr_auto] gap-2 border-b border-line/70 py-2 text-sm last:border-0">
              <div>
                <p className="font-medium">{row.ticker}</p>
                <p className="text-xs text-muted">
                  {units(row.units)} · {row.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono tabular-nums">{money(row.marketValue)}</p>
                <p className={row.unrealised >= 0 ? "font-mono text-xs text-mint tabular-nums" : "font-mono text-xs text-coral tabular-nums"}>
                  {moneySigned(row.unrealised)}
                </p>
              </div>
            </div>
          ))}
          {visible.length === 0 ? <p className="text-sm text-muted">No open parcels in this view.</p> : null}
        </div>
      </section>
    </div>
  );
}
