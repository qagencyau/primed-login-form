// ── Config ───────────────────────────────────────────────────────────────────
// Mirrors the domain map in login-form.js — add entries here as new environments are added.
const AUTH_STATUS_MAP = {
  "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/auth-status",
  "www.primedclinic.com.au":              "https://app.primedclinic.com.au/auth-status",
};

function getAuthStatusEndpoint() {
  const hostname = window.location.hostname;
  for (const [key, url] of Object.entries(AUTH_STATUS_MAP)) {
    if (hostname === key || hostname.endsWith("." + key)) return url;
  }
  return null; // unknown environment — skip server check
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
function getCookie(name) {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(part.slice(0, idx));
    if (k !== name) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
}

function clearUserCookie() {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `__user=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

// ── JWT helpers (client-side only, no signature verification) ────────────────
function base64UrlToJson(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  return JSON.parse(atob(b64));
}

function parseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return {
      header:  base64UrlToJson(parts[0]),
      payload: base64UrlToJson(parts[1]),
    };
  } catch {
    return null;
  }
}

function isJwtExpired(payload, skewSeconds = 30) {
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}

// ── Auth state from __user cookie (fast, synchronous) ────────────────────────
function getLocalAuthState() {
  const token = getCookie("__user");
  if (!token) return { isLoggedIn: false, reason: "missing_cookie" };

  const parsed = parseJwt(token);
  if (!parsed)                  return { isLoggedIn: false, reason: "invalid_jwt_format" };
  if (isJwtExpired(parsed.payload)) return { isLoggedIn: false, reason: "jwt_expired" };

  return { isLoggedIn: true, reason: "ok", payload: parsed.payload };
}

// ── Apply visibility based on auth state ─────────────────────────────────────
function applyAuthVisibility(isLoggedIn) {
  const showSel = isLoggedIn ? '[data-auth="in"]'  : '[data-auth="out"]';
  const hideSel = isLoggedIn ? '[data-auth="out"]' : '[data-auth="in"]';

  document.querySelectorAll(showSel).forEach(el => {
    el.style.removeProperty("display");
    el.removeAttribute("hidden");
    el.setAttribute("aria-hidden", "false");
  });

  document.querySelectorAll(hideSel).forEach(el => {
    el.style.display = "none";
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
  });
}

// ── Server-side auth check ────────────────────────────────────────────────────
// Calls /auth-status to confirm the server session is still valid.
// If the server says the user is not authenticated, clears __user and
// updates the UI — catching cases where the session expired or was
// revoked server-side (e.g. logout from another tab or device).
async function checkServerAuthStatus() {
  const endpoint = getAuthStatusEndpoint();

  if (!endpoint) {
    console.log("auth.js: no auth-status endpoint configured for this domain — skipping server check.");
    return;
  }

  const xsrfToken = getCookie("XSRF-TOKEN");

  const headers = new Headers({
    "Accept":       "application/json",
    // removing content type to avoid cors
    // "Content-Type": "application/json",
    ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
  });

  try {
    const res = await fetch(endpoint, {
      method:      "GET",
      credentials: "include",
      headers
    });

    // Treat any non-2xx (especially 401) as "not authenticated"
    if (!res.ok) {
      clearUserCookie();
      applyAuthVisibility(false);
      console.log("auth.js: server session invalid — user logged out on frontend.");
      return;
    }

    const data = await res.json().catch(() => ({}));

    // Support both { authenticated: true } and { user: {...} } shapes
    const isAuthenticated = data?.authenticated === true || data?.user != null;

    if (!isAuthenticated) {
      clearUserCookie();
      applyAuthVisibility(false);
      console.log("auth.js: server reports not authenticated — user logged out on frontend.");
    } else {
      console.log("auth.js: server session confirmed.");
    }

  } catch (err) {
    // Network error — don't log the user out, leave local state as-is
    console.warn("auth.js: could not reach auth-status endpoint, keeping local state.", err);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  // 1. Fast sync check — apply immediately so there's no layout flash
  const local = getLocalAuthState();
  applyAuthVisibility(local.isLoggedIn);
  console.log("auth.js:", local.isLoggedIn ? "locally logged in" : `locally logged out (${local.reason})`);

  // 2. Async server check — corrects state if the server session has ended
  if (local.isLoggedIn) {
    // Only worth checking the server if we think we're logged in locally.
    // If we're already logged out locally there's nothing to correct.
    checkServerAuthStatus();
  }
})();
