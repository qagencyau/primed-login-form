class RegisterForm extends HTMLElement {

  // ── Config ──────────────────────────────────────────────────────────────
  static REGISTER_ENDPOINT     = "https://api.dev.primedclinic.com.au/api/register/guest";
  static SANCTUM_CSRF_ENDPOINT = "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie";
  static CSRF_TTL_SECONDS      = 7200;
  static CSRF_EXPIRY_COOKIE    = "wf_csrf_expires_at";

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
            <div class="form_field-label">First Name</div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="First-Name"
              placeholder="First Name"
              type="text"
              id="register-first-name"
              required
            />
          </div>
          <div class="form_field-wrapper">
            <div class="field-label-wrapper">
              <div class="form_field-label">Last Name</div>
            </div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Last-Name"
              placeholder="Last Name"
              type="text"
              id="register-last-name"
              required
            />
          </div>
        </div>

        <!-- Email -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Email</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Register-Email"
            placeholder="Email"
            type="email"
            id="register-email"
            required
          />
        </div>

        <!-- Phone -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Phone</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Phone"
            placeholder="Phone Number"
            type="tel"
            id="register-phone"
            required
          />
        </div>

        <!-- Residential Address -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Residential Address</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Address"
            placeholder="Address"
            type="text"
            id="register-address"
            required
          />
        </div>

        <!-- Password + Confirm Password -->
        <div class="form_field-2col">
          <div class="form_field-wrapper">
            <div class="form_field-label">Password</div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Register-Password"
              placeholder="Password"
              type="password"
              id="register-password"
              required
            />
          </div>
          <div class="form_field-wrapper">
            <div class="field-label-wrapper">
              <div class="form_field-label">Confirm Password</div>
            </div>
            <input
              class="form_input w-input"
              maxlength="256"
              name="Register-Confirm-Password"
              placeholder="Confirm Password"
              type="password"
              id="register-confirm-password"
              required
            />
          </div>
        </div>
        <div class="form_field-error" id="password-error" style="display:none">Passwords do not match.</div>

        <!-- Referral Code -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Referral Code</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Referral-Code"
            placeholder="Referral Code"
            type="text"
            id="register-referral-code"
          />
        </div>

        <!-- Error message -->
        <div class="form_message-error-wrapper w-form-fail" data-register-error-wrapper="true" style="display:none">
          <div class="form_message-error">
            <div data-register-error="true"></div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            value="Create account & Continue"
            id="register-submit"
          />

          <div class="button-group is-center">
            <a href="#" class="button-glide-over w-inline-block" id="back-to-login">
              <span class="button-glide-over__container">
                <span class="button-glide-over__icon is-first">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                </span>
                <span class="button-glide-over__text">Back to Login</span>
                <span class="button-glide-over__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                </span>
              </span>
              <div class="button-glide-over__background"></div>
            </a>
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
    if (el)      el.textContent = message;
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

  static ONBOARDING_URL = "https://dev-frontend.primedclinic.com.au/client-onboarding";

  _showSuccess(userId) {
    const url = new URL(RegisterForm.ONBOARDING_URL);
    if (userId) url.searchParams.set("user_id", userId);
    window.location.href = url.toString();
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

    // Client-side password match check
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

      const payload = {
        first_name:   (this.querySelector("#register-first-name")?.value   || "").trim(),
        last_name:    (this.querySelector("#register-last-name")?.value    || "").trim(),
        email:        (this.querySelector("#register-email")?.value        || "").trim(),
        phone:        (this.querySelector("#register-phone")?.value        || "").trim(),
        address:      (this.querySelector("#register-address")?.value      || "").trim(),
        streetNumber: "",
        streetName:   "",
        suburb:       "",
        state:        "",
        postcode:     "",
        password:     password.value,
        referral_code: (this.querySelector("#register-referral-code")?.value || "").trim()
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

      // Success — redirect to onboarding with user_id as a URL parameter
      this._showSuccess(data.user_id);

    } catch (err) {
      this._showError(err.message || "Registration failed due to a network error.");
      console.error("Register error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const form     = this.querySelector('#register-form-el');
    const password = this.querySelector('#register-password');
    const confirm  = this.querySelector('#register-confirm-password');
    const pwError  = this.querySelector('#password-error');
    const backBtn  = this.querySelector('#back-to-login');

    // Clear password mismatch error as user re-types
    confirm.addEventListener('input', () => {
      if (pwError.style.display === 'block') {
        pwError.style.display = 'none';
        confirm.classList.remove('is-error');
        password.classList.remove('is-error');
      }
    });

    form.addEventListener('submit', (e) => this._handleSubmit(e));

    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Strip the register param/hash from the URL so the login form
      // doesn't immediately detect it and swap back to register.
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      if (url.hash === "#register") url.hash = "";
      history.replaceState(null, "", url.toString());
      const loginForm = document.createElement('login-form');
      this.replaceWith(loginForm);
    });
  }
}

customElements.define('register-form', RegisterForm);