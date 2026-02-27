class LoginForm extends HTMLElement {

  // ── Config ──────────────────────────────────────────────────────────────
  // static LOGIN_ENDPOINT           = "https://api.dev.primedclinic.com.au/api/login";
  // static SEND_CODE_ENDPOINT       = "https://api.dev.primedclinic.com.au/api/send-code";
  // static VALIDATE_CODE_ENDPOINT   = "https://api.dev.primedclinic.com.au/api/validate-code";
  // static FORGOT_PASSWORD_ENDPOINT = "https://api.dev.primedclinic.com.au/api/forgot-password";
  // static SANCTUM_CSRF_ENDPOINT    = "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie";
  static CSRF_TTL_SECONDS         = 7200; // 2 hours
  static CSRF_EXPIRY_COOKIE       = "wf_csrf_expires_at";
  // URL param that triggers the register form on load.
  // Matches ?view=register  OR  #register
  static REGISTER_PARAM_NAME      = "view";
  static REGISTER_PARAM_VALUE     = "register";

  static LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/login",
  };

  static SEND_CODE_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/send-code",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/send-code",
  };

  static VALIDATE_CODE_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/validate-code",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/validate-code",
  };

  static FORGOT_PASSWORD_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/forgot-password",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/forgot-password",
  };

  static SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };
  // Domain → post-login redirect map.
  // The first hostname that ends with the key is used.
  static LOGIN_REDIRECT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/patient",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/patient",
  };

  // ── Redirect helper ─────────────────────────────────────────────────────
  _getLoginRedirectUrl() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(LoginForm.LOGIN_REDIRECT_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return "/"; // fallback
  }
  // LOGIN route

