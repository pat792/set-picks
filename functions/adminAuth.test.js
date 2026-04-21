const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ADMIN_EMAIL_FOR_SETLIST_PROXY,
  parseSuperAdminUidsEnv,
  resolveAdminCallerRole,
  resolveSetAdminClaimCallerRole,
} = require("./adminAuth");

test("parseSuperAdminUidsEnv: returns empty set when unset", () => {
  const set = parseSuperAdminUidsEnv({});
  assert.ok(set instanceof Set);
  assert.equal(set.size, 0);
});

test("parseSuperAdminUidsEnv: trims whitespace and drops empties", () => {
  const set = parseSuperAdminUidsEnv({
    SUPER_ADMIN_UIDS: " abc , def, , ghi ,",
  });
  assert.deepEqual([...set].sort(), ["abc", "def", "ghi"]);
});

test("parseSuperAdminUidsEnv: handles single uid", () => {
  const set = parseSuperAdminUidsEnv({ SUPER_ADMIN_UIDS: "solo-uid" });
  assert.deepEqual([...set], ["solo-uid"]);
});

test("resolveAdminCallerRole: null when no auth", () => {
  assert.equal(resolveAdminCallerRole(null), null);
  assert.equal(resolveAdminCallerRole(undefined), null);
});

test("resolveAdminCallerRole: admin-claim takes precedence over email", () => {
  const role = resolveAdminCallerRole({
    uid: "u1",
    token: { admin: true, email: "random@example.com" },
  });
  assert.equal(role, "admin-claim");
});

test("resolveAdminCallerRole: legacy email accepted when no claim", () => {
  const role = resolveAdminCallerRole({
    uid: "u1",
    token: { email: ADMIN_EMAIL_FOR_SETLIST_PROXY },
  });
  assert.equal(role, "legacy-email");
});

test("resolveAdminCallerRole: admin=false is not admin", () => {
  assert.equal(
    resolveAdminCallerRole({ uid: "u1", token: { admin: false } }),
    null
  );
});

test("resolveAdminCallerRole: random signed-in user is not admin", () => {
  assert.equal(
    resolveAdminCallerRole({
      uid: "u1",
      token: { email: "someone@else.com" },
    }),
    null
  );
});

test("resolveSetAdminClaimCallerRole: super-admin via env UID", () => {
  const role = resolveSetAdminClaimCallerRole(
    { uid: "seed-uid", token: { email: "seed@example.com" } },
    new Set(["seed-uid"])
  );
  assert.equal(role, "super-admin");
});

test("resolveSetAdminClaimCallerRole: super-admin via legacy email (bootstrap)", () => {
  const role = resolveSetAdminClaimCallerRole(
    {
      uid: "whatever",
      token: { email: ADMIN_EMAIL_FOR_SETLIST_PROXY },
    },
    new Set()
  );
  assert.equal(role, "super-admin");
});

test("resolveSetAdminClaimCallerRole: admin claim delegates", () => {
  const role = resolveSetAdminClaimCallerRole(
    { uid: "delegate", token: { admin: true, email: "a@b.com" } },
    new Set()
  );
  assert.equal(role, "admin");
});

test("resolveSetAdminClaimCallerRole: no claim + no env + no legacy email → null", () => {
  const role = resolveSetAdminClaimCallerRole(
    { uid: "rando", token: { email: "rando@example.com" } },
    new Set(["other-uid"])
  );
  assert.equal(role, null);
});

test("resolveSetAdminClaimCallerRole: super-admin precedence over admin claim", () => {
  const role = resolveSetAdminClaimCallerRole(
    { uid: "seed-uid", token: { admin: true, email: "nope@example.com" } },
    new Set(["seed-uid"])
  );
  assert.equal(role, "super-admin");
});

test("resolveSetAdminClaimCallerRole: null auth returns null", () => {
  assert.equal(resolveSetAdminClaimCallerRole(null, new Set()), null);
});

test("resolveSetAdminClaimCallerRole: missing uid falls back to email/claim", () => {
  const viaEmail = resolveSetAdminClaimCallerRole(
    { token: { email: ADMIN_EMAIL_FOR_SETLIST_PROXY } },
    new Set()
  );
  assert.equal(viaEmail, "super-admin");
  const viaClaim = resolveSetAdminClaimCallerRole(
    { token: { admin: true } },
    new Set()
  );
  assert.equal(viaClaim, "admin");
});
