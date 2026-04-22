const test = require("node:test");
const assert = require("node:assert/strict");

const {
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

test("resolveAdminCallerRole: admin-claim qualifies", () => {
  const role = resolveAdminCallerRole({
    uid: "u1",
    token: { admin: true, email: "whatever@example.com" },
  });
  assert.equal(role, "admin-claim");
});

test("resolveAdminCallerRole: legacy email no longer qualifies (PR B)", () => {
  const role = resolveAdminCallerRole({
    uid: "u1",
    token: { email: "pat@road2media.com" },
  });
  assert.equal(role, null);
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

test("resolveSetAdminClaimCallerRole: legacy email no longer bootstraps (PR B)", () => {
  const role = resolveSetAdminClaimCallerRole(
    {
      uid: "whatever",
      token: { email: "pat@road2media.com" },
    },
    new Set()
  );
  assert.equal(role, null);
});

test("resolveSetAdminClaimCallerRole: admin claim delegates", () => {
  const role = resolveSetAdminClaimCallerRole(
    { uid: "delegate", token: { admin: true, email: "a@b.com" } },
    new Set()
  );
  assert.equal(role, "admin");
});

test("resolveSetAdminClaimCallerRole: no claim + no env → null", () => {
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

test("resolveSetAdminClaimCallerRole: missing uid + claim still delegates", () => {
  const viaClaim = resolveSetAdminClaimCallerRole(
    { token: { admin: true } },
    new Set()
  );
  assert.equal(viaClaim, "admin");
});
