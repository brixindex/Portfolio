import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession, isSealedRecord, KDF_ITERATIONS, openSession, passphraseIssue, sealWithSession } from "./vault.ts";

describe("passphrase policy", () => {
  it("rejects short, common and padded phrases", () => {
    assert.match(passphraseIssue("short") ?? "", /12/);
    assert.match(passphraseIssue("123456789012") ?? "", /common/);
    assert.equal(passphraseIssue("correct horse battery"), null);
    assert.equal(passphraseIssue("ledger-key-99"), null);
  });
});

describe("seal", () => {
  it("round-trips, rejects a wrong passphrase, and rejects tampering", async () => {
    const session = await createSession("correct horse battery");
    const record = await sealWithSession(session, JSON.stringify({ version: 1, note: "family ledger" }));
    assert.equal(record.iterations, KDF_ITERATIONS);
    assert.equal(isSealedRecord(record), true);
    assert.equal(JSON.stringify(record).includes("family ledger"), false);

    const opened = await openSession("correct horse battery", record);
    assert.equal(opened?.plain.includes("family ledger"), true);

    const wrong = await openSession("correct horse battery!", record);
    assert.equal(wrong, null);

    const tampered = { ...record, ct: record.ct.slice(0, -4) + (record.ct.endsWith("aaaa") ? "bbbb" : "aaaa") };
    assert.equal(await openSession("correct horse battery", tampered), null);
    assert.equal(isSealedRecord({ ...record, iterations: 1000 }), false);
  });
});
