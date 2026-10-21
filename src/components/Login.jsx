
import { useState } from "react";
import { loadAuthenticatedProfile, registerWithPassword, requestPasswordReset, signInWithPassword } from "../data/supabaseAuth";

function Login({ role, language, onLogin, onBack, onPasswordChanged, recoveryMode = false, supabaseClient }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("details");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [authView, setAuthView] = useState(recoveryMode ? "change_password" : "sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const roleName =
    role === "farmer"
      ? "🌾 Farmer Login"
      : role === "buyer"
      ? "🛒 Buyer Login"
      : "🤝 FPO / Cooperative Login";

  function startVoiceInput() {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();

    recognition.lang =
      language === "te"
        ? "te-IN"
        : language === "hi"
        ? "hi-IN"
        : language === "mr"
        ? "mr-IN"
        : language === "kn"
        ? "kn-IN"
        : language === "ta"
        ? "ta-IN"
        : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setError("");

    recognition.start();

    recognition.onresult = (event) => {
      const spokenName = event.results[0][0].transcript;
      setName(spokenName);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      setError("Voice input could not be detected. Please type your name.");
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  function continueToPhone() {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setStep("phone");
  }

  function sendOTP() {
    setError("");

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    /*
      Prototype OTP.
      In the final version this will be connected
      to a real SMS OTP service.
    */

    setOtp("123456");
    setStep("otp");
  }

  function verifyOTP() {
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    onLogin({
      name: name.trim(),
      role: role,
      language: language,
    });
  }

  async function submitSupabaseAuth(event) {
    event.preventDefault();
    setError("");
    setAuthMessage("");
    setAuthBusy(true);
    try {
      if (authView === "change_password") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");
        const { error: updateError } = await supabaseClient.auth.updateUser({ password });
        if (updateError) throw updateError;
        setAuthMessage("Password updated. Your account is signing in…");
        await onPasswordChanged();
        return;
      }
      if (authView === "reset") {
        await requestPasswordReset(supabaseClient, email.trim(), `${window.location.origin}`);
        setAuthMessage("If an account exists for that email, a password reset link has been sent.");
        return;
      }
      if (authView === "register") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");
        const { session, user: registeredUser } = await registerWithPassword(supabaseClient, {
          email: email.trim(),
          password,
          name: name.trim(),
          language,
        });
        if (!registeredUser) throw new Error("Registration did not return an account. Please try again.");
        if (!session) {
          setAuthMessage("Account created. Check your email to confirm the address, then sign in. New accounts start with the Farmer role; an administrator assigns other roles.");
          setAuthView("sign_in");
          setPassword("");
          setConfirmPassword("");
          return;
        }
        const profile = await loadAuthenticatedProfile(supabaseClient, registeredUser);
        onLogin(profile);
        return;
      }

      const { user: authenticatedUser } = await signInWithPassword(supabaseClient, email.trim(), password);
      onLogin(await loadAuthenticatedProfile(supabaseClient, authenticatedUser));
    } catch (authError) {
      setError(authError.message || "Authentication failed. Please retry.");
    } finally {
      setAuthBusy(false);
    }
  }

  if (supabaseClient) {
    const registering = authView === "register";
    const resetting = authView === "reset";
    const changingPassword = authView === "change_password";
    return (
      <main className="selection-page">
        <section className="selection-card login-card">
          <div className="brand-icon">🔐</div>
          <h1>{changingPassword ? "Choose a new password" : resetting ? "Reset your password" : registering ? "Create your account" : "Welcome back"}</h1>
          <p className="tagline">Secure sign-in with Supabase</p>
          <div className="auth-mode-banner">
            <strong>Database mode</strong>
            <span>Use your account credentials. No demo OTP or browser role selection is used.</span>
          </div>
          <form onSubmit={submitSupabaseAuth} className="auth-form">
            {registering && <>
              <label className="input-label" htmlFor="auth-name">Your name</label>
              <input id="auth-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} autoComplete="name" />
            </>}
            {!changingPassword && <>
              <label className="input-label" htmlFor="auth-email">Email address</label>
              <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </>}
            {!resetting && <>
              <label className="input-label" htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={registering || changingPassword ? "new-password" : "current-password"} />
            </>}
            {(registering || changingPassword) && <>
              <label className="input-label" htmlFor="auth-confirm-password">Confirm password</label>
              <input id="auth-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              {registering && <p className="form-disclaimer">Self-registration creates a Farmer account. Buyer, FPO, and Admin roles require administrator authorization.</p>}
            </>}
            {error && <p className="login-error" role="alert">{error}</p>}
            {authMessage && <p className="auth-message" role="status">{authMessage}</p>}
            <button className="primary-button" type="submit" disabled={authBusy}>
              {authBusy ? "Please wait…" : changingPassword ? "Update password" : resetting ? "Send reset link" : registering ? "Create account" : "Sign in"}
            </button>
          </form>
          {!changingPassword && <div className="auth-links">
            {!resetting && <button type="button" onClick={() => { setAuthView(registering ? "sign_in" : "register"); setError(""); setAuthMessage(""); }}>
              {registering ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>}
            {!registering && <button type="button" onClick={() => { setAuthView(resetting ? "sign_in" : "reset"); setError(""); setAuthMessage(""); }}>
              {resetting ? "Back to sign in" : "Forgot password?"}
            </button>}
          </div>}
          {!changingPassword && <button className="secondary-button" type="button" onClick={onBack}>← Change language</button>}
          <div className="login-security"><span>🔒</span><p>Account roles are read from the protected database profile, not selected in the browser.</p></div>
        </section>
      </main>
    );
  }

  return (
    <main className="selection-page">
      <section className="selection-card login-card">

        <div className="brand-icon">🔐</div>

        <h1>Welcome</h1>

        <p className="tagline">{roleName}</p>

        {/* ================= NAME ================= */}

        {step === "details" && (
          <>
            <label className="input-label">
              Your Name
            </label>

            <div className="name-input-container">
              <input
                type="text"
                value={name}
                placeholder="Enter your full name"
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                className={`voice-input-button ${
                  listening ? "listening" : ""
                }`}
                onClick={startVoiceInput}
                title="Speak your name"
              >
                {listening ? "🔴" : "🎙️"}
              </button>
            </div>

            <p className="voice-hint">
              🎙️ You can type your name or speak your name
            </p>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              onClick={continueToPhone}
            >
              Continue →
            </button>

            <button
              className="secondary-button"
              onClick={onBack}
            >
              ← Back
            </button>
          </>
        )}

        {/* ================= PHONE ================= */}

        {step === "phone" && (
          <>
            <div className="login-progress">
              <span className="completed">✓ Name</span>
              <span className="active">2. Mobile</span>
              <span>3. OTP</span>
            </div>

            <p className="welcome-user">
              Welcome, <strong>{name}</strong> 👋
            </p>

            <label className="input-label">
              Mobile Number
            </label>

            <div className="phone-input">
              <span>+91</span>

              <input
                type="tel"
                value={phone}
                maxLength="10"
                placeholder="Enter 10-digit mobile number"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhone(value);
                  setError("");
                }}
              />
            </div>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              onClick={sendOTP}
            >
              Send OTP →
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                setPhone("");
                setError("");
                setStep("details");
              }}
            >
              ← Change Name
            </button>
          </>
        )}

        {/* ================= OTP ================= */}

        {step === "otp" && (
          <>
            <div className="login-progress">
              <span className="completed">✓ Name</span>
              <span className="completed">✓ Mobile</span>
              <span className="active">3. OTP</span>
            </div>

            <p className="welcome-user">
              Welcome, <strong>{name}</strong> 👋
            </p>

            <p className="otp-message">
              OTP sent to <strong>+91 {phone}</strong>
            </p>

            <label className="input-label">
              Enter OTP
            </label>

            <input
              className="otp-input"
              type="tel"
              value={otp}
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setOtp(value);
                setError("");
              }}
            />

            <p className="demo-otp">
              Prototype OTP: <strong>123456</strong>
            </p>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              onClick={verifyOTP}
            >
              Verify OTP ✓
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                setOtp("");
                setError("");
                setStep("phone");
              }}
            >
              Change Number
            </button>
          </>
        )}

        <div className="login-security">
          <span>🔒</span>
          <p>
            Demo mode — data is stored locally in this browser. This is not secure account authentication.
          </p>
        </div>

      </section>
    </main>
  );
}

export default Login;
