import { useMemo, useState } from "react";
import { firstName, money, txLabel, units } from "@/components/format";
import { usePortfolio } from "@/components/portfolio-context";
import { Button } from "@/components/ui";
import type { Transaction, TxType } from "@/lib/tax/engine";

const FILTERS: Array<TxType | "ALL"> = ["ALL", "BUY", "SELL", "DIVIDEND_CASH", "DIVIDEND_DRP", "SPLIT", "RETURN_OF_CAPITAL"];

export function Ledger({
  accountId,
  onCreate,
  onEdit,
}: {
  accountId: string | "all";
  onCreate: () => void;
  onEdit: (tx: Transaction) => void;
}) {
  const { portfolio, sim } = usePortfolio();
  const [kind, setKind] = useState<TxType | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    return [...portfolio.transactions]
      .filter((tx) => (accountId === "all" || tx.accountId === accountId) && (kind === "ALL" || tx.type === kind))
      .filter((tx) => !q || tx.ticker.includes(q) || tx.note.toUpperCase().includes(q))
      .sort((a, b) => (a.tradeDate < b.tradeDate ? 1 : a.tradeDate > b.tradeDate ? -1 : a.id < b.id ? 1 : -1));
  }, [portfolio.transactions, accountId, kind, query]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Events</h2>
          <p className="text-sm text-muted">Buys, sells, dividends, DRPs, splits and capital returns. The engine re-sorts by date.</p>
        </div>
        <Button variant="primary" onClick={onCreate}>
          Record event
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ticker or note"
          aria-label="Search events"
          className="min-h-11 flex-1 rounded-xl border border-line bg-raise px-3 text-sm"
        />
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as TxType | "ALL")}
          aria-label="Event type"
          className="min-h-11 rounded-xl border border-line bg-raise px-3 text-sm"
        >
          {FILTERS.map((item) => (
            <option key={item} value={item}>
              {item === "ALL" ? "All types" : txLabel(item)}
            </option>
          ))}
        </select>
      </div>
      <ul className="grid gap-2">
        {rows.map((tx) => {
          const owner = portfolio.accounts.find((account) => account.id === tx.accountId);
          const dividend = sim.dividends.find((line) => line.txId === tx.id);
          const warning = sim.warnings.find((item) => item.txId === tx.id);
          const detail =
            tx.type === "BUY" || tx.type === "SELL"
              ? `${units(tx.units)} @ ${money(tx.price)}`
              : tx.type === "DIVIDEND_DRP"
                ? `${money(tx.unfrankedAud + tx.frankedAud)} → ${units(dividend?.drpUnits ?? sim.drpUnitsByTx[tx.id] ?? 0)} units`
                : tx.type === "DIVIDEND_CASH"
                  ? money(tx.unfrankedAud + tx.frankedAud)
                  : tx.type === "SPLIT"
                    ? `${tx.splitRatio}-for-1`
                    : `${money(tx.price)} / unit`;
          return (
            <li key={tx.id}>
              <button
                type="button"
                onClick={() => onEdit(tx)}
                className="grid w-full gap-1 rounded-card border border-line bg-surface/90 px-4 py-3 text-left transition-transform duration-150 active:scale-[0.99] sm:grid-cols-[7rem_1fr_auto]"
              >
                <span className="font-mono text-xs text-faint tabular-nums">{tx.tradeDate}</span>
                <span>
                  <span className="font-medium">{tx.ticker}</span>
                  <span className="text-muted"> · {txLabel(tx.type)}</span>
                  <span className="mt-0.5 block text-xs text-faint">
                    {owner ? firstName(owner.name) : "Account"} · {detail}
                    {dividend ? ` · credit ${money(dividend.frankingCredit)}` : ""}
                    {warning ? ` · ${warning.message}` : ""}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums sm:text-right">{money(tx.totalAud)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? <p className="text-sm text-muted">No events match.</p> : null}
    </div>
  );
}
