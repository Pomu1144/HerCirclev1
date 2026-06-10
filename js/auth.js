/* ============================================================
   HER Circle - Authentication
   Client-side demo auth: salted SHA-256 via WebCrypto, session in
   localStorage, role-based access (visitor/user/coordinator/admin).
   Production swap: Auth.js or JWT + bcrypt server-side (see README).
   ============================================================ */

const HCAuth = (() => {
  const SESSION_KEY = "hc_session";
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function currentUser() {
    const s = session();
    if (!s) return null;
    if (Date.now() > s.expiresAt) { logout(); return null; }
    return HCDB.get("users").find(u => u.id === s.userId) || null;
  }

  function startSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: user.id,
      token: HCDB.uid() + HCDB.uid(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 8 // 8h session
    }));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* Simple client-side rate limiting per email */
  function attempts() {
    try { return JSON.parse(localStorage.getItem("hc_attempts")) || {}; } catch { return {}; }
  }
  function recordAttempt(email, success) {
    const a = attempts();
    if (success) { delete a[email]; }
    else {
      const rec = a[email] || { count: 0, first: Date.now() };
      if (Date.now() - rec.first > LOCKOUT_MS) { rec.count = 0; rec.first = Date.now(); }
      rec.count++;
      a[email] = rec;
    }
    localStorage.setItem("hc_attempts", JSON.stringify(a));
  }
  function isLocked(email) {
    const rec = attempts()[email];
    return rec && rec.count >= MAX_ATTEMPTS && (Date.now() - rec.first) < LOCKOUT_MS;
  }

  function validPassword(pw) {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
  }

  function passwordStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4); // 0-4
  }

  async function signUp({ firstName, lastName, email, phone, password }) {
    await HCDB.ready;
    email = email.trim().toLowerCase();
    if (!validPassword(password)) {
      return { ok: false, message: "Password must be 8+ characters with an uppercase letter, lowercase letter, and number." };
    }
    const users = HCDB.get("users");
    if (users.some(u => u.email === email)) {
      return { ok: false, message: "An account with this email already exists. Try logging in." };
    }
    const salt = HCDB.uid();
    const verifyToken = HCDB.uid();
    const user = HCDB.insert("users", {
      firstName: firstName.trim(), lastName: lastName.trim(), email,
      phone: (phone || "").trim(), role: "user",
      verified: false, verifyToken, salt,
      passwordHash: await HCDB.sha256(password + salt)
    });
    HCDB.queueEmail({
      to: email,
      subject: "Verify your HER Circle account",
      type: "account-verification",
      meta: { userId: user.id },
      message: `Welcome to HER Circle. Verify your account here: ${location.origin}${location.pathname}?verify=${verifyToken}`
    });
    return { ok: true, user, verifyToken };
  }

  function verifyEmail(token) {
    const user = HCDB.get("users").find(u => u.verifyToken === token);
    if (!user) return { ok: false, message: "Invalid or expired verification link." };
    HCDB.update("users", user.id, { verified: true, verifyToken: null });
    return { ok: true, user };
  }

  async function login(email, password) {
    await HCDB.ready;
    email = email.trim().toLowerCase();
    if (isLocked(email)) {
      return { ok: false, message: "Too many failed attempts. Please wait 5 minutes and try again." };
    }
    const user = HCDB.get("users").find(u => u.email === email);
    if (!user) { recordAttempt(email, false); return { ok: false, message: "Invalid email or password." }; }
    const hash = await HCDB.sha256(password + user.salt);
    if (hash !== user.passwordHash) {
      recordAttempt(email, false);
      return { ok: false, message: "Invalid email or password." };
    }
    recordAttempt(email, true);
    startSession(user);
    return { ok: true, user };
  }

  async function requestPasswordReset(email) {
    await HCDB.ready;
    email = email.trim().toLowerCase();
    const user = HCDB.get("users").find(u => u.email === email);
    // Always claim success to avoid account enumeration
    if (!user) return { ok: true, token: null };
    const token = HCDB.uid();
    HCDB.update("users", user.id, { resetToken: token, resetExpires: Date.now() + 30 * 60 * 1000 });
    HCDB.queueEmail({
      to: email,
      subject: "Reset your HER Circle password",
      type: "password-reset",
      meta: { userId: user.id },
      message: `Reset your HER Circle password here: ${location.origin}${location.pathname}?reset=${token}. This link expires in 30 minutes.`
    });
    return { ok: true, token };
  }

  async function resetPassword(token, newPassword) {
    const user = HCDB.get("users").find(u => u.resetToken === token);
    if (!user || Date.now() > (user.resetExpires || 0)) {
      return { ok: false, message: "This reset link is invalid or has expired." };
    }
    if (!validPassword(newPassword)) {
      return { ok: false, message: "Password must be 8+ characters with an uppercase letter, lowercase letter, and number." };
    }
    const salt = HCDB.uid();
    HCDB.update("users", user.id, {
      salt, passwordHash: await HCDB.sha256(newPassword + salt),
      resetToken: null, resetExpires: null
    });
    return { ok: true };
  }

  async function updateProfile(patch) {
    const user = currentUser();
    if (!user) return { ok: false, message: "Not logged in." };
    const allowed = {};
    ["firstName", "lastName", "phone"].forEach(k => { if (patch[k] !== undefined) allowed[k] = patch[k].trim(); });
    if (patch.newPassword) {
      if (!patch.currentPassword || await HCDB.sha256(patch.currentPassword + user.salt) !== user.passwordHash) {
        return { ok: false, message: "Current password is incorrect." };
      }
      if (!validPassword(patch.newPassword)) {
        return { ok: false, message: "New password must be 8+ characters with an uppercase letter, lowercase letter, and number." };
      }
      allowed.salt = HCDB.uid();
      allowed.passwordHash = await HCDB.sha256(patch.newPassword + allowed.salt);
    }
    HCDB.update("users", user.id, allowed);
    return { ok: true };
  }

  function requireRole(roles, redirect = "auth.html") {
    const user = currentUser();
    if (!user || !roles.includes(user.role)) {
      window.location.href = redirect + "?next=" + encodeURIComponent(location.pathname.split("/").pop() || "index.html");
      return null;
    }
    return user;
  }

  return {
    currentUser, logout, signUp, verifyEmail, login,
    requestPasswordReset, resetPassword, updateProfile,
    requireRole, passwordStrength, validPassword
  };
})();