static _resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(map)) {
      // exact match or subdomain match
      if (hostname === key || hostname.endsWith("." + key)) {
        return url;
      }
    }
    throw new Error(`No endpoint configured for host: ${hostname}`);
  }
  
  static get LOGIN_ENDPOINT() {
    return this._resolveEndpoint(this.LOGIN_ENDPOINT_MAP);
  }
  static get SEND_CODE_ENDPOINT() {
    return this._resolveEndpoint(this.SEND_CODE_ENDPOINT_MAP);
  }

  static get VALIDATE_CODE_ENDPOINT() {
    return this._resolveEndpoint(this.VALIDATE_CODE_ENDPOINT_MAP);
  }

  static get FORGOT_PASSWORD_ENDPOINT() {
    return this._resolveEndpoint(this.FORGOT_PASSWORD_ENDPOINT_MAP);
  }

  static get SANCTUM_CSRF_ENDPOINT() {
    return this._resolveEndpoint(this.SANCTUM_CSRF_ENDPOINT_MAP);
  }

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

        <!-- Login method toggle (hidden on reset panel) -->
        <div class="form_toggle-wrapper" data-login-toggle-wrapper="true">
          <button type="button" class="form_toggle-btn is-active" data-toggle="password">
            Login with Password
          </button>
          <button type="button" class="form_toggle-btn" data-toggle="code">
            Login with Code
          </button>
        </div>

        <!-- ── Password fields ── -->
        <div data-login-panel="password">

          <!-- Email -->
          <div class="form_field-wrapper">
            <div class="form_field-label">Email</div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Log-In-Form-7-Email"
              placeholder=""
              type="email"
              data-login-email="true"
            />
          </div>

          <!-- Password -->
          <div class="form_field-wrapper">
            <div class="field-label-wrapper">
              <div class="form_field-label">Password</div>
              <a href="#" class="text-style-link" data-reset-password-link="true">Reset your password</a>
            </div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Log-In-Form-7-Password"
              placeholder=""
              type="password"
              data-login-password="true"
            />
          </div>

        </div>

        <!-- ── Code fields ── -->
        <div data-login-panel="code" style="display:none">

          <!-- Step 1: identifier input -->
          <div data-code-step="identifier">
            <div class="form_field-wrapper">
              <div class="form_field-label">Email or Phone Number</div>
              <input
                class="form_input w-input"
                maxlength="256"
                name="Log-In-Code-Identifier"
                placeholder=""
                type="text"
                data-login-identifier="true"
              />
              <div class="form_field-error" data-login-identifier-error="true" style="display:none"></div>
            </div>
          </div>

          <!-- Step 2: OTP input (hidden until code is sent) -->
          <div data-code-step="otp" style="display:none">
            <div class="form_field-wrapper">
              <div class="field-label-wrapper">
                <div class="form_field-label">Enter your code</div>
                <a href="#" class="text-style-link" data-resend-code="true">Resend code</a>
              </div>
              <input
                class="form_input w-input"
                maxlength="6"
                name="Log-In-OTP"
                placeholder=""
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                data-login-otp="true"
              />
              <div class="form_field-error" data-login-otp-error="true" style="display:none"></div>
            </div>
          </div>

        </div>

        <!-- ── Reset password fields ── -->
        <div data-login-panel="reset" style="display:none">

          <div class="form_field-wrapper">
            <div class="field-label-wrapper">
              <div class="form_field-label">Email</div>
              <a href="#" class="text-style-link" data-back-to-login="true">Back to Login</a>
            </div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Reset-Email"
              placeholder=""
              type="email"
              data-reset-email="true"
            />
            <div class="form_field-error" data-reset-email-error="true" style="display:none"></div>
          </div>

        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            data-login-submit="true"
            value="Login"
          />

          <div class="button-group is-center" data-login-register-btn-wrapper="true">
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

    this._activePanel    = "password";
    this._codeStep       = "identifier"; // "identifier" | "otp"
    this._codeIdentifier = null;
    this._codeType       = null;
    this._bindEvents();

    // If the URL contains the register param or hash, swap to the register form immediately
    if (this._shouldShowRegister()) {
      const registerForm = document.createElement('register-form');
      this.replaceWith(registerForm);
    }
  }

  // ── Register redirect detection ──────────────────────────────────────────
  _shouldShowRegister() {
    // Check query param: e.g. ?view=register
    const params = new URLSearchParams(window.location.search);
    if (params.get(LoginForm.REGISTER_PARAM_NAME) === LoginForm.REGISTER_PARAM_VALUE) {
      return true;
    }
    // Check hash: e.g. #register
    if (window.location.hash === `#${LoginForm.REGISTER_PARAM_VALUE}`) {
      return true;
    }
    return false;
  }

  // ── Identifier detection ─────────────────────────────────────────────────
  _detectIdentifierType(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s\-().]{7,15}$/;
    if (emailRegex.test(value)) return "email";
    if (phoneRegex.test(value)) return "phone";
    return null;
  }

  // ── Panel / step switching ────────────────────────────────────────────────
  _switchPanel(panel) {
    this._activePanel = panel;

    const allPanels          = this.querySelectorAll('[data-login-panel]');
    const toggleWrapper      = this.querySelector('[data-login-toggle-wrapper]');
    const registerBtnWrapper = this.querySelector('[data-login-register-btn-wrapper]');

    allPanels.forEach(el => {
      el.style.display = el.dataset.loginPanel === panel ? "" : "none";
    });

    const isReset = panel === "reset";
    if (toggleWrapper)      toggleWrapper.style.display      = isReset ? "none" : "";
    if (registerBtnWrapper) registerBtnWrapper.style.display = isReset ? "none" : "";

    if (panel === "code") {
      this._switchCodeStep("identifier");
    }

    if (panel === "reset") {
      this.querySelector('[data-reset-email="true"]')?.focus();
    }

    this.querySelectorAll('.form_toggle-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.toggle === panel);
    });

    this._hideMessages();
    this._updateSubmitLabel();
  }

  _switchCodeStep(step) {
    this._codeStep = step;

    const identifierStep = this.querySelector('[data-code-step="identifier"]');
    const otpStep        = this.querySelector('[data-code-step="otp"]');

    identifierStep.style.display = step === "identifier" ? "" : "none";
    otpStep.style.display        = step === "otp"        ? "" : "none";

    if (step === "otp") {
      this.querySelector('[data-login-otp="true"]')?.focus();
    }

    this._updateSubmitLabel();
  }

  _updateSubmitLabel(loading = false) {
    const submitBtn = this.querySelector('[data-login-submit="true"]');
    if (!submitBtn) return;

    if (loading) {
      submitBtn.value = this._activePanel === "password" ? "Logging in..."
        : this._activePanel === "reset"   ? "Sending..."
        : this._codeStep === "identifier" ? "Sending..."
        : "Verifying...";
    } else {
      submitBtn.value = this._activePanel === "password" ? "Login"
        : this._activePanel === "reset"   ? "Send Reset Link"
        : this._codeStep === "identifier" ? "Send Code"
        : "Verify Code";
    }
  }

  _setSubmitState(submitBtn, loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    this._updateSubmitLabel(loading);
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  _setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
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

    const expiresAt = Math.floor(Date.now() / 1000) + LoginForm.CSRF_TTL_SECONDS;
    this._setCookie(LoginForm.CSRF_EXPIRY_COOKIE, String(expiresAt), LoginForm.CSRF_TTL_SECONDS);
  }

  _buildHeaders(xsrfToken) {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
    };
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  _showMessage(type, text) {
    const isSuccess   = type === "success";
    const wrapperAttr = isSuccess ? "[data-login-success-wrapper]" : "[data-login-error-wrapper]";
    const messageAttr = isSuccess ? "[data-login-success]"         : "[data-login-error]";
    const activeClass = isSuccess ? "w-form-done"                  : "w-form-fail";
    const otherAttr   = isSuccess ? "[data-login-error-wrapper]"   : "[data-login-success-wrapper]";
    const otherClass  = isSuccess ? "w-form-fail"                  : "w-form-done";

    const wrapper   = this.querySelector(wrapperAttr);
    const messageEl = this.querySelector(messageAttr);
    const otherWrap = this.querySelector(otherAttr);

    if (otherWrap) {
      otherWrap.classList.remove(otherClass);
      otherWrap.style.display = "none";
    }
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

  // ── Submit handlers ──────────────────────────────────────────────────────
  async _handlePasswordSubmit(form, submitBtn) {
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

      const res = await fetch(LoginForm.LOGIN_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: this._buildHeaders(xsrfToken),
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || "Login failed. Please check your details and try again.";
        this._showMessage("error", msg);
        return;
      }

      await this._setUserSessionCookie();
      this._showMessage("success", "Logged in successfully.");
      window.location.href = this._getLoginRedirectUrl();

    } catch (err) {
      this._showMessage("error", err.message || "Login failed due to a network error.");
      console.error("Login error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  async _handleSendCode(form, submitBtn) {
    const identifierInput = form.querySelector('[data-login-identifier="true"]');
    const identifierError = form.querySelector('[data-login-identifier-error="true"]');
    const raw             = (identifierInput?.value || "").trim();

    identifierError.style.display = "none";
    identifierError.textContent   = "";
    identifierInput.classList.remove("is-error");

    const type = this._detectIdentifierType(raw);

    if (!type) {
      identifierError.textContent   = "Please enter a valid email address or phone number.";
      identifierError.style.display = "block";
      identifierInput.classList.add("is-error");
      identifierInput.focus();
      return;
    }

    this._setSubmitState(submitBtn, true);

    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const payload = {
        email: type === "email" ? raw : "",
        phone: type === "phone" ? raw : ""
      };

      const res = await fetch(LoginForm.SEND_CODE_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: this._buildHeaders(xsrfToken),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to send code. Please try again.";
        this._showMessage("error", msg);
        return;
      }

      this._codeIdentifier = raw;
      this._codeType       = type;
      this._hideMessages();
      this._switchCodeStep("otp");

    } catch (err) {
      this._showMessage("error", err.message || "Failed to send code due to a network error.");
      console.error("Send code error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  async _handleValidateCode(form, submitBtn) {
    const otpInput = form.querySelector('[data-login-otp="true"]');
    const otpError = form.querySelector('[data-login-otp-error="true"]');
    const code     = (otpInput?.value || "").trim();

    otpError.style.display = "none";
    otpError.textContent   = "";
    otpInput.classList.remove("is-error");

    if (!code) {
      otpError.textContent   = "Please enter the code sent to you.";
      otpError.style.display = "block";
      otpInput.classList.add("is-error");
      otpInput.focus();
      return;
    }

    this._setSubmitState(submitBtn, true);

    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const payload = {
        email: this._codeType === "email" ? this._codeIdentifier : "",
        phone: this._codeType === "phone" ? this._codeIdentifier : "",
        code
      };

      const res = await fetch(LoginForm.VALIDATE_CODE_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: this._buildHeaders(xsrfToken),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || "Invalid code. Please try again.";
        otpError.textContent   = msg;
        otpError.style.display = "block";
        otpInput.classList.add("is-error");
        return;
      }

      await this._setUserSessionCookie();
      this._showMessage("success", "Logged in successfully.");
      window.location.href = this._getLoginRedirectUrl();

    } catch (err) {
      this._showMessage("error", err.message || "Verification failed due to a network error.");
      console.error("Validate code error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  async _handleForgotPassword(form, submitBtn) {
    const emailInput = form.querySelector('[data-reset-email="true"]');
    const emailError = form.querySelector('[data-reset-email-error="true"]');
    const email      = (emailInput?.value || "").trim();

    emailError.style.display = "none";
    emailError.textContent   = "";
    emailInput.classList.remove("is-error");

    if (!email) {
      emailError.textContent   = "Please enter your email address.";
      emailError.style.display = "block";
      emailInput.classList.add("is-error");
      emailInput.focus();
      return;
    }

    this._setSubmitState(submitBtn, true);

    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const res = await fetch(LoginForm.FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: this._buildHeaders(xsrfToken),
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to send reset link. Please try again.";
        this._showMessage("error", msg);
        return;
      }

      this._showMessage("success", "If an account exists for that email, a password reset link has been sent.");

    } catch (err) {
      this._showMessage("error", err.message || "Failed to send reset link due to a network error.");
      console.error("Forgot password error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  async _handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form      = e.currentTarget;
    const submitBtn = form.querySelector('[data-login-submit="true"]');

    this._hideMessages();

    if (this._activePanel === "password") {
      await this._handlePasswordSubmit(form, submitBtn);
    } else if (this._activePanel === "reset") {
      await this._handleForgotPassword(form, submitBtn);
    } else if (this._codeStep === "identifier") {
      await this._handleSendCode(form, submitBtn);
    } else {
      await this._handleValidateCode(form, submitBtn);
    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const form           = this.querySelector('[data-login-form="true"]');
    const registerBtn    = this.querySelector('#go-to-register');
    const toggleBtns     = this.querySelectorAll('.form_toggle-btn');
    const resendBtn      = this.querySelector('[data-resend-code="true"]');
    const resetLink      = this.querySelector('[data-reset-password-link="true"]');
    const backToLoginBtn = this.querySelector('[data-back-to-login="true"]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this._switchPanel(btn.dataset.toggle));
    });

    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      this._switchPanel("reset");
    });

    backToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this._switchPanel("password");
    });

    resendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (this._codeStep !== "otp" || !this._codeIdentifier) return;
      const submitBtn = form.querySelector('[data-login-submit="true"]');
      this._switchCodeStep("identifier");
      form.querySelector('[data-login-identifier="true"]').value = this._codeIdentifier;
      await this._handleSendCode(form, submitBtn);
    });

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
