import { useState, type ReactNode } from "react";
import { LayoutDashboard, PieChart, Scale, ScrollText, Shield, SlidersHorizontal, Users } from "lucide-react";
import { Cockpit } from "@/components/cockpit";
import { AccountsDialog, AssumptionsDialog, SecurityDialog, TransactionDialog } from "@/components/dialogs";
import { firstName, ownerLabel } from "@/components/format";
import { Holdings } from "@/components/holdings";
import { Ledger } from "@/components/ledger";
import { usePortfolio } from "@/components/portfolio-context";
import { TaxView } from "@/components/tax-view";
import { Button } from "@/components/ui";
import { financialYearOptions, type CgtMethod, type Transaction } from "@/lib/tax/engine";
import { cn } from "@/lib/utils";

type View = "cockpit" | "holdings" | "ledger" | "tax";

const VIEWS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { id: "holdings", label: "Holdings", icon: PieChart },
  { id: "ledger", label: "Ledger", icon: ScrollText },
  { id: "tax", label: "Tax", icon: Scale },
];

export function HelioApp() {
  const app = usePortfolio();
  const [view, setView] = useState<View>("cockpit");
  const [accountId, setAccountId] = useState<string | "all">("all");
  const [draft, setDraft] = useState<Transaction | "new" | null>(null);
  const [assumptions, setAssumptions] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);

  if (app.corrupt) {
    return (
      <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-6">
        <div className="rounded-card border border-line bg-surface p-6">
          <p className="text-xs tracking-widest text-teal">HELIO</p>
          <h1 className="mt-2 text-2xl font-semibold">Saved ledger could not be read</h1>
          <p className="mt-2 text-sm text-muted">{app.corrupt} Nothing was sent anywhere.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={app.restoreDemo}>
              Restore demo
            </Button>
            <Button variant="danger" onClick={app.erase}>
              Delete saved data
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (app.locked) return <LockScreen />;

  const warnings = app.sim.warnings.filter((warning) => {
    if (accountId === "all") return true;
    const tx = app.portfolio.transactions.find((item) => item.id === warning.txId);
    return tx?.accountId === accountId;
  });
  const years = financialYearOptions(app.portfolio);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pt-5 pb-28 md:pb-10">
      <header className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 grid-cols-2 gap-0.5 rounded-xl bg-surface p-1.5" aria-hidden>
              <span className="rounded-sm bg-teal" />
              <span className="rounded-sm bg-blue" />
              <span className="rounded-sm bg-mint" />
              <span className="rounded-sm bg-fg" />
            </span>
            <div>
              <p className="text-xs tracking-widest text-teal">HELIO</p>
              <h1 className="text-xl font-semibold">Family share ledger</h1>
              <p className="text-xs text-faint">On this device only · TFNs never stored</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" aria-label="Assumptions" onClick={() => setAssumptions(true)}>
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Assumptions</span>
            </Button>
            <Button size="sm" aria-label="Accounts" onClick={() => setAccountsOpen(true)}>
              <Users className="size-4" />
            </Button>
            <Button size="sm" aria-label="Privacy and seal" onClick={() => setSecurityOpen(true)} className={app.sealed ? undefined : "text-coral"}>
              <Shield className="size-4" />
              <span className="hidden sm:inline">{app.sealed ? "Sealed" : app.plainStored ? "Readable" : "Not saved"}</span>
            </Button>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted">
          Parent and children stay in separate tax entities. Franking credits, DRP parcels and CGT discounts are worked out here. Not an ATO lodgement and not personal tax advice.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="grid flex-1 gap-1 text-xs text-faint">
            Financial year
            <select
              className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
              value={app.portfolio.settings.financialYear}
              onChange={(event) =>
                app.update((current) => ({ ...current, settings: { ...current.settings, financialYear: event.target.value } }))
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="grid flex-1 gap-1 text-xs text-faint">
            Parcel method
            <select
              className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
              value={app.portfolio.settings.cgtMethod}
              onChange={(event) =>
                app.update((current) => ({
                  ...current,
                  settings: { ...current.settings, cgtMethod: event.target.value as CgtMethod },
                }))
              }
            >
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="MIN_TAX">Min-tax</option>
            </select>
          </label>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <AccountPill active={accountId === "all"} onClick={() => setAccountId("all")}>
            All accounts
          </AccountPill>
          {app.portfolio.accounts.map((account) => (
            <AccountPill key={account.id} active={accountId === account.id} onClick={() => setAccountId(account.id)}>
              {firstName(account.name)}
              <span className="block text-xs font-normal text-faint">{ownerLabel(account.ownerType)}</span>
            </AccountPill>
          ))}
        </div>
        <nav className="hidden gap-2 md:flex" aria-label="Sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn("min-h-11 rounded-full px-4 text-sm", view === item.id ? "pill-on" : "text-muted")}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mt-5 grid gap-4">
        {app.source === "sample" ? (
          <div className="rounded-card border border-line bg-surface/80 px-4 py-3 text-sm text-muted">
            <p>
              Demo family loaded: Harper, plus Ava (designated), Noah under $416, Mia in the 66% band, and Leo over $1,307. The demo is not written to this browser. Seal the ledger before you type real holdings.
            </p>
            <Button size="sm" variant="primary" className="mt-3" onClick={() => setSecurityOpen(true)}>
              Seal before real data
            </Button>
          </div>
        ) : null}
        {app.unsaved ? (
          <div className="rounded-card border border-coral/40 bg-surface px-4 py-3 text-sm">
            <p>These edits are only in this tab. Closing it drops them. Sealing stores an encrypted copy and nothing readable.</p>
            <Button size="sm" variant="primary" className="mt-3" onClick={() => setSecurityOpen(true)}>
              Seal to save
            </Button>
          </div>
        ) : null}
        {app.plainStored && !app.sealed ? (
          <div className="rounded-card border border-coral/40 bg-surface px-4 py-3 text-sm">
            <p>A readable copy is stored in this browser. Anyone who can open it can read the ledger.</p>
            <Button size="sm" variant="primary" className="mt-3" onClick={() => setSecurityOpen(true)}>
              Seal this ledger
            </Button>
          </div>
        ) : null}
        {app.notice ? (
          <p className="rounded-card border border-teal/40 bg-surface px-4 py-3 text-sm" role="status">
            {app.notice}
          </p>
        ) : null}
        {view === "cockpit" ? <Cockpit accountId={accountId} positions={app.positions} reports={app.reports} warnings={warnings} /> : null}
        {view === "holdings" ? <Holdings accountId={accountId} positions={app.positions} /> : null}
        {view === "ledger" ? (
          <Ledger accountId={accountId} onCreate={() => setDraft("new")} onEdit={(tx) => setDraft(tx)} />
        ) : null}
        {view === "tax" ? <TaxView accountId={accountId} /> : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur md:hidden" aria-label="Sections">
        <div className="grid grid-cols-4">
          {VIEWS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} type="button" className={cn("grid min-h-16 place-items-center text-xs", active ? "text-teal" : "text-muted")} onClick={() => setView(item.id)}>
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {draft ? (
        <TransactionDialog
          initial={draft === "new" ? null : draft}
          presetAccount={accountId}
          onClose={() => setDraft(null)}
        />
      ) : null}
      {assumptions ? <AssumptionsDialog onClose={() => setAssumptions(false)} /> : null}
      {securityOpen ? <SecurityDialog onClose={() => setSecurityOpen(false)} /> : null}
      {accountsOpen ? <AccountsDialog onClose={() => setAccountsOpen(false)} /> : null}
    </div>
  );
}

function AccountPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("min-h-11 shrink-0 rounded-2xl border border-line px-3 py-1 text-left text-sm", active ? "pill-on" : "bg-surface text-muted")}>
      {children}
    </button>
  );
}

function LockScreen() {
  const { unlock, busy, lockReason } = usePortfolio();
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6">
      <form
        className="w-full rounded-card border border-line bg-surface p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await unlock(pass);
          setPass("");
          if (result === "ok") return;
          setError(result === "cooldown" ? "Too many attempts. Wait 30 seconds." : "That passphrase did not open the ledger.");
        }}
      >
        <p className="text-xs tracking-widest text-teal">HELIO</p>
        <h1 className="mt-2 text-2xl font-semibold">Ledger sealed</h1>
        <p className="mt-2 text-sm text-muted">
          {lockReason ?? "The passphrase never leaves this browser, and Helio cannot reset it. Unlocking checks a slow key derivation, so a wrong guess is expensive."}
        </p>
        <label className="mt-4 grid gap-1 text-sm text-muted">
          Passphrase
          <input
            type="password"
            autoComplete="current-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={pass}
            onChange={(event) => setPass(event.target.value)}
            className="min-h-11 rounded-xl border border-line bg-raise px-3 text-fg"
          />
        </label>
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        <Button type="submit" variant="primary" className="mt-4 w-full" disabled={busy}>
          {busy ? "Checking passphrase…" : "Unlock"}
        </Button>
      </form>
    </main>
  );
}
