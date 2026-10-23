/**
 * On-device seal. The passphrase is used only to derive a non-extractable
 * AES-256-GCM key, then discarded by the caller. The key is never written
 * to storage. OWASP's PBKDF2-SHA256 floor is 600,000 iterations; older
 * seals from 100,000 upward still open.
 */

export const KDF_ITERATIONS = 600_000;
export const MIN_KDF_ITERATIONS = 100_000;
export const MAX_KDF_ITERATIONS = 1_000_000;
export const IDLE_LOCK_MS = 5 * 60 * 1000;
export const HIDDEN_LOCK_MS = 60 * 1000;

export type SealedRecord = {
  kind: "sealed";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ct: string;
};

export type SessionSeal = {
  key: CryptoKey;
  salt: string;
  iterations: number;
};

const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

const COMMON_PASSPHRASES = new Set([
  "password",
  "passphrase",
  "password123",
  "passphrase123",
  "helioledger",
  "letmeinplease",
  "qwertyuiopas",
  "123456789012",
  "changeme123",
  "iloveyou123",
]);

export function vaultAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

export function passphraseIssue(passphrase: string): string | null {
  if (passphrase.length < 12) return "Use at least 12 characters. A short sentence works well.";
  if (passphrase.length > 128) return "Use at most 128 characters.";
  if (/^\s|\s$/.test(passphrase)) return "Don't start or end with a space.";
  if (COMMON_PASSPHRASES.has(passphrase.toLowerCase())) return "That passphrase is too common.";
  if (/^(.)\1+$/.test(passphrase)) return "Don't repeat a single character.";
  if (passphrase.length < 16 && (!/[A-Za-z]/.test(passphrase) || !/\d/.test(passphrase))) {
    return "Under 16 characters, include a letter and a number — or use a longer sentence.";
  }
  return null;
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array | null {
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

function iterationsOk(iterations: number): boolean {
  return Number.isInteger(iterations) && iterations >= MIN_KDF_ITERATIONS && iterations <= MAX_KDF_ITERATIONS;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isSealedRecord(value: unknown): value is SealedRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as SealedRecord;
  if (row.kind !== "sealed" || row.kdf !== "PBKDF2-SHA256") return false;
  if (!iterationsOk(row.iterations)) return false;
  if (typeof row.salt !== "string" || typeof row.iv !== "string" || typeof row.ct !== "string") return false;
  if (!B64.test(row.salt) || !B64.test(row.iv) || !B64.test(row.ct)) return false;
  if (row.salt.length < 16 || row.iv.length < 8 || row.ct.length < 16 || row.ct.length > 5_000_000) return false;
  return true;
}

export async function createSession(passphrase: string): Promise<SessionSeal> {
  if (!vaultAvailable()) throw new Error("This browser cannot seal a ledger.");
  const issue = passphraseIssue(passphrase);
  if (issue) throw new Error(issue);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
  return { key, salt: bytesToB64(salt), iterations: KDF_ITERATIONS };
}

export async function openSession(
  passphrase: string,
  record: SealedRecord,
): Promise<{ plain: string; session: SessionSeal } | null> {
  if (!vaultAvailable() || !isSealedRecord(record)) return null;
  try {
    const salt = b64ToBytes(record.salt);
    const iv = b64ToBytes(record.iv);
    const ct = b64ToBytes(record.ct);
    if (!salt || !iv || !ct || salt.length !== 16 || iv.length !== 12) return null;
    const key = await deriveKey(passphrase, salt, record.iterations);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    return {
      plain: new TextDecoder().decode(plain),
      session: { key, salt: record.salt, iterations: record.iterations },
    };
  } catch {
    return null;
  }
}

export async function sealWithSession(session: SessionSeal, json: string): Promise<SealedRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, session.key, new TextEncoder().encode(json));
  return {
    kind: "sealed",
    kdf: "PBKDF2-SHA256",
    iterations: session.iterations,
    salt: session.salt,
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ct)),
  };
}
