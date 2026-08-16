const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { JsonStore } = require("../features/storage");
const { parseDuration, splitPipeArgs } = require("../features/parsers");

test("JsonStore persists updates atomically", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "discordbot-store-"));
  const file = path.join(directory, "state.json");
  const first = new JsonStore(file, { items: [] });
  first.update((state) => state.items.push({ id: 1 }));
  const second = new JsonStore(file, { items: [] });
  assert.deepEqual(second.value, { items: [{ id: 1 }] });
});

test("parseDuration accepts supported units", () => {
  assert.equal(parseDuration("30s"), 30_000);
  assert.equal(parseDuration("2h"), 7_200_000);
  assert.equal(parseDuration("1d"), 86_400_000);
  assert.equal(parseDuration("0m"), null);
  assert.equal(parseDuration("tomorrow"), null);
});

test("splitPipeArgs parses human-friendly command arguments", () => {
  assert.deepEqual(splitPipeArgs("Question? | Yes | No"), ["Question?", "Yes", "No"]);
  assert.equal(splitPipeArgs("only one"), null);
});
