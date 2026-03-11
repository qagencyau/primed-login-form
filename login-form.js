/* login-form.js — persistent login/register UI state via localStorage */
/* Works with existing Webflow HTML */

(function () {
  "use strict";

  // ── UUID fallback ────────────────────────────────────────────────────────
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
  const CSRF_TTL_SECONDS   = 7200;
  const CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  const REGISTER_PARAM_NAME  = "view";
  const REGISTER_PARAM_VALUE = "register";
  const LOGIN_PARAM_VALUE    = "login";

  const UI_STATE_KEY = "primed_auth_ui_state_v2";

  const LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/login",
  };
  const SEND_CODE_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/send-code",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/send-code",
  };
  const VALIDATE_CODE_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/validate-code",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/validate-code",
  };
  const FORGOT_PASSWORD_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/forgot-password",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/forgot-password",
  };
  const SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };
  const LOGIN_REDIRECT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/patient",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/patient",
  };

  // ── Endpoint resolver ───────────────────────────────────────────────────
  function resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return Object.values(map)[0];
  }

  // ── Redirect helpers ────────────────────────────────────────────────────
  function getLoginRedirectUrl() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(LOGIN_REDIRECT_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return "/";
  }

  function safeRedirectUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
      const u = new URL(rawUrl, window.location.origin);
      const allowed = new Set([
        "app.primedclinic.com.au",
        "primedclinic.com.au",
        "www.primedclinic.com.au",
        "dev-frontend.primedclinic.com.au",
        "api.dev.primedclinic.com.au",
      ]);
      return allowed.has(u.hostname) ? u.toString() : null;
    } catch (_e) {
      return null;
    }
  }

  // ── Cookie helpers ──────────────────────────────────────────────────────
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── Persistent UI state ─────────────────────────────────────────────────
  function getDefaultUiState() {
    return {
      view: "register",          // register | login
      activePanel: "password",   // password | code | reset
      codeStep: "identifier",    // identifier | otp
      codeIdentifier: "",
      codeType: ""               // email | phone | ""
    };
  }

  function loadUiState() {
    try {
      const raw = localStorage.getItem(UI_STATE_KEY);
      if (!raw) return getDefaultUiState();
      const parsed = JSON.parse(raw);
      return {
        view: parsed && parsed.view === "login" ? "login" : "register",
        activePanel:
          parsed && ["password", "code", "reset"].includes(parsed.activePanel)
            ? parsed.activePanel
            : "password",
        codeStep:
          parsed && ["identifier", "otp"].includes(parsed.codeStep)
            ? parsed.codeStep
            : "identifier",
        codeIdentifier: parsed && typeof parsed.codeIdentifier === "string" ? parsed.codeIdentifier : "",
        codeType:
          parsed && ["email", "phone"].includes(parsed.codeType)
            ? parsed.codeType
            : ""
      };
    } catch (_e) {
      return getDefaultUiState();
    }
  }

  function saveUiState(state) {
    try {
      localStorage.setItem(UI_STATE_KEY, JSON.stringify({
        view: state.view === "login" ? "login" : "register",
        activePanel: ["password", "code", "reset"].includes(state.activePanel) ? state.activePanel : "password",
        codeStep: ["identifier", "otp"].includes(state.codeStep) ? state.codeStep : "identifier",
        codeIdentifier: typeof state.codeIdentifier === "string" ? state.codeIdentifier : "",
        codeType: ["email", "phone"].includes(state.codeType) ? state.codeType : ""
      }));
    } catch (_e) {}
  }

  function clearUiState() {
    try {
      localStorage.removeItem(UI_STATE_KEY);
    } catch (_e) {}
  }

  // ── JWT / session cookie ────────────────────────────────────────────────
  async function generateUserToken() {
    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
    const header  = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({ iat: Math.floor(Date.now() / 1000), jti: generateUUID(), session: true });
    const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
    return `${header}.${payload}.${b64url(sig)}`;
  }

  async function setUserSessionCookie() {
    const token  = await generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  // ── CSRF ────────────────────────────────────────────────────────────────
  function csrfIsValid() {
    const token     = getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(getCookie(CSRF_EXPIRY_COOKIE) || "", 10);
    if (!token || !Number.isFinite(expiresAt)) return false;
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

  function buildHeaders(xsrfToken) {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
    };
  }

  // ── Identifier detection ────────────────────────────────────────────────
  function detectIdentifierType(value) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    if (/^\+?[\d\s\-().]{7,15}$/.test(value)) return "phone";
    return null;
  }

  // ── DOM injection ───────────────────────────────────────────────────────
  function injectPanels(form, emailInput, passInput, submitBtn) {
    passInput.type = "password";

    if (!document.getElementById("lf-panel-style")) {
      const style = document.createElement("style");
      style.id = "lf-panel-style";
      style.textContent = "[data-login-panel] { display: none !important; } [data-login-panel].lf-active { display: block !important; }";
      document.head.appendChild(style);
    }

    const passwordPanel = document.createElement("div");
    passwordPanel.setAttribute("data-login-panel", "password");
    passwordPanel.style.display = "none";

    const emailWrapper = emailInput.closest(".form_field-wrapper");
    const passWrapper  = passInput.closest(".form_field-wrapper");

    emailWrapper.parentNode.insertBefore(passwordPanel, emailWrapper);
    passwordPanel.appendChild(emailWrapper);
    passwordPanel.appendChild(passWrapper);

    const toggleWrapper = document.createElement("div");
    toggleWrapper.setAttribute("data-login-toggle-wrapper", "");
    toggleWrapper.innerHTML = `
      <div class="form_toggle-wrapper" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
        <button type="button" class="form_toggle-btn is-active" data-toggle="password">Password</button>
        <button type="button" class="form_toggle-btn" data-toggle="code">Code</button>
      </div>`;
    passwordPanel.parentNode.insertBefore(toggleWrapper, passwordPanel);

    const codePanel = document.createElement("div");
    codePanel.setAttribute("data-login-panel", "code");
    codePanel.style.display = "none";
    codePanel.innerHTML = `
      <div data-code-step="identifier">
        <div class="form_field-wrapper">
          <div class="form_field-label">Email or Phone Number</div>
          <input class="form_input w-input" maxlength="256" name="login-identifier"
            placeholder="Email or phone number" type="text" data-login-identifier="true"/>
          <div data-login-identifier-error="true"
            style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
        </div>
      </div>
      <div data-code-step="otp" style="display:none;">
        <div class="form_field-wrapper">
          <div class="form_field-label">Enter the code sent to you</div>
          <input class="form_input w-input" maxlength="10" name="login-otp"
            placeholder="6-digit code" type="text" inputmode="numeric"
            autocomplete="one-time-code" data-login-otp="true"/>
          <div data-login-otp-error="true"
            style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
        </div>
        <div style="margin-bottom:0.5rem;">
          <a href="#" class="text-style-link text-size-small" data-resend-code="true">Resend code</a>
        </div>
      </div>`;
    passwordPanel.after(codePanel);

    const resetPanel = document.createElement("div");
    resetPanel.setAttribute("data-login-panel", "reset");
    resetPanel.style.display = "none";
    resetPanel.innerHTML = `
      <div class="margin-bottom margin-small">
        <p class="text-size-small" style="margin-bottom:0.75rem;">
          Enter your email and we'll send you a reset link.
        </p>
      </div>
      <div class="form_field-wrapper">
        <div class="form_field-label">Email</div>
        <input class="form_input w-input" maxlength="256" name="reset-email"
          placeholder="" type="email" data-reset-email="true"/>
        <div data-reset-email-error="true"
          style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
      </div>
      <div style="margin-bottom:0.75rem;">
        <a href="#" class="text-style-link text-size-small" data-back-to-login="true">← Back to login</a>
      </div>`;
    codePanel.after(resetPanel);

    const registerBtnWrapper = document.createElement("div");
    registerBtnWrapper.setAttribute("data-login-register-btn-wrapper", "");

    const submitGrid   = submitBtn.closest(".w-layout-grid") || submitBtn.parentNode;
    const wfParagraph  = Array.from(form.querySelectorAll("p.text-size-small")).find(el => !el.closest("[data-login-panel]"));
    const marginBottom = wfParagraph && wfParagraph.closest(".margin-bottom");
    const buttonGroup  = Array.from(form.querySelectorAll(".button-group")).find(el => !el.closest("[data-login-panel]"));

    submitGrid.after(registerBtnWrapper);
    if (marginBottom) registerBtnWrapper.appendChild(marginBottom);
    if (buttonGroup)  registerBtnWrapper.appendChild(buttonGroup);
  }

  // ── Main init ───────────────────────────────────────────────────────────
  function init() {
    const loginDiv    = document.getElementById("login-form");
    const registerDiv = document.getElementById("signup-form");

    if (!loginDiv) {
      console.warn("[LoginForm] #login-form not found.");
      return;
    }

    const form       = loginDiv.querySelector("form.login_input-form");
    const emailInput = loginDiv.querySelector("input#login-form_email");
    const passInput  = loginDiv.querySelector("input#login-form_password");
    const submitBtn  = loginDiv.querySelector("input[type='submit']");
    const resetLink  = loginDiv.querySelector(".field-label-wrapper .text-style-link");

    if (!form || !emailInput || !passInput || !submitBtn) {
      console.warn("[LoginForm] Required form elements not found.");
      return;
    }

    injectPanels(form, emailInput, passInput, submitBtn);

    let uiState = loadUiState();

    let activePanel    = uiState.activePanel || "password";
    let codeStep       = uiState.codeStep || "identifier";
    let codeIdentifier = uiState.codeIdentifier || "";
    let codeType       = uiState.codeType || "";

    const successWrapper = loginDiv.querySelector(".form_message-success-wrapper");
    const errorWrapper   = loginDiv.querySelector(".form_message-error-wrapper");
    const successText    = loginDiv.querySelector(".success-text");
    const errorText      = loginDiv.querySelector(".error-text");

    if (successWrapper) {
      successWrapper.style.display = "none";
      successWrapper.classList.remove("w-form-done");
    }
    if (errorWrapper) {
      errorWrapper.style.display = "none";
      errorWrapper.classList.remove("w-form-fail");
    }

    function syncUiState() {
      uiState = {
        view: loginDiv.style.display === "none" ? "register" : "login",
        activePanel: activePanel,
        codeStep: codeStep,
        codeIdentifier: codeIdentifier,
        codeType: codeType
      };
      saveUiState(uiState);
    }

    // ── UI helpers ────────────────────────────────────────────────────────
    function showMessage(type, text) {
      if (type === "success") {
        if (errorWrapper) {
          errorWrapper.style.display = "none";
          errorWrapper.classList.remove("w-form-fail");
        }
        if (successWrapper) {
          successWrapper.style.display = "block";
          successWrapper.classList.add("w-form-done");
        }
        if (successText) successText.textContent = text;
      } else {
        if (successWrapper) {
          successWrapper.style.display = "none";
          successWrapper.classList.remove("w-form-done");
        }
        if (errorWrapper) {
          errorWrapper.style.display = "block";
          errorWrapper.classList.add("w-form-fail");
        }
        if (errorText) errorText.textContent = text;
      }
    }

    function hideMessages() {
      if (successWrapper) {
        successWrapper.style.display = "none";
        successWrapper.classList.remove("w-form-done");
      }
      if (errorWrapper) {
        errorWrapper.style.display = "none";
        errorWrapper.classList.remove("w-form-fail");
      }
    }

    function updateSubmitLabel(loading) {
      if (!submitBtn) return;

      if (loading) {
        submitBtn.value =
          activePanel === "password" ? "Logging in..."
          : activePanel === "reset" ? "Sending..."
          : codeStep === "identifier" ? "Sending..."
          : "Verifying...";
      } else {
        submitBtn.value =
          activePanel === "password" ? "Login"
          : activePanel === "reset" ? "Send Reset Link"
          : codeStep === "identifier" ? "Send Code"
          : "Verify Code";
      }
    }

    function setSubmitState(loading) {
      submitBtn.disabled = loading;
      updateSubmitLabel(loading);
    }

    // ── Panel switching ───────────────────────────────────────────────────
    function switchCodeStep(step, skipSave) {
      codeStep = step;

      const identifierStep = form.querySelector('[data-code-step="identifier"]');
      const otpStep        = form.querySelector('[data-code-step="otp"]');

      if (identifierStep) identifierStep.style.display = step === "identifier" ? "" : "none";
      if (otpStep) otpStep.style.display = step === "otp" ? "" : "none";

      if (step === "otp") {
        var _oi = form.querySelector("[data-login-otp]");
        if (_oi) _oi.focus();
      }

      updateSubmitLabel(false);
      if (!skipSave) syncUiState();
    }

    function switchPanel(panel, skipSave) {
      activePanel = panel;

      loginDiv.querySelectorAll("[data-login-panel]").forEach(el => {
        const isActive = el.dataset.loginPanel === panel;
        el.classList.toggle("lf-active", isActive);

        el.querySelectorAll("input, select, textarea").forEach(input => {
          if (isActive) {
            if (input.dataset.wasRequired === "true") input.required = true;
          } else {
            if (input.required) input.dataset.wasRequired = "true";
            input.required = false;
          }
        });
      });

      const toggleWrapper      = loginDiv.querySelector("[data-login-toggle-wrapper]");
      const registerBtnWrapper = loginDiv.querySelector("[data-login-register-btn-wrapper]");
      const isReset            = panel === "reset";

      if (toggleWrapper) toggleWrapper.style.display = isReset ? "none" : "";
      if (registerBtnWrapper) registerBtnWrapper.style.display = isReset ? "none" : "";

      if (panel === "code") {
        switchCodeStep(codeStep || "identifier", true);
      }

      if (panel === "reset") {
        var _re = form.querySelector("[data-reset-email]");
        if (_re) _re.focus();
      }

      loginDiv.querySelectorAll(".form_toggle-btn").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.toggle === panel);
      });

      hideMessages();
      updateSubmitLabel(false);
      if (!skipSave) syncUiState();
    }

    // ── Login / Register swap ─────────────────────────────────────────────
    function showRegister(updateUrl) {
      loginDiv.style.display = "none";
      if (registerDiv) registerDiv.style.display = "block";

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set(REGISTER_PARAM_NAME, REGISTER_PARAM_VALUE);
        history.replaceState(null, "", url.toString());
      }

      syncUiState();
    }

    function showLogin(updateUrl) {
      loginDiv.style.display = "block";
      if (registerDiv) registerDiv.style.display = "none";

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set(REGISTER_PARAM_NAME, LOGIN_PARAM_VALUE);
        if (url.hash === `#${REGISTER_PARAM_VALUE}`) url.hash = "";
        history.replaceState(null, "", url.toString());
      }

      syncUiState();
      emailInput.focus();
    }

    function getUrlIntent() {
      const params = new URLSearchParams(window.location.search);
      if (params.get(REGISTER_PARAM_NAME) === LOGIN_PARAM_VALUE) return "login";
      if (params.get(REGISTER_PARAM_NAME) === REGISTER_PARAM_VALUE) return "register";
      if (window.location.hash === `#${REGISTER_PARAM_VALUE}`) return "register";
      return null;
    }

    // ── Submit handlers ───────────────────────────────────────────────────
    async function handlePasswordSubmit() {
      const email    = (emailInput.value || "").trim();
      const password = passInput.value || "";

      if (!email || !password) {
        showMessage("error", "Please enter your email and password.");
        return;
      }

      setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrf = getCookie("XSRF-TOKEN");
        const res  = await fetch(resolveEndpoint(LOGIN_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(xsrf),
          body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showMessage("error", data && data.message || data && data.error || "Login failed. Please check your details and try again.");
          return;
        }

        await setUserSessionCookie();
        clearUiState();
        showMessage("success", "Logged in successfully.");
        window.location.href = safeRedirectUrl(data && data.panel && data.panel.url) || getLoginRedirectUrl();
      } catch (err) {
        showMessage("error", err.message || "Login failed due to a network error.");
        console.error("Login error:", err);
      } finally {
        setSubmitState(false);
      }
    }

    async function handleSendCode() {
      const identifierInput = form.querySelector("[data-login-identifier]");
      const identifierError = form.querySelector("[data-login-identifier-error]");
      const raw = (identifierInput ? identifierInput.value : "").trim();

      if (identifierError) {
        identifierError.style.display = "none";
        identifierError.textContent = "";
      }
      if (identifierInput) identifierInput.classList.remove("is-error");

      const type = detectIdentifierType(raw);
      if (!type) {
        if (identifierError) {
          identifierError.textContent = "Please enter a valid email address or phone number.";
          identifierError.style.display = "block";
        }
        if (identifierInput) identifierInput.classList.add("is-error");
        if (identifierInput) identifierInput.focus();
        return;
      }

      setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrf = getCookie("XSRF-TOKEN");
        const res  = await fetch(resolveEndpoint(SEND_CODE_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(xsrf),
          body: JSON.stringify({
            email: type === "email" ? raw : "",
            phone: type === "phone" ? raw : ""
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showMessage("error", data && data.message || data && data.error || "Failed to send code. Please try again.");
          return;
        }

        codeIdentifier = raw;
        codeType       = type;
        hideMessages();
        syncUiState();
        switchCodeStep("otp");
      } catch (err) {
        showMessage("error", err.message || "Failed to send code due to a network error.");
        console.error("Send code error:", err);
      } finally {
        setSubmitState(false);
      }
    }

    async function handleValidateCode() {
      const otpInput = form.querySelector("[data-login-otp]");
      const otpError = form.querySelector("[data-login-otp-error]");
      const code     = (otpInput ? otpInput.value : "").trim();

      if (otpError) {
        otpError.style.display = "none";
        otpError.textContent = "";
      }
      if (otpInput) otpInput.classList.remove("is-error");

      if (!code) {
        if (otpError) {
          otpError.textContent = "Please enter the code sent to you.";
          otpError.style.display = "block";
        }
        if (otpInput) otpInput.classList.add("is-error");
        if (otpInput) otpInput.focus();
        return;
      }

      setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrf = getCookie("XSRF-TOKEN");
        const res  = await fetch(resolveEndpoint(VALIDATE_CODE_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(xsrf),
          body: JSON.stringify({
            email: codeType === "email" ? codeIdentifier : "",
            phone: codeType === "phone" ? codeIdentifier : "",
            code
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (otpError) {
            otpError.textContent = data && data.message || data && data.error || "Invalid code. Please try again.";
            otpError.style.display = "block";
          }
          if (otpInput) otpInput.classList.add("is-error");
          return;
        }

        await setUserSessionCookie();
        clearUiState();
        showMessage("success", "Logged in successfully.");
        window.location.href = safeRedirectUrl(data && data.panel && data.panel.url) || getLoginRedirectUrl();
      } catch (err) {
        showMessage("error", err.message || "Verification failed due to a network error.");
        console.error("Validate code error:", err);
      } finally {
        setSubmitState(false);
      }
    }

    async function handleForgotPassword() {
      const emailEl  = form.querySelector("[data-reset-email]");
      const emailErr = form.querySelector("[data-reset-email-error]");
      const email    = (emailEl ? emailEl.value : "").trim();

      if (emailErr) {
        emailErr.style.display = "none";
        emailErr.textContent = "";
      }
      if (emailEl) emailEl.classList.remove("is-error");

      if (!email) {
        if (emailErr) {
          emailErr.textContent = "Please enter your email address.";
          emailErr.style.display = "block";
        }
        if (emailEl) emailEl.classList.add("is-error");
        if (emailEl) emailEl.focus();
        return;
      }

      setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrf = getCookie("XSRF-TOKEN");
        const res  = await fetch(resolveEndpoint(FORGOT_PASSWORD_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(xsrf),
          body: JSON.stringify({ email })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showMessage("error", data && data.message || data && data.error || "Failed to send reset link. Please try again.");
          return;
        }

        showMessage("success", "If an account exists for that email, a password reset link has been sent.");
      } catch (err) {
        showMessage("error", err.message || "Failed to send reset link due to a network error.");
        console.error("Forgot password error:", err);
      } finally {
        setSubmitState(false);
      }
    }

    // ── Events ────────────────────────────────────────────────────────────
    form.setAttribute("novalidate", "novalidate");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      hideMessages();

      try {
        if (activePanel === "password") {
          await handlePasswordSubmit();
        } else if (activePanel === "reset") {
          await handleForgotPassword();
        } else if (codeStep === "identifier") {
          await handleSendCode();
        } else {
          await handleValidateCode();
        }
      } catch (err) {
        console.error(err);
        showMessage("error", "Something went wrong. Please try again.");
        setSubmitState(false);
      }

      return false;
    }, true);

    loginDiv.querySelectorAll(".form_toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.toggle === "password") {
          codeStep = "identifier";
        }
        switchPanel(btn.dataset.toggle);
      });
    });

    if (resetLink) {
      resetLink.addEventListener("click", function (e) {
        e.preventDefault();
        switchPanel("reset");
      });
    }

    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-back-to-login]")) {
        e.preventDefault();
        codeStep = "identifier";
        switchPanel("password");
      }
    });

    form.addEventListener("click", async function (e) {
      if (!e.target.closest("[data-resend-code]")) return;
      e.preventDefault();

      if (codeStep !== "otp" || !codeIdentifier) return;

      switchCodeStep("identifier");
      const identifierInput = form.querySelector("[data-login-identifier]");
      if (identifierInput) identifierInput.value = codeIdentifier;

      await handleSendCode();
    });

    loginDiv.querySelectorAll('a[href*="register"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showRegister(true);
      });
    });

    if (registerDiv) {
      registerDiv.querySelectorAll('a[href*="sign-up-login"]:not([href*="register"]), a[href="/sign-up-login"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          showLogin(true);
        });
      });
    }

    // ── Restore UI state ──────────────────────────────────────────────────
    const urlIntent = getUrlIntent();

    if (urlIntent === "login") {
      uiState.view = "login";
      saveUiState(uiState);
    } else if (urlIntent === "register") {
      uiState.view = "register";
      saveUiState(uiState);
    }

    if (uiState.view === "login") {
      showLogin(false);
    } else {
      showRegister(false);
    }

    switchPanel(uiState.activePanel || "password", true);

    codeIdentifier = uiState.codeIdentifier || "";
    codeType       = uiState.codeType || "";
    codeStep       = uiState.codeStep || "identifier";

    if (activePanel === "code") {
      const identifierInput = form.querySelector("[data-login-identifier]");
      if (identifierInput && codeIdentifier) {
        identifierInput.value = codeIdentifier;
      }
      switchCodeStep(codeStep, true);
    } else {
      switchCodeStep("identifier", true);
    }

    syncUiState();
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
