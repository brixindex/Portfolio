import { useEffect, useMemo, useState } from "react";
import { ownerLabel } from "@/components/format";
import { usePortfolio } from "@/components/portfolio-context";
import { Button, Modal, SelectField, TextField } from "@/components/ui";
import {
  blankTransaction,
  financialYearOptions,
  frankingCredit,
  tradeTotal,
  type AssetClass,
  type Portfolio,
  type Transaction,
  type TxType,
} from "@/lib/tax/engine";
import { parsePortfolioJson, MAX_IMPORT_BYTES } from "@/lib/tax/storage";
import { isSealedRecord, KDF_ITERATIONS, passphraseIssue } from "@/lib/tax/vault";

const TYPES: TxType[] = ["BUY", "SELL", "DIVIDEND_CASH", "DIVIDEND_DRP", "SPLIT", "RETURN_OF_CAPITAL"];

function num(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000_000) return null;
  return parsed;
}

export function TransactionDialog({
  initial,
  presetAccount,
  onClose,
}: {
  initial: Transaction | null;
  presetAccount: string | "all";
  onClose: () => void;
}) {
  const { portfolio, update } = usePortfolio();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [accountId, setAccountId] = useState(initial?.accountId ?? (presetAccount === "all" ? portfolio.accounts[0]?.id ?? "" : presetAccount));
  const [tickerChoice, setTickerChoice] = useState(initial?.ticker ?? portfolio.securities[0]?.ticker ?? "__new");
  const [newTicker, setNewTicker] = useState("");
  const [securityName, setSecurityName] = useState("");
  const [sector, setSector] = useState("Diversified");
  const [assetClass, setAssetClass] = useState<AssetClass>("AU Equities");
  const [taxRate, setTaxRate] = useState<"0.3" | "0.25">("0.3");
  const [mark, setMark] = useState("");
  const [type, setType] = useState<TxType>(initial?.type ?? "BUY");
  const [tradeDate, setTradeDate] = useState(initial?.tradeDate ?? portfolio.settings.valuationDate);
  const [unitsValue, setUnitsValue] = useState(initial ? String(initial.units || "") : "");
  const [price, setPrice] = useState(initial ? String(initial.price || "") : "");
  const [brokerage, setBrokerage] = useState(initial ? String(initial.brokerage || "") : "");
  const [unfranked, setUnfranked] = useState(initial ? String(initial.unfrankedAud || "") : "");
  const [franked, setFranked] = useState(initial ? String(initial.frankedAud || "") : "");
  const [eventRate, setEventRate] = useState<"0.3" | "0.25">(initial?.companyTaxRate === 0.25 ? "0.25" : "0.3");
  const [drpPrice, setDrpPrice] = useState(initial ? String(initial.drpPrice || "") : "");
  const [splitRatio, setSplitRatio] = useState(initial?.splitRatio ? String(initial.splitRatio) : "2");
  const [note, setNote] = useState(initial?.note ?? "");

  const ticker = tickerChoice === "__new" ? newTicker.trim().toUpperCase() : tickerChoice;
  const preview = useMemo(() => {
    const draft = blankTransaction({
      type,
      units: num(unitsValue) ?? 0,
      price: num(price) ?? 0,
      brokerage: num(brokerage) ?? 0,
      unfrankedAud: num(unfranked) ?? 0,
      frankedAud: num(franked) ?? 0,
      companyTaxRate: Number(eventRate),
    });
    const credit = frankingCredit(draft.frankedAud, draft.companyTaxRate);
    return { total: tradeTotal(draft), credit, gross: draft.unfrankedAud + draft.frankedAud + credit };
  }, [type, unitsValue, price, brokerage, unfranked, franked, eventRate]);

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
    if ([unitsN, priceN, brokerageN, unfrankedN, frankedN, drpN, splitN].some((value) => value === null)) {
      return setError("Amounts need to be plain numbers, zero or more.");
    }
    if (!/^[A-Z0-9]+(\.[A-Z0-9]+)?$/.test(ticker)) return setError("Ticker should look like VAS.AX.");
    if (tickerChoice === "__new" && (!securityName.trim() || markN === null)) return setError("New tickers need a name and a mark.");
    if ((type === "BUY" || type === "SELL") && !(unitsN! > 0)) return setError("Enter the units.");
    if (type === "DIVIDEND_DRP" && !(drpN! > 0)) return setError("DRP needs an issue price.");
    if (type === "SPLIT" && (splitN === 1 || !(splitN! > 0))) return setError("Split ratio should be like 2 or 0.5.");
    if (type === "RETURN_OF_CAPITAL" && !(priceN! > 0)) return setError("Enter the capital returned per unit.");

    const tx: Transaction = blankTransaction({
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
      splitRatio: type === "SPLIT" ? (splitN ?? 0) : 0,
      note: note.slice(0, 280),
    });
    tx.totalAud = tradeTotal(tx);

    update((current) => {
      let securities = current.securities;
      if (!securities.some((security) => security.ticker === ticker)) {
        securities = [
          ...securities,
          {
            ticker,
            name: securityName.trim(),
            gicsSector: sector.trim() || "Unclassified",
            assetClass,
            exchange: "ASX",
            companyTaxRate: Number(taxRate),
            lastPrice: markN ?? 0,
          },
        ];
      }
      const transactions = initial
        ? current.transactions.map((row) => (row.id === initial.id ? tx : row))
        : [...current.transactions, tx];
      return { ...current, securities, transactions };
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? "Edit event" : "Record event"}
      description="Stored only in this browser. Franking credits are calculated from the company tax rate. A TFN is never asked for."
      onClose={onClose}
    >
      <div className="grid gap-3">
        <SelectField label="Account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          {portfolio.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {ownerLabel(account.ownerType)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Ticker" value={tickerChoice} onChange={(event) => setTickerChoice(event.target.value)}>
          {portfolio.securities.map((security) => (
            <option key={security.ticker} value={security.ticker}>
              {security.ticker} · {security.name}
            </option>
          ))}
          <option value="__new">Add a ticker</option>
        </SelectField>
        {tickerChoice === "__new" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Code" value={newTicker} onChange={(event) => setNewTicker(event.target.value.toUpperCase())} placeholder="VAS.AX" />
            <TextField label="Name" value={securityName} onChange={(event) => setSecurityName(event.target.value)} />
            <TextField label="GICS sector" value={sector} onChange={(event) => setSector(event.target.value)} />
            <SelectField label="Asset class" value={assetClass} onChange={(event) => setAssetClass(event.target.value as AssetClass)}>
              <option>AU Equities</option>
              <option>Intl Equities</option>
              <option>REITs</option>
              <option>Cash</option>
            </SelectField>
            <SelectField label="Company tax rate" value={taxRate} onChange={(event) => setTaxRate(event.target.value as "0.3" | "0.25")}>
              <option value="0.3">30%</option>
              <option value="0.25">25% base rate</option>
            </SelectField>
            <TextField label="Mark" inputMode="decimal" value={mark} onChange={(event) => setMark(event.target.value)} />
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Type" value={type} onChange={(event) => setType(event.target.value as TxType)}>
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {item === "DIVIDEND_CASH" ? "Cash dividend" : item === "DIVIDEND_DRP" ? "Dividend reinvestment" : item === "RETURN_OF_CAPITAL" ? "Capital return" : item === "SPLIT" ? "Split / consolidation" : item === "BUY" ? "Buy" : "Sell"}
              </option>
            ))}
          </SelectField>
          <TextField label="Date" type="date" value={tradeDate} onChange={(event) => setTradeDate(event.target.value)} />
        </div>
        {type === "BUY" || type === "SELL" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Units" inputMode="decimal" value={unitsValue} onChange={(event) => setUnitsValue(event.target.value)} />
            <TextField label="Price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
            <TextField label="Brokerage" inputMode="decimal" value={brokerage} onChange={(event) => setBrokerage(event.target.value)} />
          </div>
        ) : null}
        {type === "DIVIDEND_CASH" || type === "DIVIDEND_DRP" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Unfranked AUD" inputMode="decimal" value={unfranked} onChange={(event) => setUnfranked(event.target.value)} />
            <TextField label="Franked AUD" inputMode="decimal" value={franked} onChange={(event) => setFranked(event.target.value)} />
            <SelectField label="Company tax rate" value={eventRate} onChange={(event) => setEventRate(event.target.value as "0.3" | "0.25")} hint="Credit = franked × rate / (1 − rate).">
              <option value="0.3">30% · multiply by 3/7</option>
              <option value="0.25">25% · multiply by 1/3</option>
            </SelectField>
            {type === "DIVIDEND_DRP" ? (
              <TextField label="DRP price" inputMode="decimal" value={drpPrice} onChange={(event) => setDrpPrice(event.target.value)} hint="Units are rounded down to 4 d.p. Cash left over carries forward." />
            ) : null}
            <p className="text-sm text-muted sm:col-span-2">
              Franking credit {preview.credit.toFixed(2)} · grossed-up {preview.gross.toFixed(2)}. A DRP is still income on the payment date, plus a new parcel.
            </p>
          </div>
        ) : null}
        {type === "SPLIT" ? (
          <TextField label="New units per old unit" inputMode="decimal" value={splitRatio} onChange={(event) => setSplitRatio(event.target.value)} hint="2 means a 2-for-1 split. Cost base stays the same." />
        ) : null}
        {type === "RETURN_OF_CAPITAL" ? (
          <TextField label="Returned per unit" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} hint="Reduces cost base. Anything above the cost base is a CGT event G1." />
        ) : null}
        <TextField label="Note" value={note} maxLength={280} onChange={(event) => setNote(event.target.value)} />
        {type === "BUY" || type === "SELL" ? <p className="text-sm text-muted">Cash total {preview.total.toFixed(2)} AUD, brokerage {type === "BUY" ? "added to" : "taken off"} the consideration.</p> : null}
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <div className="flex flex-wrap justify-between gap-2">
          {initial ? (
            confirmDelete ? (
              <Button
                variant="danger"
                onClick={() => {
                  update((current) => ({ ...current, transactions: current.transactions.filter((row) => row.id !== initial.id) }));
                  onClose();
                }}
              >
                Confirm delete
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Save on this device
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function AssumptionsDialog({ onClose }: { onClose: () => void }) {
  const { portfolio, update } = usePortfolio();
  const years = financialYearOptions(portfolio);
  const [losses, setLosses] = useState<Record<string, string>>(() =>
    Object.fromEntries(portfolio.accounts.map((account) => [account.id, String(portfolio.settings.openingLosses[account.id] ?? "")])),
  );

  return (
    <Modal open title="Assumptions" description="These change the worksheets. They are not downloaded from a broker." onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const openingLosses: Record<string, number> = {};
          for (const account of portfolio.accounts) {
            const parsed = num(losses[account.id] ?? "");
            if (parsed === null) return;
            if (parsed > 0) openingLosses[account.id] = parsed;
          }
          const saved = update((current) => ({
            ...current,
            settings: {
              ...current.settings,
              financialYear: String(data.get("fy")),
              valuationDate: String(data.get("asof")),
              benchmarkRates: {
                au: Number(data.get("au")) / 100,
                intl: Number(data.get("intl")) / 100,
                reit: Number(data.get("reit")) / 100,
                cash: Number(data.get("cash")) / 100,
              },
              openingLosses,
            },
          }));
          if (saved) onClose();
        }}
      >
        <SelectField label="Financial year" name="fy" defaultValue={portfolio.settings.financialYear}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
        <TextField label="Valuation date" name="asof" type="date" defaultValue={portfolio.settings.valuationDate} hint="Events after this date are left out." />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="AU equities % / yr" name="au" inputMode="decimal" defaultValue={String(portfolio.settings.benchmarkRates.au * 100)} />
          <TextField label="Intl equities % / yr" name="intl" inputMode="decimal" defaultValue={String(portfolio.settings.benchmarkRates.intl * 100)} />
          <TextField label="REITs % / yr" name="reit" inputMode="decimal" defaultValue={String(portfolio.settings.benchmarkRates.reit * 100)} />
          <TextField label="Cash % / yr" name="cash" inputMode="decimal" defaultValue={String(portfolio.settings.benchmarkRates.cash * 100)} />
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm text-muted">Capital losses from before the ledger</legend>
          {portfolio.accounts.map((account) => (
            <TextField
              key={account.id}
              label={account.name}
              inputMode="decimal"
              value={losses[account.id] ?? ""}
              onChange={(event) => setLosses((current) => ({ ...current, [account.id]: event.target.value }))}
            />
          ))}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Apply
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AccountsDialog({ onClose }: { onClose: () => void }) {
  const { portfolio, update } = usePortfolio();
  const [rows, setRows] = useState(portfolio.accounts);

  return (
    <Modal open title="Accounts" description="Owner type decides who is taxed. Status is quoted or not — a TFN itself is never stored." onClose={onClose}>
      <div className="grid gap-3">
        {rows.map((account, index) => (
          <div key={account.id} className="grid gap-2 rounded-xl border border-line p-3">
            <TextField
              label="Name"
              value={account.name}
              onChange={(event) => setRows((current) => current.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))}
            />
            <SelectField
              label="Owner"
              value={account.ownerType}
              onChange={(event) =>
                setRows((current) =>
                  current.map((row, i) => (i === index ? { ...row, ownerType: event.target.value as Portfolio["accounts"][number]["ownerType"] } : row)),
                )
              }
            >
              <option value="Individual">Individual</option>
              <option value="Minor_Designated">Minor · adult trustee</option>
              <option value="Minor_Direct">Minor · own TFN</option>
            </SelectField>
            <SelectField
              label="TFN status"
              value={account.tfnStatus}
              onChange={(event) =>
                setRows((current) =>
                  current.map((row, i) => (i === index ? { ...row, tfnStatus: event.target.value as "Quoted" | "Not quoted" } : row)),
                )
              }
            >
              <option>Quoted</option>
              <option>Not quoted</option>
            </SelectField>
          </div>
        ))}
        <Button
          onClick={() =>
            setRows((current) => [
              ...current,
              { id: `acc-${crypto.randomUUID().slice(0, 8)}`, name: "New account", ownerType: "Minor_Direct", tfnStatus: "Quoted" },
            ])
          }
        >
          Add account
        </Button>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!rows.some((row) => row.ownerType === "Individual")) return;
              update((current) => ({ ...current, accounts: rows.map((row) => ({ ...row, name: row.name.trim().slice(0, 60) || "Account" })) }));
              onClose();
            }}
          >
            Save accounts
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function SecurityDialog({ onClose }: { onClose: () => void }) {
  const { notice, setNotice, busy, sealed, plainStored, canSeal, seal, unseal, lock, restoreDemo, erase, replace, installSealed, exportBackup, rememberPlain, forgetPlain } = usePortfolio();
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [current, setCurrent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [confirmPlain, setConfirmPlain] = useState(false);
  const [confirmStore, setConfirmStore] = useState(false);

  useEffect(() => setError(null), [pass, again, current]);

  const download = (filename: string, body: string) => {
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open
      title="Privacy and seal"
      description="The ledger stays in this browser. Nothing is uploaded, and a tax file number is never asked for or stored."
      onClose={onClose}
    >
      <div className="grid gap-4 text-sm text-muted">
        <ul className="grid gap-1">
          <li>Figures stay in this browser. Nothing is uploaded, and a tax file number is never asked for or stored.</li>
          <li>Until you seal, edits stay in this tab and are not written to the device.</li>
          <li>A seal encrypts the saved copy with AES-256-GCM. The key is derived with {KDF_ITERATIONS.toLocaleString("en-AU")} rounds of PBKDF2 and is kept only in memory. Helio cannot reset a forgotten passphrase.</li>
          <li>The screen locks after 5 idle minutes, or after 1 minute in a hidden tab. Five wrong guesses impose a 30 second wait.</li>
        </ul>
        {sealed ? (
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await unseal(current);
              setCurrent("");
              if (result === "ok") onClose();
              else setError(result === "cooldown" ? "Too many attempts. Wait 30 seconds." : "That passphrase did not open the seal.");
            }}
          >
            <p className="text-fg">Saved copy is sealed. Removing the seal deletes that encrypted copy and does not leave a readable file behind.</p>
            <TextField
              label="Current passphrase"
              type="password"
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                Remove seal
              </Button>
              <Button type="button" onClick={() => { lock(); onClose(); }}>
                Lock now
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const issue = passphraseIssue(pass);
              if (issue) return setError(issue);
              if (pass !== again) return setError("The two passphrases do not match.");
              const ok = await seal(pass);
              setPass("");
              setAgain("");
              if (ok) onClose();
            }}
          >
            <TextField
              label="New passphrase"
              type="password"
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={pass}
              onChange={(event) => setPass(event.target.value)}
              hint={!pass ? "12+ characters. A short sentence is stronger than a tricky word." : (passphraseIssue(pass) ?? "Long enough to seal.")}
            />
            <TextField
              label="Repeat passphrase"
              type="password"
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={again}
              onChange={(event) => setAgain(event.target.value)}
            />
            <Button type="submit" variant="primary" disabled={busy || !canSeal}>
              {busy ? "Sealing…" : "Seal this ledger"}
            </Button>
          </form>
        )}
        {error ? <p className="text-coral">{error}</p> : null}
        {!canSeal ? <p className="text-coral">This browser cannot run the seal. Don't enter real holdings here.</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const file = await exportBackup();
              if (!file.encrypted && !confirmPlain) {
                setConfirmPlain(true);
                setError("That download is readable. Choose export again to confirm, or seal first.");
                return;
              }
              download(file.filename, file.body);
              setConfirmPlain(false);
              setError(null);
            }}
          >
            {sealed ? "Export sealed backup" : confirmPlain ? "Download readable file" : "Export backup"}
          </Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4">
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (file.size > MAX_IMPORT_BYTES) return setNotice("That file is too large.");
                try {
                  const parsed = JSON.parse(await file.text()) as unknown;
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
              }}
            />
          </label>
          <Button onClick={restoreDemo}>Restore demo</Button>
          {!sealed && !plainStored ? (
            <Button
              onClick={() => {
                if (!confirmStore) {
                  setConfirmStore(true);
                  setError("That stores a readable ledger in this browser. Choose it again to confirm, or seal instead.");
                  return;
                }
                rememberPlain();
                setConfirmStore(false);
              }}
            >
              {confirmStore ? "Confirm readable copy" : "Store readable copy"}
            </Button>
          ) : null}
          {!sealed && plainStored ? (
            <Button
              onClick={() => {
                forgetPlain();
                setConfirmStore(false);
              }}
            >
              Remove readable copy
            </Button>
          ) : null}
          {confirmErase ? (
            <Button variant="danger" onClick={() => { erase(); onClose(); }}>
              Confirm delete
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmErase(true)}>
              Delete ledger
            </Button>
          )}
        </div>
        {notice ? <p>{notice}</p> : null}
      </div>
    </Modal>
  );
}
