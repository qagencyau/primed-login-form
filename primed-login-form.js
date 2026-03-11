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

      const state = Shared.loginUiState.get();
      this.codeStep = state.codeStep || "identifier";
      this.codeIdentifier = state.codeIdentifier || "";
      this.codeType = state.codeType || "";
      this.activePanel = "password";
    }

    init() {
      if (!this.form || !this.emailInput || !this.passInput || !this.submitBtn) {
        console.warn("[LoginForm] Required form elements not found.");
        return;
      }

      this.passInput.type = "password";
      this.cacheMessages();
      this.bindEvents();
      this.restore();
    }

    // Returns "password", "code", or "reset" based on the active Webflow tab or data attribute.
    // Reads the tab link that has data-toggle set and is currently active (w--current),
    // or falls back to any element with data-login-active-panel on the container.
    readActivePanel() {
      const activeTab = this.container.querySelector("[data-toggle].w--current");
      if (activeTab && activeTab.dataset.toggle) return activeTab.dataset.toggle;
      const declared = this.container.dataset.loginActivePanel;
      if (declared) return declared;
      return "password";
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

      this.activePanel = this.readActivePanel();

      if (this.activePanel === "code") {
        const identifierInput = this.form.querySelector("[data-login-identifier]");
        if (identifierInput && this.codeIdentifier) {
          identifierInput.value = this.codeIdentifier;
        }
        this.switchCodeStep(this.codeStep, true);
      }

      this.setSubmitState(false);
    }

    showLogin() {
      Shared.pageState.patch({ activeView: "login", userId: "", dashboardUrl: "" });
      Shared.showOnlyView("login");
      this.emailInput.focus();
    }

    showRegister() {
      Shared.pageState.patch({ activeView: "register", userId: "", dashboardUrl: "" });
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
          this.activePanel === "password" ? "Logging in..." :
          this.activePanel === "reset"    ? "Sending..." :
          this.codeStep === "identifier"  ? "Sending..." : "Verifying...";
      } else {
        this.submitBtn.value =
          this.activePanel === "password" ? "Login" :
          this.activePanel === "reset"    ? "Send Reset Link" :
          this.codeStep === "identifier"  ? "Send Code" : "Verify Code";
      }
    }

    // Shows/hides the identifier vs OTP step within the code tab pane.
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
        Shared.pageState.patch({ activeView: "login", userId: "", dashboardUrl: "" });

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
        Shared.pageState.patch({ activeView: "login", userId: "", dashboardUrl: "" });

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

        this.activePanel = this.readActivePanel();
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

      // Track active panel when Webflow tab links (with data-toggle) are clicked.
      this.container.querySelectorAll("[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.activePanel = btn.dataset.toggle;
          if (this.activePanel === "password") this.codeStep = "identifier";
          this.setSubmitState(false);
          this.hideMessages();
        });
      });

      if (this.resetLink) {
        this.resetLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.activePanel = "reset";
          this.setSubmitState(false);
        });
      }

      this.form.addEventListener("click", async (e) => {
        if (e.target.closest("[data-back-to-login]")) {
          e.preventDefault();
          this.codeStep = "identifier";
          this.activePanel = "password";
          this.setSubmitState(false);
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
