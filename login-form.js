class LoginForm extends HTMLElement {

  // ── Config ──────────────────────────────────────────────────────────────
  static LOGIN_ENDPOINT         = "https://api.dev.primedclinic.com.au/api/login";
  static SANCTUM_CSRF_ENDPOINT  = "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie";
  static CSRF_TTL_SECONDS       = 7200; // 2 hours
  static CSRF_EXPIRY_COOKIE     = "wf_csrf_expires_at";

  // ── Lifecycle ────────────────────────────────────────────────────────────
  connectedCallback() {
    this.innerHTML = `
      <form
        name="wf-form-Log-in-Form-14"
        method="get"
        class="sign-up-login_header_form"
        aria-label="Log in Form 14"
        data-login-form="true"
      >
        <!-- Email -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Email</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Email"
            placeholder=""
            type="email"
            required
            data-login-email="true"
          />
        </div>

        <!-- Password -->
        <div class="form_field-wrapper">
          <div class="field-label-wrapper">
            <div class="form_field-label">Password</div>
            <a href="#" class="text-style-link">Reset your password</a>
          </div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Password"
            placeholder=""
            type="password"
            required
            data-login-password="true"
          />
        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            value="Login"
          />

          <div class="button-group is-center">
            <a href="#" class="button-glide-over w-inline-block" id="go-to-register">
              <span class="button-glide-over__container">
                <span class="button-glide-over__icon is-first">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
                <span class="button-glide-over__text">Register</span>
                <span class="button-glide-over__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
              </span>
              <div class="button-glide-over__background"></div>
            </a>
          </div>
        </div>

        <!-- Success message -->
        <div class="form_message-success-wrapper w-form-done" data-login-success-wrapper="true" style="display:none">
          <div class="form_message-success">
            <div data-login-success="true"></div>
          </div>
        </div>

        <!-- Error message -->
        <div class="form_message-error-wrapper w-form-fail" data-login-error-wrapper="true" style="display:none">
          <div class="form_message-error">
            <div data-login-error="true"></div>
          </div>
        </div>

      </form>
    `;

    this._bindEvents();
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  _setCookie(name, value, maxAgeSeconds, httpOnly = false) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // Generates a signed HS256 JWT using a per-session random key via Web Crypto
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
      false, // non-extractable — key exists in memory only for this session
      ["sign"]
    );

    const sigBuf    = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    const signature = b64url(sigBuf);
    return `${header}.${payload}.${signature}`;
  }

  async _setUserSessionCookie() {
    const token = await this._generateUserToken();
    // Session-length cookie (no Max-Age = expires when browser closes)
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  // ── CSRF ─────────────────────────────────────────────────────────────────
  _csrfIsValid() {
    const xsrfToken = this._getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(this._getCookie(LoginForm.CSRF_EXPIRY_COOKIE) || "", 10);
    if (!xsrfToken || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async _ensureCsrfCookie() {
    if (this._csrfIsValid()) return;

    await fetch(LoginForm.SANCTUM_CSRF_ENDPOINT, {
      method: "GET",
      credentials: "include"
    });

    // Record when this token expires so we can skip the round-trip next time
    const expiresAt = Math.floor(Date.now() / 1000) + LoginForm.CSRF_TTL_SECONDS;
    this._setCookie(LoginForm.CSRF_EXPIRY_COOKIE, String(expiresAt), LoginForm.CSRF_TTL_SECONDS);
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  _qs(selector) {
    const el = this.querySelector(selector);
    if (!el) throw new Error(`Missing element: ${selector}`);
    return el;
  }

  _showMessage(type, text) {
    const isSuccess    = type === "success";
    const wrapperAttr  = isSuccess ? "[data-login-success-wrapper]" : "[data-login-error-wrapper]";
    const messageAttr  = isSuccess ? "[data-login-success]"         : "[data-login-error]";
    const activeClass  = isSuccess ? "w-form-done"                  : "w-form-fail";
    const otherAttr    = isSuccess ? "[data-login-error-wrapper]"   : "[data-login-success-wrapper]";
    const otherClass   = isSuccess ? "w-form-fail"                  : "w-form-done";

    const wrapper    = this.querySelector(wrapperAttr);
    const messageEl  = this.querySelector(messageAttr);
    const otherWrap  = this.querySelector(otherAttr);

    // Hide the opposite wrapper
    if (otherWrap) {
      otherWrap.classList.remove(otherClass);
      otherWrap.style.display = "none";
    }

    // Show this wrapper
    if (wrapper) {
      wrapper.classList.add(activeClass);
      wrapper.style.display = "block";
    }

    if (messageEl) messageEl.textContent = text;
  }

  _hideMessages() {
    const successWrapper = this.querySelector("[data-login-success-wrapper]");
    const errorWrapper   = this.querySelector("[data-login-error-wrapper]");

    if (successWrapper) {
      successWrapper.classList.remove("w-form-done");
      successWrapper.style.display = "none";
    }
    if (errorWrapper) {
      errorWrapper.classList.remove("w-form-fail");
      errorWrapper.style.display = "none";
    }
  }

  _setSubmitState(submitBtn, loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (submitBtn.tagName === "INPUT") {
      submitBtn.value = loading ? "Logging in..." : "Login";
    } else {
      submitBtn.textContent = loading ? "Logging in..." : "Login";
    }
  }

  // ── Login handler ────────────────────────────────────────────────────────
  async _handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form      = e.currentTarget;
    const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

    this._hideMessages();

    const email    = (form.querySelector('[data-login-email="true"]')?.value || "").trim();
    const password = form.querySelector('[data-login-password="true"]')?.value || "";

    if (!email || !password) {
      this._showMessage("error", "Please enter your email and password.");
      return;
    }

    this._setSubmitState(submitBtn, true);

    try {
      await this._ensureCsrfCookie();

      const xsrfToken = this._getCookie("XSRF-TOKEN");
      console.log(`XSRF token: ${xsrfToken ?? "not set"}`);

      const res = await fetch(LoginForm.LOGIN_ENDPOINT, {
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

      if (!res.ok) {
        const msg = data?.message || data?.error || "Login failed. Please check your details and try again.";
        this._showMessage("error", msg);
        return;
      }

      // Set the client-side session indicator cookie
      await this._setUserSessionCookie();

      this._showMessage("success", "Logged in successfully.");
      window.location.href = "/";

    } catch (err) {
      this._showMessage("error", err.message || "Login failed due to a network error.");
      console.error("Login error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const form        = this.querySelector('[data-login-form="true"]');
    const registerBtn = this.querySelector('#go-to-register');

    // Avoid double-binding if the component is re-rendered
    if (form && form.dataset.loginBound !== "true") {
      form.dataset.loginBound = "true";
      form.addEventListener("submit", (e) => this._handleSubmit(e));
    }

    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const registerForm = document.createElement('register-form');
      this.replaceWith(registerForm);
    });
  }
}

customElements.define('login-form', LoginForm);