export async function loadAuthenticatedProfile(client, authUser) {
  if (!client || !authUser?.id) {
    throw new Error("A valid Supabase session is required.");
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, name, role, preferred_language, location, account_status")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load your account profile: ${error.message}`);
  if (!data) {
    throw new Error("Your account profile is missing. Apply the Supabase migrations, then sign out and register again or contact the project administrator.");
  }
  if (data.account_status !== "active") {
    throw new Error("This account is not active. Contact the project administrator.");
  }

  return {
    id: data.id,
    name: data.name || authUser.user_metadata?.name || authUser.email || authUser.phone || "User",
    role: data.role,
    language: data.preferred_language || "en",
    location: data.location || "",
    email: data.email || authUser.email || "",
    phone: data.phone || authUser.phone || "",
    authenticated: true,
  };
}

export async function restoreAuthenticatedSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(`Could not restore your Supabase session: ${error.message}`);
  const session = data.session || null;
  return {
    session,
    profile: session?.user ? await loadAuthenticatedProfile(client, session.user) : null,
  };
}

export async function signInWithPassword(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session || !data.user) throw new Error("Sign-in did not create a session. Check your credentials and email verification.");
  return data;
}

export async function registerWithPassword(client, { email, password, name, language }) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name, preferred_language: language } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function requestPasswordReset(client, email, redirectTo) {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function signOutAuthenticatedUser(client) {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateAuthenticatedProfile(client, userId, updates) {
  const { data, error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, name, role, preferred_language, location, account_status")
    .single();
  if (error) throw new Error(`Could not save your profile: ${error.message}`);
  if (!data || data.id !== userId) throw new Error("The profile update was not confirmed.");
  return data;
}
