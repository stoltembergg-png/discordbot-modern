const test = require("node:test");
const assert = require("node:assert/strict");
const { createPermissions } = require("../permissions");

test("dangerous commands are denied by default", () => {
  const permissions = createPermissions();
  assert.equal(permissions.checkPermission("user", "eval"), false);
  assert.equal(permissions.checkPermission("user", "exec"), false);
  assert.equal(permissions.checkPermission("user", "ping"), true);
});

test("toggle creates a missing user entry", () => {
  const permissions = createPermissions();
  assert.equal(permissions.toggleUserPermission("user", "cmdauth"), true);
  assert.equal(permissions.checkPermission("user", "cmdauth"), true);
});

test("explicit user permissions override global permissions", () => {
  const permissions = createPermissions({
    global: { ping: false },
    users: { user: { ping: true } },
  });
  assert.equal(permissions.checkPermission("user", "ping"), true);
});
