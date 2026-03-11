/* register-form-v-2.js — no DOM injection, works with existing Webflow HTML */

(function () {
  "use strict";

  // ── UUID fallback (Safari iOS < 15.4 does not support crypto.randomUUID) ──
  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (typeof crypto !== "undefined" && crypto.getRandomValues)
        ? (crypto.getRandomValues(new Uint8Array(1))[0] & 15)
        : Math.floor(Math.random() * 16);
      var v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ── Config ──────────────────────────────────────────────────────────────
  const CSRF_TTL_SECONDS = 7200;
  const CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  const REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/register/guest",
  };

  const LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/login",
  };

  const SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };

  // ── Endpoint resolver ──────────────────────────────────────────────────
  function resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return Object.values(map)[0];
  }

  // ── Cookie helpers ─────────────────────────────────────────────────────
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ────────────────────────────────────────────────────────────────
  function csrfIsValid() {
    const xsrfToken = getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(getCookie(CSRF_EXPIRY_COOKIE) || "", 10);
    if (!xsrfToken || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async function ensureCsrfCookie() {
    if (csrfIsValid()) return;
    await fetch(resolveEndpoint(SANCTUM_CSRF_ENDPOINT_MAP), {
      method: "GET",
      credentials: "include"
    });
    const expiresAt = Math.floor(Date.now() / 1000) + CSRF_TTL_SECONDS;
    setCookie(CSRF_EXPIRY_COOKIE, String(expiresAt), CSRF_TTL_SECONDS);
  }

  // ── JWT / session cookie ───────────────────────────────────────────────
  async function generateUserToken() {
    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
    const header = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: generateUUID(),
      session: true
    });

    const signingKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    return `${header}.${payload}.${b64url(sigBuf)}`;
  }

  async function setUserSessionCookie() {
    const token = await generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  // ── Safe redirect validator ────────────────────────────────────────────
  function safeRedirectUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
      const u = new URL(rawUrl, window.location.origin);
      const allowedHosts = new Set([
        "app.primedclinic.com.au",
        "primedclinic.com.au",
        "www.primedclinic.com.au",
        "dev-frontend.primedclinic.com.au",
        "api.dev.primedclinic.com.au",
      ]);
      if (!allowedHosts.has(u.hostname)) return null;
      return u.toString();
    } catch (_e) {
      return null;
    }
  }

  // ── Referral code from URL ─────────────────────────────────────────────
  function getReferralCodeFromUrl() {
    try {
      return (new URLSearchParams(window.location.search).get("referral_code") || "").trim();
    } catch (_e) {
      return "";
    }
  }

  // ── Controller ─────────────────────────────────────────────────────────
  class RegisterFormController {
    constructor(container) {
      this.container = container;
    }

    init() {
      // Pre-fill referral code from URL if present
      const refInput = this._getReferralInput();
      const refCode = getReferralCodeFromUrl();
      if (refInput && refCode && !refInput.value.trim()) {
        refInput.value = refCode;
      }

      // Hide error wrapper on load
      const errorWrapper = this.container.querySelector(".form_message-error-wrapper");
      if (errorWrapper) errorWrapper.style.display = "none";

      // Inject password error element after Confirm Password if not present
      if (!this.container.querySelector("#password-error")) {
        var _cpEl = this.container.querySelector("#Confirm-Password");
        const confirmWrapper = _cpEl ? _cpEl.closest(".form_field-wrapper") : null;
        if (confirmWrapper) {
          const pwError = document.createElement("div");
          pwError.id = "password-error";
          pwError.style.cssText = "display:none; color:#e53e3e; font-size:0.85rem; margin-top:0.25rem;";
          pwError.textContent = "Passwords do not match.";
          confirmWrapper.after(pwError);
        }
      }

      this._bindEvents();
      console.log("[RegisterForm] Initialised on #signup-form");
    }

    _getReferralInput() {
      return this.container.querySelector(
        "#Referral-Code, #register-referral-code, input[name='Referral-Code'], input[name='referral_code']"
      );
    }

    _getReferralCode() {
      const refInput = this._getReferralInput();
      const inputValue = ((refInput ? refInput.value : "") || "").trim();
      const urlValue = getReferralCodeFromUrl();

      // Prefer the user-entered / field value, fall back to URL value
      return inputValue || urlValue || "";
    }

    // ── Show/hide helpers ────────────────────────────────────────────────
    _showError(message) {
      const wrapper = this.container.querySelector(".form_message-error-wrapper");
      const el = this.container.querySelector(".error-text");
      if (el) el.textContent = message;
      if (wrapper) {
        wrapper.classList.add("w-form-fail");
        wrapper.style.display = "block";
      }
    }

    _hideError() {
      const wrapper = this.container.querySelector(".form_message-error-wrapper");
      if (wrapper) {
        wrapper.classList.remove("w-form-fail");
        wrapper.style.display = "none";
      }
    }

    _setSubmitState(loading) {
      const btn = this.container.querySelector("input[type='submit']");
      if (!btn) return;
      btn.disabled = loading;
      btn.value = loading ? "Please wait..." : "Create account & Continue";
    }

    // ── Show survey ──────────────────────────────────────────────────────
    _showSurvey(userId, dashboardUrl) {
      if (userId) sessionStorage.setItem("userId", String(userId));
      this.container.style.display = "none";
      const surveyDiv = document.querySelector("#primed-survey");
      if (surveyDiv) {
        if (dashboardUrl) surveyDiv.setAttribute("data-dashboard-url", dashboardUrl);
        surveyDiv.style.display = "block";
      } else {
        console.warn("[RegisterForm] #primed-survey not found");
      }
    }

    // ── Auto-login after registration ────────────────────────────────────
    async _autoLogin(email, password, userId) {
      let dashboardUrl = null;
      try {
        await ensureCsrfCookie();
        const xsrfToken = getCookie("XSRF-TOKEN");

        const res = await fetch(resolveEndpoint(LOGIN_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          await setUserSessionCookie();
          dashboardUrl = safeRedirectUrl(data && data.panel && data.panel.url);
        } else {
          console.warn("[RegisterForm] Auto-login failed, continuing without session");
        }
      } catch (err) {
        console.warn("[RegisterForm] Auto-login error, continuing without session", err);
      }

      this._showSurvey(userId, dashboardUrl);
    }

    // ── Submit handler ───────────────────────────────────────────────────
    async _handleSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      const c = this.container;
      const password = c.querySelector("#Password");
      const confirm = c.querySelector("#Confirm-Password");
      const pwError = c.querySelector("#password-error");

      if (!password || !confirm) {
        this._showError("Form is missing required fields. Please refresh the page.");
        return;
      }

      // Reset password error state
      if (pwError) pwError.style.display = "none";
      password.classList.remove("is-error");
      confirm.classList.remove("is-error");

      // Validate password match
      if (password.value !== confirm.value) {
        if (pwError) pwError.style.display = "block";
        password.classList.add("is-error");
        confirm.classList.add("is-error");
        confirm.focus();
        return;
      }

      this._hideError();
      this._setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrfToken = getCookie("XSRF-TOKEN");
        const email = ((function () {
          var _el = c.querySelector("#Email");
          return _el ? _el.value : "";
        }()) || "").trim();

        const referralCode = this._getReferralCode();

        const payload = {
          first_name: ((function () {
            var _el = c.querySelector("#First-Name");
            return _el ? _el.value : "";
          }()) || "").trim(),

          last_name: ((function () {
            var _el = c.querySelector("#Last-Name");
            return _el ? _el.value : "";
          }()) || "").trim(),

          email,

          phone: ((function () {
            var _el = c.querySelector("#Phone");
            return _el ? _el.value : "";
          }()) || "").trim(),

          address: ((function () {
            var _el = c.querySelector("#Address");
            return _el ? _el.value : "";
          }()) || "").trim(),

          streetNumber: ((function () {
            var _el = c.querySelector("#streetNumber");
            return _el ? _el.value : "";
          }()) || "").trim(),

          streetName: ((function () {
            var _el = c.querySelector("#streetName");
            return _el ? _el.value : "";
          }()) || "").trim(),

          suburb: ((function () {
            var _el = c.querySelector("#suburb");
            return _el ? _el.value : "";
          }()) || "").trim(),

          state: ((function () {
            var _el = c.querySelector("#state");
            return _el ? _el.value : "";
          }()) || "").trim(),

          postcode: ((function () {
            var _el = c.querySelector("#postcode");
            return _el ? _el.value : "";
          }()) || "").trim(),

          password: password.value
        };

        // Only include referral_code when it actually has a value
        if (referralCode) {
          payload.referral_code = referralCode;
        }

        const res = await fetch(resolveEndpoint(REGISTER_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this._showError(
            (data && data.message) ||
            (data && data.error) ||
            "Registration failed. Please check your details and try again."
          );
          return;
        }

        await this._autoLogin(email, password.value, data.user_id);

      } catch (err) {
        this._showError((err && err.message) || "Registration failed due to a network error.");
        console.error("[RegisterForm] Register error:", err);
      } finally {
        this._setSubmitState(false);
      }
    }

    // ── Back to login ────────────────────────────────────────────────────
    _handleBackToLogin() {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      if (url.hash === "#register") url.hash = "";
      history.replaceState(null, "", url.toString());

      const loginContainer = document.querySelector("#login-form");
      if (loginContainer) {
        this.container.style.display = "none";
        loginContainer.style.display = "block";
        var _lf = loginContainer.querySelector("#log-in_input-form");
        if (_lf) _lf.focus();
      } else {
        console.error("[RegisterForm] #login-form not found");
      }
    }

    // ── Event binding ────────────────────────────────────────────────────
    _bindEvents() {
      const form = this.container.querySelector("form.signup_input-form");
      const password = this.container.querySelector("#Password");
      const confirm = this.container.querySelector("#Confirm-Password");
      const pwError = this.container.querySelector("#password-error");

      if (!form) {
        console.error("[RegisterForm] form.signup_input-form not found");
        return;
      }

      // Prevent Webflow's default form submission
      if (form.dataset.registerBound !== "true") {
        form.dataset.registerBound = "true";
        form.addEventListener("submit", (e) => this._handleSubmit(e));
      }

      // Clear password mismatch error on re-type
      if (confirm) {
        confirm.addEventListener("input", function () {
          if (pwError && pwError.style.display === "block") {
            pwError.style.display = "none";
            confirm.classList.remove("is-error");
            if (password) password.classList.remove("is-error");
          }
        });
      }

      // Back to login — any link inside signup-form pointing to login
      this.container.querySelectorAll(
        'a[href*="sign-up-login"]:not([href*="register"]), a[href="/sign-up-login"]'
      ).forEach((el) =>
        el.addEventListener("click", (e) => {
          e.preventDefault();
          this._handleBackToLogin();
        })
      );
    }
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  function init() {
    const container = document.querySelector("#signup-form");
    if (!container) {
      console.warn("[RegisterForm] #signup-form not found in DOM.");
      return;
    }
    const ctrl = new RegisterFormController(container);
    ctrl.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
