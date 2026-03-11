/* register-form.js (full version: host resolver + redirects via panel.url + referral_code from URL param) */

class RegisterForm extends HTMLElement {

  // ── Config ──────────────────────────────────────────────────────────────
  static CSRF_TTL_SECONDS   = 7200; // 2 hours
  static CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  static REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/register/guest",
  };

  static LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/login",
  };

  // Fallback only if API does not return panel.url after auto-login
  static ONBOARDING_URL_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/patient",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/patient",
  };

  static SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };

  // ── Host resolver (same pattern as LoginForm) ────────────────────────────
  static _resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    throw new Error(`No endpoint configured for host: ${hostname}`);
  }

  static get REGISTER_ENDPOINT() {
    return this._resolveEndpoint(this.REGISTER_ENDPOINT_MAP);
  }
  static get LOGIN_ENDPOINT() {
    return this._resolveEndpoint(this.LOGIN_ENDPOINT_MAP);
  }
  static get SANCTUM_CSRF_ENDPOINT() {
    return this._resolveEndpoint(this.SANCTUM_CSRF_ENDPOINT_MAP);
  }
  static get ONBOARDING_URL() {
    return this._resolveEndpoint(this.ONBOARDING_URL_MAP);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  connectedCallback() {
    this.innerHTML = `
<form
  name="wf-form-Register-Form"
  method="get"
  class="sign-up-login_header_form"
  aria-label="Register Form"
  id="register-form-el"
  novalidate
>
  <!-- First Name + Last Name -->
  <div class="form_field-2col">
    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="First-Name"
        placeholder="First Name" type="text" id="register-first-name" required />
    </div>

    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="Last-Name"
        placeholder="Last Name" type="text" id="register-last-name" required />
    </div>
  </div>

  <!-- Email -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Register-Email"
      placeholder="Email" type="email" id="register-email" required />
  </div>

  <!-- Phone -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Phone"
      placeholder="Phone Number" type="tel" id="register-phone" required />
  </div>

  <!-- Residential Address -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Address"
      placeholder="Address" type="text" id="register-address" required />
  </div>

  <div id="address-details-wrapper" style="display:none;">
    <!-- Street Number + Street Name -->
    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="streetNumber"
          placeholder="Street Number" type="text" id="streetNumber"
          autocomplete="address-line1" required aria-required="true">
      </div>

      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="streetName"
          placeholder="Street Name" type="text" id="streetName"
          required aria-required="true">
      </div>
    </div>

    <!-- Suburb + State + Postcode -->
    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="suburb"
          placeholder="Suburb" type="text" id="suburb"
          autocomplete="address-level2" required aria-required="true">
      </div>

      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="state"
          placeholder="State" type="text" id="state"
          autocomplete="address-level1" required aria-required="true">
      </div>

      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="postcode"
          placeholder="Postcode" type="text" id="postcode"
          autocomplete="postal-code" inputmode="numeric"
          required aria-required="true">
      </div>
    </div>
  </div>

  <!-- Password + Confirm Password -->
  <div class="form_field-2col">
    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="Register-Password"
        placeholder="Password" type="password" id="register-password" required />
    </div>

    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="Register-Confirm-Password"
        placeholder="Confirm Password" type="password" id="register-confirm-password" required />
    </div>
  </div>

  <div class="form_field-error" id="password-error" style="display:none">
    Passwords do not match.
  </div>

  <!-- Referral Code -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Referral-Code"
      placeholder="Referral Code" type="text" id="register-referral-code" />
  </div>

  <!-- Error message -->
  <div class="form_message-error-wrapper w-form-fail"
       data-register-error-wrapper="true"
       style="display:none">
    <div class="form_message-error">
      <div data-register-error="true"></div>
    </div>
  </div>

  <!-- Buttons -->
  <div class="w-layout-grid form-button-wrapper">
    <input type="submit" class="button is-full-width w-button"
      value="Create account & Continue" id="register-submit" />
  </div>

  <div class="button-group is-center">
    <a href="#" class="button-glide-over w-inline-block" id="back-to-login">
      <span class="button-glide-over__container">
        <span class="button-glide-over__text">Back to Login</span>
      </span>
      <div class="button-glide-over__background"></div>
    </a>
  </div>

  <!-- Turnstile (must be inside form) -->
  <input type="hidden"
    name="cf-turnstile-response"
    id="cf-chl-widget-a8hv1_response"
    value="...">

  <div class="sr-only" aria-live="polite" id="form-status"></div>

  <div class="form_message-success-wrapper w-form-done" tabindex="-1" role="region">
    <div class="form_message-success">
      <div class="success-text">
        Welcome back. You'll be redirected back to the home page.
      </div>
    </div>
  </div>

  <div class="form_message-error-wrapper w-form-fail" tabindex="-1" role="region">
    <div class="form_message-error">
      <div class="error-text">
        Login failed. Check your details and try again.
      </div>
    </div>
  </div>
</form>
    `;

    // Prefill referral code from URL (?referral_code=...)
    const ref = this._getReferralCodeFromUrl();
    const refInput = this.querySelector("#register-referral-code");
    if (refInput && ref) refInput.value = ref;

    this._bindEvents();
  }

  // ── Referral code (URL) ──────────────────────────────────────────────────
  _getReferralCodeFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get("referral_code") || "").trim();
    } catch {
      return "";
    }
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  _setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ─────────────────────────────────────────────────────────────────
  _csrfIsValid() {
    const xsrfToken = this._getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(this._getCookie(RegisterForm.CSRF_EXPIRY_COOKIE) || "", 10);
    if (!xsrfToken || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async _ensureCsrfCookie() {
    if (this._csrfIsValid()) return;

    await fetch(RegisterForm.SANCTUM_CSRF_ENDPOINT, {
      method: "GET",
      credentials: "include"
    });

    const expiresAt = Math.floor(Date.now() / 1000) + RegisterForm.CSRF_TTL_SECONDS;
    this._setCookie(RegisterForm.CSRF_EXPIRY_COOKIE, String(expiresAt), RegisterForm.CSRF_TTL_SECONDS);
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  _showError(message) {
    const wrapper = this.querySelector("[data-register-error-wrapper]");
    const el      = this.querySelector("[data-register-error]");
    if (el) el.textContent = message;
    if (wrapper) {
      wrapper.classList.add("w-form-fail");
      wrapper.style.display = "block";
    }
  }

  _hideError() {
    const wrapper = this.querySelector("[data-register-error-wrapper]");
    if (wrapper) {
      wrapper.classList.remove("w-form-fail");
      wrapper.style.display = "none";
    }
  }

  _setSubmitState(submitBtn, loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.value = loading ? "Please wait..." : "Create account & Continue";
  }

  _getOnboardingUrl() {
    return RegisterForm.ONBOARDING_URL;
  }

  // ── JWT / session cookie ─────────────────────────────────────────────────
  async _generateUserToken() {
    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

    const header  = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
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

  async _setUserSessionCookie() {
    const token  = await this._generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  _showSuccess(userId) {
    const url = new URL(this._getOnboardingUrl(), window.location.origin);
    if (userId) url.searchParams.set("user_id", userId);
    window.location.href = url.toString();
  }

  // Optional: allow only your domains for redirect
  _safeRedirectUrl(rawUrl) {
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
    } catch {
      return null;
    }
  }

  // ── Auto-login after registration ─────────────────────────────────────────
  async _autoLogin(email, password, userId) {
    let redirectUrl = null;

    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const res = await fetch(RegisterForm.LOGIN_ENDPOINT, {
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
        await this._setUserSessionCookie();
        redirectUrl = this._safeRedirectUrl(data?.panel?.url);
        console.log("register-form: auto-login successful.");
      } else {
        console.warn("register-form: auto-login failed, continuing without session.");
      }
    } catch (err) {
      console.warn("register-form: auto-login error, continuing without session.", err);
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    this._showSuccess(userId);
  }

  // ── Register handler ─────────────────────────────────────────────────────
  async _handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form      = e.currentTarget;
    const password  = this.querySelector("#register-password");
    const confirm   = this.querySelector("#register-confirm-password");
    const pwError   = this.querySelector("#password-error");
    const submitBtn = form.querySelector('input[type="submit"]');

    if (password.value !== confirm.value) {
      pwError.style.display = "block";
      confirm.classList.add("is-error");
      password.classList.add("is-error");
      confirm.focus();
      return;
    }

    this._hideError();
    this._setSubmitState(submitBtn, true);

    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const email = (this.querySelector("#register-email")?.value || "").trim();

      const payload = {
        first_name:    (this.querySelector("#register-first-name")?.value || "").trim(),
        last_name:     (this.querySelector("#register-last-name")?.value || "").trim(),
        email,
        phone:         (this.querySelector("#register-phone")?.value || "").trim(),
        address:       (this.querySelector("#register-address")?.value || "").trim(),
        streetNumber:  "",
        streetName:    "",
        suburb:        "",
        state:         "",
        postcode:      "",
        password:      password.value,
        referral_code: this._getReferralCodeFromUrl()
      };

      const res = await fetch(RegisterForm.REGISTER_ENDPOINT, {
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
        const msg = data?.message || data?.error || "Registration failed. Please check your details and try again.";
        this._showError(msg);
        return;
      }

      await this._autoLogin(email, password.value, data.user_id);

    } catch (err) {
      this._showError(err.message || "Registration failed due to a network error.");
      console.error("Register error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const form     = this.querySelector("#register-form-el");
    const password = this.querySelector("#register-password");
    const confirm  = this.querySelector("#register-confirm-password");
    const pwError  = this.querySelector("#password-error");
    const backBtn  = this.querySelector("#back-to-login");

    confirm.addEventListener("input", () => {
      if (pwError.style.display === "block") {
        pwError.style.display = "none";
        confirm.classList.remove("is-error");
        password.classList.remove("is-error");
      }
    });

    form.addEventListener("submit", (e) => this._handleSubmit(e));

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Keep referral_code in URL, only remove view=register and #register
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      if (url.hash === "#register") url.hash = "";
      history.replaceState(null, "", url.toString());

      const loginForm = document.createElement("login-form");
      this.replaceWith(loginForm);
    });
  }
}

customElements.define("register-form", RegisterForm);
