(function () {
  "use strict";

  const Shared = window.PrimedAuthShared;
  if (!Shared) {
    console.error("[RegisterForm] PrimedAuthShared is missing.");
    return;
  }

  class RegisterFormController {
    constructor(container) {
      this.container = container;
      this.form = container.querySelector("form.signup_input-form");
    }

    init() {
      if (!this.form) {
        console.warn("[RegisterForm] form.signup_input-form not found.");
        return;
      }

      this.prefillReferralCode();
      this.prepareErrors();
      this.bindEvents();
      this.restore();
    }

    restore() {
      const state = Shared.pageState.get();
      const surveyDiv = document.querySelector("#primed-survey");

      if (state.activeView === "survey") {
        if (state.userId) sessionStorage.setItem("userId", String(state.userId));
        if (surveyDiv && state.dashboardUrl) {
          surveyDiv.setAttribute("data-dashboard-url", state.dashboardUrl);
        }
        Shared.showOnlyView("survey");
      } else if (state.activeView === "login") {
        Shared.showOnlyView("login");
      } else {
        Shared.showOnlyView("register");
      }
    }

    prefillReferralCode() {
      const refInput = this.getReferralInput();
      const refCode = Shared.getReferralCodeFromUrl();
      if (refInput && refCode && !refInput.value.trim()) {
        refInput.value = refCode;
      }
    }

    prepareErrors() {
      const errorWrapper = this.container.querySelector(".form_message-error-wrapper");
      if (errorWrapper) errorWrapper.style.display = "none";

      if (!this.container.querySelector("#password-error")) {
        const confirmEl = this.container.querySelector("#Confirm-Password");
        const confirmWrapper = confirmEl ? confirmEl.closest(".form_field-wrapper") : null;

        if (confirmWrapper) {
          const pwError = document.createElement("div");
          pwError.id = "password-error";
          pwError.style.cssText = "display:none; color:#e53e3e; font-size:0.85rem; margin-top:0.25rem;";
          pwError.textContent = "Passwords do not match.";
          confirmWrapper.after(pwError);
        }
      }
    }

    getReferralInput() {
      return this.container.querySelector(
        "#Referral-Code, #register-referral-code, input[name='Referral-Code'], input[name='referral_code']"
      );
    }

    getReferralCode() {
      const refInput = this.getReferralInput();
      const inputValue = ((refInput ? refInput.value : "") || "").trim();
      const urlValue = Shared.getReferralCodeFromUrl();
      return inputValue || urlValue || "";
    }

    showError(message) {
      const wrapper = this.container.querySelector(".form_message-error-wrapper");
      const el = this.container.querySelector(".error-text");
      if (el) el.textContent = message;
      if (wrapper) {
        wrapper.classList.add("w-form-fail");
        wrapper.style.display = "block";
      }
    }

    hideError() {
      const wrapper = this.container.querySelector(".form_message-error-wrapper");
      if (wrapper) {
        wrapper.classList.remove("w-form-fail");
        wrapper.style.display = "none";
      }
    }

    setSubmitState(loading) {
      const btn = this.container.querySelector("input[type='submit']");
      if (!btn) return;
      btn.disabled = loading;
      btn.value = loading ? "Please wait..." : "Create account & Continue";
    }

    showSurvey(userId, dashboardUrl) {
      if (userId) sessionStorage.setItem("userId", String(userId));

      Shared.pageState.patch({
        activeView: "survey",
        userId: userId ? String(userId) : "",
        dashboardUrl: dashboardUrl || ""
      });

      const surveyDiv = document.querySelector("#primed-survey");
      if (surveyDiv && dashboardUrl) {
        surveyDiv.setAttribute("data-dashboard-url", dashboardUrl);
      }

      Shared.showOnlyView("survey");
    }

    async autoLogin(email, password, userId) {
      let dashboardUrl = null;

      try {
        await Shared.ensureCsrfCookie();
        const xsrfToken = Shared.getCookie("XSRF-TOKEN");

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.LOGIN_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrfToken),
          body: JSON.stringify({ email: email, password: password })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          await Shared.setUserSessionCookie();
          dashboardUrl = Shared.safeRedirectUrl(data && data.panel && data.panel.url);
        } else {
          console.warn("[RegisterForm] Auto-login failed, continuing without session");
        }
      } catch (err) {
        console.warn("[RegisterForm] Auto-login error, continuing without session", err);
      }

      this.showSurvey(userId, dashboardUrl);
    }

    collectPayload(passwordValue) {
      const q = (selector) => {
        const el = this.container.querySelector(selector);
        return ((el ? el.value : "") || "").trim();
      };

      const payload = {
        first_name: q("#First-Name"),
        last_name: q("#Last-Name"),
        email: q("#Email"),
        phone: q("#Phone"),
        address: q("#Address"),
        streetNumber: q("#streetNumber"),
        streetName: q("#streetName"),
        suburb: q("#suburb"),
        state: q("#state"),
        postcode: q("#postcode"),
        password: passwordValue
      };

      const referralCode = this.getReferralCode();
      if (referralCode) payload.referral_code = referralCode;

      return payload;
    }

    async handleSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      const password = this.container.querySelector("#Password");
      const confirm = this.container.querySelector("#Confirm-Password");
      const pwError = this.container.querySelector("#password-error");

      if (!password || !confirm) {
        this.showError("Form is missing required fields. Please refresh the page.");
        return;
      }

      if (pwError) pwError.style.display = "none";
      password.classList.remove("is-error");
      confirm.classList.remove("is-error");

      if (password.value !== confirm.value) {
        if (pwError) pwError.style.display = "block";
        password.classList.add("is-error");
        confirm.classList.add("is-error");
        confirm.focus();
        return;
      }

      this.hideError();
      this.setSubmitState(true);

      try {
        await Shared.ensureCsrfCookie();
        const xsrfToken = Shared.getCookie("XSRF-TOKEN");
        const payload = this.collectPayload(password.value);

        const res = await fetch(Shared.resolveEndpoint(Shared.CONFIG.REGISTER_ENDPOINT_MAP), {
          method: "POST",
          credentials: "include",
          headers: Shared.buildHeaders(xsrfToken),
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this.showError(
            (data && data.message) ||
            (data && data.error) ||
            "Registration failed. Please check your details and try again."
          );
          return;
        }

        await this.autoLogin(payload.email, password.value, data.user_id);
      } catch (err) {
        this.showError((err && err.message) || "Registration failed due to a network error.");
        console.error("[RegisterForm] Register error:", err);
      } finally {
        this.setSubmitState(false);
      }
    }

    handleBackToLogin() {
      Shared.pageState.patch({
        activeView: "login",
        userId: "",
        dashboardUrl: ""
      });

      Shared.showOnlyView("login");

      const loginContainer = document.querySelector("#login-form");
      if (loginContainer) {
        const input = loginContainer.querySelector("#log-in_input-form");
        if (input) input.focus();
      } else {
        console.error("[RegisterForm] #login-form not found");
      }
    }

    bindEvents() {
      if (this.form.dataset.registerBound !== "true") {
        this.form.dataset.registerBound = "true";
        this.form.addEventListener("submit", (e) => this.handleSubmit(e));
      }

      const password = this.container.querySelector("#Password");
      const confirm = this.container.querySelector("#Confirm-Password");
      const pwError = this.container.querySelector("#password-error");

      if (confirm) {
        confirm.addEventListener("input", function () {
          if (pwError && pwError.style.display === "block") {
            pwError.style.display = "none";
            confirm.classList.remove("is-error");
            if (password) password.classList.remove("is-error");
          }
        });
      }

      this.container.querySelectorAll(
        'a[href*="sign-up-login"]:not([href*="register"]), a[href="/sign-up-login"]'
      ).forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleBackToLogin();
        });
      });
    }
  }

  function init() {
    Shared.bootstrapFromUrlOnce();

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
