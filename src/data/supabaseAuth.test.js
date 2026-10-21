import assert from "node:assert/strict";
import test from "node:test";
import {
  loadAuthenticatedProfile,
  registerWithPassword,
  requestPasswordReset,
  restoreAuthenticatedSession,
  signInWithPassword,
  signOutAuthenticatedUser,
} from "./supabaseAuth.js";

function profileClient(profile, profileError = null) {
  const requests = [];
  const client = {
    from(table) {
      requests.push({ table });
      return {
        select(columns) {
          requests.at(-1).columns = columns;
          return this;
        },
        eq(column, value) {
          requests.at(-1).filter = [column, value];
          return this;
        },
        async maybeSingle() {
          return { data: profile, error: profileError };
        },
      };
    },
  };
  return { client, requests };
}

test("session restoration loads the authoritative database role and profile", async () => {
  const user = { id: "user-1", email: "farmer@example.test", user_metadata: { name: "Test Farmer" } };
  const { client, requests } = profileClient({
    id: user.id,
    name: "Test Farmer",
    role: "farmer",
    preferred_language: "te",
    location: "Andhra Pradesh",
    account_status: "active",
  });
  client.auth = { async getSession() { return { data: { session: { user } }, error: null }; } };

  const restored = await restoreAuthenticatedSession(client);

  assert.equal(restored.profile.id, "user-1");
  assert.equal(restored.profile.role, "farmer");
  assert.equal(restored.profile.language, "te");
  assert.equal(requests[0].filter[1], "user-1");
  assert.match(requests[0].columns, /role/);
});

test("session restoration handles signed-out state and session restoration errors", async () => {
  const emptyClient = { auth: { async getSession() { return { data: { session: null }, error: null }; } } };
  assert.deepEqual(await restoreAuthenticatedSession(emptyClient), { session: null, profile: null });

  const failedClient = { auth: { async getSession() { return { data: null, error: { message: "offline" } }; } } };
  await assert.rejects(restoreAuthenticatedSession(failedClient), /offline/);
});

test("missing, suspended, or failed database profiles block authenticated access", async () => {
  const user = { id: "user-2" };
  const missing = profileClient(null);
  await assert.rejects(loadAuthenticatedProfile(missing.client, user), /profile is missing/);

  const suspended = profileClient({ id: user.id, role: "farmer", account_status: "suspended" });
  await assert.rejects(loadAuthenticatedProfile(suspended.client, user), /not active/);

  const broken = profileClient(null, { message: "database unavailable" });
  await assert.rejects(loadAuthenticatedProfile(broken.client, user), /database unavailable/);
});

test("authentication errors are surfaced and signup does not accept a client-selected role", async () => {
  const failedSignIn = { auth: { async signInWithPassword() { return { data: {}, error: { message: "invalid credentials" } }; } } };
  await assert.rejects(signInWithPassword(failedSignIn, "a@example.test", "password"), /invalid credentials/);

  let signupPayload;
  const registrationClient = {
    auth: {
      async signUp(payload) {
        signupPayload = payload;
        return { data: { user: { id: "new-user" }, session: null }, error: null };
      },
      async resetPasswordForEmail(email, options) {
        assert.equal(email, "a@example.test");
        assert.equal(options.redirectTo, "https://example.test");
        return { error: null };
      },
    },
  };
  await registerWithPassword(registrationClient, {
    email: "a@example.test",
    password: "password",
    name: "Farmer",
    language: "en",
    role: "admin",
  });
  assert.deepEqual(signupPayload.options.data, { name: "Farmer", preferred_language: "en" });
  await requestPasswordReset(registrationClient, "a@example.test", "https://example.test");

  const failedResetClient = {
    auth: {
      async resetPasswordForEmail() { return { error: { message: "mail provider unavailable" } }; },
    },
  };
  await assert.rejects(requestPasswordReset(failedResetClient, "a@example.test", "https://example.test"), /mail provider unavailable/);
  await assert.rejects(signOutAuthenticatedUser({
    auth: { async signOut() { return { error: { message: "network unavailable" } }; } },
  }), /network unavailable/);
});
