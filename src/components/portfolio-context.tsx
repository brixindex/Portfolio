import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildPositions, reportForFy, simulate, type Portfolio, type Position, type EntityReport, type Simulation } from "@/lib/tax/engine";
import { emptyPortfolio, samplePortfolio } from "@/lib/tax/sample";
import { clearStorage, LEDGER_KEY, parsePortfolioJson, persistenceMode, readStorage, writeOpen, writeSealed, type StoredPortfolio } from "@/lib/tax/storage";
import {
  createSession,
  HIDDEN_LOCK_MS,
  IDLE_LOCK_MS,
  isSealedRecord,
  openSession,
  passphraseIssue,
  sealWithSession,
  vaultAvailable,
  type SealedRecord,
  type SessionSeal,
} from "@/lib/tax/vault";

type Source = "sample" | "saved" | "memory";

export type BackupFile = { filename: string; body: string; encrypted: boolean };

type PortfolioContextValue = {
  portfolio: Portfolio;
  source: Source;
  hydrated: boolean;
  locked: boolean;
  sealed: boolean;
  plainStored: boolean;
  unsaved: boolean;
  canSeal: boolean;
  corrupt: string | null;
  busy: boolean;
  notice: string | null;
  lockReason: string | null;
  cooldownUntil: number;
  sim: Simulation;
  positions: Position[];
  reports: EntityReport[];
  setNotice: (notice: string | null) => void;
  update: (recipe: (portfolio: Portfolio) => Portfolio) => boolean;
  replace: (portfolio: Portfolio) => void;
  unlock: (passphrase: string) => Promise<"ok" | "denied" | "cooldown">;
  lock: () => void;
  seal: (passphrase: string) => Promise<boolean>;
  unseal: (passphrase: string) => Promise<"ok" | "denied" | "cooldown">;
  installSealed: (record: SealedRecord) => boolean;
  rememberPlain: () => void;
  forgetPlain: () => void;
  exportBackup: () => Promise<BackupFile>;
  restoreDemo: () => void;
  erase: () => void;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio>(() => samplePortfolio());
  const [source, setSource] = useState<Source>("sample");
  const [hydrated, setHydrated] = useState(false);
  const [locked, setLocked] = useState(false);
  const [sealed, setSealed] = useState(false);
  const [plainStored, setPlainStored] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [corrupt, setCorrupt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const portfolioRef = useRef(portfolio);
  const sessionRef = useRef<SessionSeal | null>(null);
  const sealedRef = useRef<SealedRecord | null>(null);
  const plainStoredRef = useRef(false);
  const unsavedRef = useRef(false);
  const hydratedRef = useRef(false);
  const chain = useRef(Promise.resolve());
  const epoch = useRef(0);
  const failsRef = useRef(0);
  const waitUntilRef = useRef(0);
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

  const markPlain = (value: boolean) => {
    plainStoredRef.current = value;
    setPlainStored(value);
  };

  const markUnsaved = (value: boolean) => {
    unsavedRef.current = value;
    setUnsaved(value);
  };

  useEffect(() => {
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
    } else {
      markPlain(false);
    }
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  const persist = (next: StoredPortfolio) => {
    const ticket = ++epoch.current;
    const session = sessionRef.current;
    const snapshot = JSON.stringify(next);
    chain.current = chain.current
      .then(async () => {
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
        writeOpen(JSON.parse(snapshot) as StoredPortfolio);
      })
      .catch(() => setNotice("The ledger could not be saved in this browser."));
  };

  const commit = (next: Portfolio, savedNotice?: string) => {
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

  const update = (recipe: (current: Portfolio) => Portfolio) => commit(recipe(portfolioRef.current));

  const replace = (next: Portfolio) => {
    commit(next, "Ledger replaced on this device.");
  };

  const tooManyAttempts = () => Date.now() < waitUntilRef.current;

  const noteFailure = () => {
    failsRef.current += 1;
    if (failsRef.current >= 5) {
      failsRef.current = 0;
      const until = Date.now() + 30_000;
      waitUntilRef.current = until;
      setCooldownUntil(until);
    }
  };

  const unlock = async (passphrase: string): Promise<"ok" | "denied" | "cooldown"> => {
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
      const parsed = parsePortfolioJson(JSON.parse(opened.plain) as unknown);
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

  const seal = async (passphrase: string) => {
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
    const job = chain.current
      .then(async () => {
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
      })
      .catch(() => {
        setNotice("The ledger could not be sealed in this browser.");
        return false;
      })
      .finally(() => setBusy(false));
    chain.current = job.then(() => undefined);
    return job;
  };

  const unseal = async (passphrase: string): Promise<"ok" | "denied" | "cooldown"> => {
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
      const parsed = parsePortfolioJson(JSON.parse(opened.plain) as unknown);
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

  const installSealed = (record: SealedRecord) => {
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

  const exportBackup = async (): Promise<BackupFile> => {
    await chain.current;
    if (sessionRef.current && sealedRef.current) {
      return {
        filename: "helio-ledger.sealed.json",
        body: JSON.stringify(sealedRef.current),
        encrypted: true,
      };
    }
    return {
      filename: "helio-ledger.json",
      body: JSON.stringify(portfolioRef.current, null, 2),
      encrypted: false,
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

  useEffect(() => {
    if (!unsaved) return;
    const onBefore = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [unsaved]);

  useEffect(() => {
    if (!hydrated || !sealed || locked) return;
    let idleTimer = window.setTimeout(() => lock(), IDLE_LOCK_MS);
    let hiddenTimer: number | undefined;
    const bump = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => lock(), IDLE_LOCK_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenTimer = window.setTimeout(() => lock(), HIDDEN_LOCK_MS);
      } else if (hiddenTimer) {
        window.clearTimeout(hiddenTimer);
        hiddenTimer = undefined;
      }
    };
    const onPageHide = () => lock();
    const onPageShow = (event: PageTransitionEvent) => {
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
  }, [hydrated, sealed, locked]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LEDGER_KEY) return;
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

  const sim = useMemo(() => simulate(portfolio, portfolio.settings.cgtMethod), [portfolio]);
  const positions = useMemo(() => buildPositions(sim, portfolio), [sim, portfolio]);
  const reports = useMemo(
    () => reportForFy(sim, portfolio, portfolio.settings.financialYear),
    [sim, portfolio],
  );

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
    positions,
    reports,
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
    erase,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error("Portfolio missing");
  return value;
}
