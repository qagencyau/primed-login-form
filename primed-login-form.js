(function () {
  "use strict";

  const Shared = window.PrimedAuthShared;
  if (!Shared) {
    console.error("[LoginForm] PrimedAuthShared is missing.");
    return;
  }

  class LoginFormController {
    constructor(container) {
      this.container = container;
      this.form = container.querySelector("form.login_input-form");
      this.emailInput = container.querySelector("#login-form_email");
      this.passInput = container.querySelector("#login-form_password");
      this.submitBtn = container.querySelector("input[type='submit']");
      this.resetLink = container.querySelector(".field-label-wrapper .text-style-link");

      this.state = Shared.loginUiState.get();
      this.activePanel = this.state.activePanel;
      this.codeStep = this.state.codeStep;
      this.codeIdentifier = this.state.codeIdentifier;
      this.codeType = this.state.codeType;
    }

    init() {
      if (!this.form || !this.emailInput || !this.passInput || !this.submitBtn) {
        console.warn("[LoginForm] Required form elements not found.");
        return;
      }

      this.injectPanels();
      this.cacheMessages();
      this.bindEvents();
      this.restore();
    }

    cacheMessages() {
      this.successWrapper = this.container.querySelector(".form_message-success-wrapper");
      this.errorWrapper = this.container.querySelector(".form_message-error-wrapper");
      this.successText = this.container.querySelector(".success-text");
      this.errorText = this.container.querySelector(".error-text");

      if (this.successWrapper) {
        this.successWrapper.style.display = "none";
        this.successWrapper.classList.remove("w-form-done");
      }
      if (this.errorWrapper) {
        this.errorWrapper.style.display = "none";
        this.errorWrapper.classList.remove("w-form-fail");
      }
    }

    syncUiState() {
      Shared.loginUiState.set({
        activePanel: this.activePanel,
        codeStep: this.codeStep,
        codeIdentifier: this.codeIdentifier,
        codeType: this.codeType
      });
    }

    restore() {
      const pageState = Shared.pageState.get();

      if (pageState.activeView === "survey") {
        const surveyDiv = document.querySelector("#primed-survey");
        if (surveyDiv && pageState.dashboardUrl) {
          surveyDiv.setAttribute("data-dashboard-url", pageState.dashboardUrl);
        }
        if (pageState.userId) {
          sessionStorage.setItem("userId", String(pageState.userId));
        }
        Shared.showOnlyView("survey");
        return;
      }

      Shared.showOnlyView(pageState.activeView === "login" ? "login" : "register");

      this.switchPanel(this.activePanel, true);

      this.codeIdentifier = this.state.codeIdentifier || "";
      this.codeType = this.state.codeType || "";
      this.codeStep = this.state.codeStep || "identifier";

      if (this.activePanel === "code") {
        const identifierInput = this.form.querySelector("[data-login-identifier]");
        if (identifierInput && this.codeIdentifier) {
          identifierInput.value = this.codeIdentifier;
        }
        this.switchCodeStep(this.codeStep, true);
      } else {
        this.switchCodeStep("identifier", true);
      }

      this.syncUiState();
    }

    showLogin() {
      Shared.pageState.patch({
        activeView: "login",
        userId: "",
        dashboardUrl: ""
      });
      Shared.showOnlyView("login");
      this.emailInput.focus();
    }

    showRegister() {
      Shared.pageState.patch({
        activeView: "register",
        userId: "",
        dashboardUrl: ""
      });
      Shared.showOnlyView("register");
    }

    showMessage(type, text) {
      if (type === "success") {
        if (this.errorWrapper) {
          this.errorWrapper.style.display = "none";
          this.errorWrapper.classList.remove("w-form-fail");
        }
        if (this.successWrapper) {
          this.successWrapper.style.display = "block";
          this.successWrapper.classList.add("w-form-done");
        }
        if (this.successText) this.successText.textContent = text;
      } else {
        if (this.successWrapper) {
          this.successWrapper.style.display = "none";
          this.successWrapper.classList.remove("w-form-done");
        }
        if (this.errorWrapper) {
          this.errorWrapper.style.display = "block";
          this.errorWrapper.classList.add("w-form-fail");
        }
        if (this.errorText) this.errorText.textContent = text;
      }
    }

    hideMessages() {
      if (this.successWrapper) {
        this.successWrapper.style.display = "none";
        this.successWrapper.classList.remove("w-form-done");
      }
      if (this.errorWrapper) {
        this.errorWrapper.style.display = "none";
        this.errorWrapper.classList.remove("w-form-fail");
      }
    }

    setSubmitState(loading) {
      this.submitBtn.disabled = loading;

      if (loading) {
        this.submitBtn.value =
          this.activePanel === "password"
            ? "Logging in..."
            : this.activePanel === "reset"
            ? "Sending..."
            : this.codeStep === "identifier"
            ? "Sending..."
            : "Verifying...";
      } else {
        this.submitBtn.value =
          this.activePanel === "password"
            ? "Login"
            : this.activePanel === "reset"
            ? "Send Reset Link"
            : this.codeStep === "identifier"
            ? "Send Code"
            : "Verify Code";
      }
    }

    switchCodeStep(step, skipSave) {
      this.codeStep = step;

      const identifierStep = this.form.querySelector('[data-code-step="identifier"]');
      const otpStep = this.form.querySelector('[data-code-step="otp"]');

      if (identifierStep) identifierStep.style.display = step === "identifier" ? "" : "none";
      if (otpStep) otpStep.style.display = step === "otp" ? "" : "none";

      if (step === "otp") {
        const otpInput = this.form.querySelector("[data-login-otp]");
        if (otpInput) otpInput.focus();
      }

      this.setSubmitState(false);
      if (!skipSave) this.syncUiState();
    }

    switchPanel(panel, skipSave) {
      this.activePanel = panel;

      this.container.querySelectorAll("[data-login-panel]").forEach((el) => {
        const isActive = el.dataset.loginPanel === panel;
        el.classList.toggle("lf-active", isActive);

        el.querySelectorAll("input, select, textarea").forEach((input) => {
          if (isActive) {
            if (input.dataset.wasRequired === "true") input.required = true;
          } else {
            if (input.required) input.dataset.wasRequired = "true";
            input.required = false;
          }
        });
      });

      const toggleWrapper = this.container.querySelector("[data-login-toggle-wrapper]");
      const registerBtnWrapper = this.container.querySelector("[data-login-register-btn-wrapper]");
      const isReset = panel === "reset";

      if (toggleWrapper) toggleWrapper.style.display = isReset ? "none" : "";
      if (registerBtnWrapper) registerBtnWrapper.style.display = isReset ? "none" : "";

      if (panel === "code") {
        this.switchCodeStep(this.codeStep || "identifier", true);
      }

      if (panel === "reset") {
        const resetEmail = this.form.querySelector("[data-reset-email]");
        if (resetEmail) resetEmail.focus();
      }

      this.container.querySelectorAll(".form_toggle-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.toggle === panel);
      });

      this.hideMessages();
      this.setSubmitState(false);

      if (!skipSave) this.syncUiState();
    }

    async handlePasswordSubmit() {
      const email = (this.emailInput.value || "").trim();
      const password = this.passInput.value || "";

      if (!email || !password) {
        this.showMessage("error", "Please enter your email and password.");
        return;
      }

      this.setSubmitState(true);

      try {
        await Shared.ensureCsrfCookie();
        const xsrf = Shared.getCookie("XSRF-TOKEN");

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.LOGIN_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrf),
          body: JSON.stringify({ email: email, password: password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this.showMessage(
            "error",
            (data && data.message) ||
            (data && data.error) ||
            "Login failed. Please check your details and try again."
          );
          return;
        }

        await Shared.setUserSessionCookie();
        Shared.loginUiState.clear();
        Shared.pageState.patch({
          activeView: "login",
          userId: "",
          dashboardUrl: ""
        });

        this.showMessage("success", "Logged in successfully.");
        window.location.href =
          Shared.safeRedirectUrl(data && data.panel && data.panel.url) ||
          Shared.getLoginRedirectUrl();
      } catch (err) {
        this.showMessage("error", (err && err.message) || "Login failed due to a network error.");
        console.error("[LoginForm] Login error:", err);
      } finally {
        this.setSubmitState(false);
      }
    }

    async handleSendCode() {
      const identifierInput = this.form.querySelector("[data-login-identifier]");
      const identifierError = this.form.querySelector("[data-login-identifier-error]");
      const raw = (identifierInput ? identifierInput.value : "").trim();

      if (identifierError) {
        identifierError.style.display = "none";
        identifierError.textContent = "";
      }
      if (identifierInput) identifierInput.classList.remove("is-error");

      const type = Shared.detectIdentifierType(raw);
      if (!type) {
        if (identifierError) {
          identifierError.textContent = "Please enter a valid email address or phone number.";
          identifierError.style.display = "block";
        }
        if (identifierInput) {
          identifierInput.classList.add("is-error");
          identifierInput.focus();
        }
        return;
      }

      this.setSubmitState(true);

      try {
        await Shared.ensureCsrfCookie();
        const xsrf = Shared.getCookie("XSRF-TOKEN");

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.SEND_CODE_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrf),
          body: JSON.stringify({
            email: type === "email" ? raw : "",
            phone: type === "phone" ? raw : ""
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this.showMessage(
            "error",
            (data && data.message) ||
            (data && data.error) ||
            "Failed to send code. Please try again."
          );
          return;
        }

        this.codeIdentifier = raw;
        this.codeType = type;
        this.syncUiState();
        this.hideMessages();
        this.switchCodeStep("otp");
      } catch (err) {
        this.showMessage("error", (err && err.message) || "Failed to send code due to a network error.");
        console.error("[LoginForm] Send code error:", err);
      } finally {
        this.setSubmitState(false);
      }
    }

    async handleValidateCode() {
      const otpInput = this.form.querySelector("[data-login-otp]");
      const otpError = this.form.querySelector("[data-login-otp-error]");
      const code = (otpInput ? otpInput.value : "").trim();

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
        if (otpInput) {
          otpInput.classList.add("is-error");
          otpInput.focus();
        }
        return;
      }

      this.setSubmitState(true);

      try {
        await Shared.ensureCsrfCookie();
        const xsrf = Shared.getCookie("XSRF-TOKEN");

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.VALIDATE_CODE_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrf),
          body: JSON.stringify({
            email: this.codeType === "email" ? this.codeIdentifier : "",
            phone: this.codeType === "phone" ? this.codeIdentifier : "",
            code: code
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (otpError) {
            otpError.textContent =
              (data && data.message) ||
              (data && data.error) ||
              "Invalid code. Please try again.";
            otpError.style.display = "block";
          }
          if (otpInput) otpInput.classList.add("is-error");
          return;
        }

        await Shared.setUserSessionCookie();
        Shared.loginUiState.clear();
        Shared.pageState.patch({
          activeView: "login",
          userId: "",
          dashboardUrl: ""
        });

        this.showMessage("success", "Logged in successfully.");
        window.location.href =
          Shared.safeRedirectUrl(data && data.panel && data.panel.url) ||
          Shared.getLoginRedirectUrl();
      } catch (err) {
        this.showMessage("error", (err && err.message) || "Verification failed due to a network error.");
        console.error("[LoginForm] Validate code error:", err);
      } finally {
        this.setSubmitState(false);
      }
    }

    async handleForgotPassword() {
      const emailEl = this.form.querySelector("[data-reset-email]");
      const emailErr = this.form.querySelector("[data-reset-email-error]");
      const email = (emailEl ? emailEl.value : "").trim();

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
        if (emailEl) {
          emailEl.classList.add("is-error");
          emailEl.focus();
        }
        return;
      }

      this.setSubmitState(true);

      try {
        await Shared.ensureCsrfCookie();
        const xsrf = Shared.getCookie("XSRF-TOKEN");

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.FORGOT_PASSWORD_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrf),
          body: JSON.stringify({ email: email })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this.showMessage(
            "error",
            (data && data.message) ||
            (data && data.error) ||
            "Failed to send reset link. Please try again."
          );
          return;
        }

        this.showMessage("success", "If an account exists for that email, a password reset link has been sent.");
      } catch (err) {
        this.showMessage("error", (err && err.message) || "Failed to send reset link due to a network error.");
        console.error("[LoginForm] Forgot password error:", err);
      } finally {
        this.setSubmitState(false);
      }
    }

    bindEvents() {
      this.form.setAttribute("novalidate", "novalidate");

      this.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.hideMessages();

        try {
          if (this.activePanel === "password") {
            await this.handlePasswordSubmit();
          } else if (this.activePanel === "reset") {
            await this.handleForgotPassword();
          } else if (this.codeStep === "identifier") {
            await this.handleSendCode();
          } else {
            await this.handleValidateCode();
          }
        } catch (err) {
          console.error("[LoginForm] Submit error:", err);
          this.showMessage("error", "Something went wrong. Please try again.");
          this.setSubmitState(false);
        }

        return false;
      }, true);

      this.container.querySelectorAll(".form_toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.toggle === "password") {
            this.codeStep = "identifier";
          }
          this.switchPanel(btn.dataset.toggle);
        });
      });

      if (this.resetLink) {
        this.resetLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.switchPanel("reset");
        });
      }

      this.form.addEventListener("click", async (e) => {
        if (e.target.closest("[data-back-to-login]")) {
          e.preventDefault();
          this.codeStep = "identifier";
          this.switchPanel("password");
          return;
        }

        if (e.target.closest("[data-resend-code]")) {
          e.preventDefault();

          if (this.codeStep !== "otp" || !this.codeIdentifier) return;

          this.switchCodeStep("identifier");
          const identifierInput = this.form.querySelector("[data-login-identifier]");
          if (identifierInput) identifierInput.value = this.codeIdentifier;

          await this.handleSendCode();
        }
      });

      this.container.querySelectorAll('a[href*="register"]').forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.showRegister();
        });
      });

      const registerDiv = document.querySelector("#signup-form");
      if (registerDiv) {
        registerDiv.querySelectorAll('a[href*="sign-up-login"]:not([href*="register"]), a[href="/sign-up-login"]').forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            this.showLogin();
          });
        });
      }
    }

    injectPanels() {
      this.passInput.type = "password";

      if (!document.getElementById("lf-panel-style")) {
        const style = document.createElement("style");
        style.id = "lf-panel-style";
        style.textContent =
          "[data-login-panel] { display: none !important; } " +
          "[data-login-panel].lf-active { display: block !important; }";
        document.head.appendChild(style);
      }

      const passwordPanel = document.createElement("div");
      passwordPanel.setAttribute("data-login-panel", "password");
      passwordPanel.style.display = "none";

      const emailWrapper = this.emailInput.closest(".form_field-wrapper");
      const passWrapper = this.passInput.closest(".form_field-wrapper");

      emailWrapper.parentNode.insertBefore(passwordPanel, emailWrapper);
      passwordPanel.appendChild(emailWrapper);
      passwordPanel.appendChild(passWrapper);

      const toggleWrapper = document.createElement("div");
      toggleWrapper.setAttribute("data-login-toggle-wrapper", "");
      toggleWrapper.innerHTML = `
        <div class="form_toggle-wrapper" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
          <button type="button" class="form_toggle-btn is-active" data-toggle="password">Password</button>
          <button type="button" class="form_toggle-btn" data-toggle="code">Code</button>
        </div>
      `;
      passwordPanel.parentNode.insertBefore(toggleWrapper, passwordPanel);

      const codePanel = document.createElement("div");
      codePanel.setAttribute("data-login-panel", "code");
      codePanel.style.display = "none";
      codePanel.innerHTML = `
        <div data-code-step="identifier">
          <div class="form_field-wrapper">
            <div class="form_field-label">Email or Phone Number</div>
            <input class="form_input w-input" maxlength="256" name="login-identifier" placeholder="Email or phone number" type="text" data-login-identifier="true"/>
            <div data-login-identifier-error="true" style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
          </div>
        </div>
        <div data-code-step="otp" style="display:none;">
          <div class="form_field-wrapper">
            <div class="form_field-label">Enter the code sent to you</div>
            <input class="form_input w-input" maxlength="10" name="login-otp" placeholder="6-digit code" type="text" inputmode="numeric" autocomplete="one-time-code" data-login-otp="true"/>
            <div data-login-otp-error="true" style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
          </div>
          <div style="margin-bottom:0.5rem;">
            <a href="#" class="text-style-link text-size-small" data-resend-code="true">Resend code</a>
          </div>
        </div>
      `;
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
          <input class="form_input w-input" maxlength="256" name="reset-email" placeholder="" type="email" data-reset-email="true"/>
          <div data-reset-email-error="true" style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:0.25rem;"></div>
        </div>
        <div style="margin-bottom:0.75rem;">
          <a href="#" class="text-style-link text-size-small" data-back-to-login="true">← Back to login</a>
        </div>
      `;
      codePanel.after(resetPanel);

      const registerBtnWrapper = document.createElement("div");
      registerBtnWrapper.setAttribute("data-login-register-btn-wrapper", "");
      const submitGrid = this.submitBtn.closest(".w-layout-grid") || this.submitBtn.parentNode;
      const wfParagraph = Array.from(this.form.querySelectorAll("p.text-size-small")).find((el) => !el.closest("[data-login-panel]"));
      const marginBottom = wfParagraph && wfParagraph.closest(".margin-bottom");
      const buttonGroup = Array.from(this.form.querySelectorAll(".button-group")).find((el) => !el.closest("[data-login-panel]"));

      submitGrid.after(registerBtnWrapper);
      if (marginBottom) registerBtnWrapper.appendChild(marginBottom);
      if (buttonGroup) registerBtnWrapper.appendChild(buttonGroup);
    }
  }

  function init() {
    Shared.bootstrapFromUrlOnce();

    const container = document.querySelector("#login-form");
    if (!container) {
      console.warn("[LoginForm] #login-form not found.");
      return;
    }

    const ctrl = new LoginFormController(container);
    ctrl.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
