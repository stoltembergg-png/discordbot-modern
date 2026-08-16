const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAuthDetails } = require("../auth");

test("rejects a missing bot token", () => {
  assert.deepEqual(validateAuthDetails({}), ["bot_token is required"]);
});

test("rejects an undefined or blank bot token", () => {
  assert.deepEqual(validateAuthDetails({ bot_token: undefined }), ["bot_token is required"]);
  assert.deepEqual(validateAuthDetails({ bot_token: "   " }), ["bot_token is required"]);
});

test("accepts a non-empty bot token", () => {
  assert.deepEqual(validateAuthDetails({ bot_token: "test-token" }), []);
});
