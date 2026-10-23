import { firstName, money, moneySigned, units } from "@/components/format";
import { usePortfolio } from "@/components/portfolio-context";
import type { Position } from "@/lib/tax/engine";

export function Holdings({ accountId, positions }: { accountId: string | "all"; positions: Position[] }) {
  const { portfolio, update, sim } = usePortfolio();
  const visible = positions.filter((row) => accountId === "all" || row.accountId === accountId);

  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Open parcels</h2>
          <p className="text-sm text-muted">Marks are yours. Change a price and the market value follows. Parcels follow the selected matching method.</p>
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-sm text-muted">Nothing open here. Record a buy from the ledger.</p>
      ) : null}
      {visible.map((row) => {
        const owner = portfolio.accounts.find((account) => account.id === row.accountId);
        const residual = sim.residuals.find((item) => item.accountId === row.accountId && item.ticker === row.ticker);
        return (
          <article key={`${row.accountId}-${row.ticker}`} className="rounded-card border border-line bg-surface/90 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-faint">{owner ? firstName(owner.name) : row.accountId} · {row.assetClass}</p>
                <h3 className="text-lg font-semibold">{row.ticker}</h3>
                <p className="text-sm text-muted">{row.name} · {row.gicsSector}</p>
              </div>
              <form
                className="grid gap-1 text-right"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  const next = Number(data.get("mark"));
                  if (!Number.isFinite(next) || next < 0) return;
                  update((current) => ({
                    ...current,
                    securities: current.securities.map((security) =>
                      security.ticker === row.ticker ? { ...security, lastPrice: next } : security,
                    ),
                  }));
                }}
              >
                <label className="text-xs text-faint" htmlFor={`mark-${row.accountId}-${row.ticker}`}>
                  Mark
                </label>
                <div className="flex items-center justify-end gap-2">
                  <input
                    id={`mark-${row.accountId}-${row.ticker}`}
                    name="mark"
                    inputMode="decimal"
                    defaultValue={row.lastPrice}
                    key={`${row.ticker}-${row.lastPrice}`}
                    className="min-h-11 w-24 rounded-xl border border-line bg-raise px-3 text-right font-mono text-sm text-fg"
                  />
                  <button type="submit" className="min-h-11 rounded-full border border-line px-3 text-xs text-fg">
                    Set
                  </button>
                </div>
              </form>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-faint">Units</dt>
                <dd className="font-mono tabular-nums">{units(row.units)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Cost base</dt>
                <dd className="font-mono tabular-nums">{money(row.costBase)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Value</dt>
                <dd className="font-mono tabular-nums">{money(row.marketValue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Unrealised</dt>
                <dd className={row.unrealised >= 0 ? "font-mono text-mint tabular-nums" : "font-mono text-coral tabular-nums"}>{moneySigned(row.unrealised)}</dd>
              </div>
            </dl>
            {residual ? <p className="mt-3 text-xs text-teal">DRP residual carried: {money(residual.cash)}</p> : null}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue">Tax parcels</summary>
              <ul className="mt-2 grid gap-2">
                {row.parcels.map((parcel) => (
                  <li key={parcel.id} className="grid gap-1 rounded-xl bg-raise px-3 py-2 text-xs text-muted sm:grid-cols-4">
                    <span>{parcel.acquisitionDate}</span>
                    <span>{parcel.source === "DRP" ? "DRP" : "Buy"} · {units(parcel.unitsRemaining)}</span>
                    <span className="font-mono tabular-nums">{money(parcel.totalCostBase)}</span>
                    <span className="font-mono tabular-nums">Unit {money(parcel.unitsRemaining ? parcel.totalCostBase / parcel.unitsRemaining : 0)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        );
      })}
    </div>
  );
}
