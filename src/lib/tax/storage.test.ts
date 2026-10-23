import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPortfolio } from "./sample.ts";
import { parsePortfolioJson, persistenceMode } from "./storage.ts";

describe("ledger import guard", () => {
  it("rejects a tax file number field", () => {
    const portfolio = emptyPortfolio();
    assert.equal(parsePortfolioJson(portfolio).ok, true);
    const dirty = { ...portfolio, tfn: "123456789" };
    const parsed = parsePortfolioJson(dirty);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.error, /not stored/);
  });

  it("never writes a readable copy while a seal session is open", () => {
    assert.equal(persistenceMode(true, true), "sealed");
    assert.equal(persistenceMode(true, false), "sealed");
    assert.equal(persistenceMode(false, true), "plain");
    assert.equal(persistenceMode(false, false), "memory");
  });
});
