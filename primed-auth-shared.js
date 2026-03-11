(function (window) {
  "use strict";

  const AUTH_PAGE_STATE_KEY = "primed_auth_page_state_v1";
  const LOGIN_UI_STATE_KEY = "primed_auth_login_ui_state_v1";
  const PAGE_BOOTSTRAP_KEY = "primed_auth_bootstrap_done_v1";
  const PAGE_PATH_KEY = "primed_auth_page_path_v1";

  const CSRF_TTL_SECONDS = 7200;
  const CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  const CONFIG = {
    LOGIN_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/login"
    },
    SEND_CODE_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/send-code",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/send-code"
    },
    VALIDATE_CODE_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/validate-code",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/validate-code"
    },
    FORGOT_PASSWORD_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/forgot-password",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/forgot-password"
    },
    REGISTER_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/register/guest"
    },
    SANCTUM_CSRF_ENDPOINT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/sanctum/csrf-cookie"
    },
    LOGIN_REDIRECT_MAP: {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/patient",
      "www.primedclinic.com.au": "https://app.primedclinic.com.au/patient"
    },
    allowedHosts: new Set([
      "app.primedclinic.com.au",
      "primedclinic.com.au",
      "www.primedclinic.com.au",
      "dev-frontend.primedclinic.com.au",
      "api.dev.primedclinic.com.au"
    ])
  };

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

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {}
  }

  function getCurrentPageKey() {
    return window.location.pathname;
  }

  function clearAllAuthState() {
    try {
      localStorage.removeItem(AUTH_PAGE_STATE_KEY);
    } catch (_e) {}

    try {
      localStorage.removeItem(LOGIN_UI_STATE_KEY);
    } catch (_e) {}

    try {
      sessionStorage.removeItem(PAGE_BOOTSTRAP_KEY);
    } catch (_e) {}
  }

  function clearStateIfPageChanged() {
    try {
      const currentPageKey = getCurrentPageKey();
      const previousPageKey = sessionStorage.getItem(PAGE_PATH_KEY);

      if (previousPageKey && previousPageKey !== currentPageKey) {
        clearAllAuthState();
      }

      sessionStorage.setItem(PAGE_PATH_KEY, currentPageKey);
    } catch (_e) {}
  }

  const pageState = {
    defaults: function () {
      return {
        activeView: "register",
        userId: "",
        dashboardUrl: ""
      };
    },
    get: function () {
      const value = loadJson(AUTH_PAGE_STATE_KEY, this.defaults());
      return {
        activeView: ["login", "register", "survey"].includes(value && value.activeView)
          ? value.activeView
          : "register",
        userId: value && typeof value.userId === "string" ? value.userId : "",
        dashboardUrl: value && typeof value.dashboardUrl === "string" ? value.dashboardUrl : ""
      };
    },
    set: function (value) {
      saveJson(AUTH_PAGE_STATE_KEY, {
        activeView: ["login", "register", "survey"].includes(value && value.activeView)
          ? value.activeView
          : "register",
        userId: value && typeof value.userId === "string" ? value.userId : "",
        dashboardUrl: value && typeof value.dashboardUrl === "string" ? value.dashboardUrl : ""
      });
    },
    patch: function (patch) {
      this.set(Object.assign({}, this.get(), patch || {}));
    },
    clear: function () {
      try {
        localStorage.removeItem(AUTH_PAGE_STATE_KEY);
      } catch (_e) {}
    }
  };

  const loginUiState = {
    defaults: function () {
      return {
        activePanel: "password",
        codeStep: "identifier",
        codeIdentifier: "",
        codeType: ""
      };
    },
    get: function () {
      const value = loadJson(LOGIN_UI_STATE_KEY, this.defaults());
      return {
        activePanel: ["password", "code", "reset"].includes(value && value.activePanel)
          ? value.activePanel
          : "password",
        codeStep: ["identifier", "otp"].includes(value && value.codeStep)
          ? value.codeStep
          : "identifier",
        codeIdentifier: value && typeof value.codeIdentifier === "string" ? value.codeIdentifier : "",
        codeType: ["email", "phone"].includes(value && value.codeType) ? value.codeType : ""
      };
    },
    set: function (value) {
      saveJson(LOGIN_UI_STATE_KEY, {
        activePanel: ["password", "code", "reset"].includes(value && value.activePanel)
          ? value.activePanel
          : "password",
        codeStep: ["identifier", "otp"].includes(value && value.codeStep)
          ? value.codeStep
          : "identifier",
        codeIdentifier: value && typeof value.codeIdentifier === "string" ? value.codeIdentifier : "",
        codeType: ["email", "phone"].includes(value && value.codeType) ? value.codeType : ""
      });
    },
    clear: function () {
      try {
        localStorage.removeItem(LOGIN_UI_STATE_KEY);
      } catch (_e) {}
    }
  };

  function showOnlyView(viewName) {
    const loginDiv = document.querySelector("#login-form");
    const registerDiv = document.querySelector("#signup-form");
    const surveyDiv = document.querySelector("#primed-survey");

    if (loginDiv) loginDiv.style.display = viewName === "login" ? "block" : "none";
    if (registerDiv) registerDiv.style.display = viewName === "register" ? "block" : "none";
    if (surveyDiv) surveyDiv.style.display = viewName === "survey" ? "block" : "none";
  }

  function resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const key in map) {
      if (hostname === key || hostname.endsWith("." + key)) return map[key];
    }
    return Object.values(map)[0];
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  function csrfIsValid() {
    const token = getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(getCookie(CSRF_EXPIRY_COOKIE) || "", 10);
    if (!token || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async function ensureCsrfCookie() {
    if (csrfIsValid()) return;
    await fetch(resolveEndpoint(CONFIG.SANCTUM_CSRF_ENDPOINT_MAP), {
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

  async function generateUserToken() {
    const b64url = function (buf) {
      return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buf))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };

    const encode = function (obj) {
      return b64url(new TextEncoder().encode(JSON.stringify(obj)));
    };

    const header = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: generateUUID(),
      session: true
    });

    const key = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    return `${header}.${payload}.${b64url(sig)}`;
  }

  async function setUserSessionCookie() {
    const token = await generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  function safeRedirectUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
      const u = new URL(rawUrl, window.location.origin);
      return CONFIG.allowedHosts.has(u.hostname) ? u.toString() : null;
    } catch (_e) {
      return null;
    }
  }

  function getLoginRedirectUrl() {
    return resolveEndpoint(CONFIG.LOGIN_REDIRECT_MAP) || "/";
  }

  function detectIdentifierType(value) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    if (/^\+?[\d\s\-().]{7,15}$/.test(value)) return "phone";
    return null;
  }

  function getReferralCodeFromUrl() {
    try {
      return (new URLSearchParams(window.location.search).get("referral_code") || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function getInitialUrlView() {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = (params.get("view") || "").trim().toLowerCase();
      if (view === "login" || view === "register") return view;
      return null;
    } catch (_e) {
      return null;
    }
  }

  function stripBootstrapQueryParams() {
    try {
      const url = new URL(window.location.href);
      let changed = false;

      if (url.searchParams.has("view")) {
        url.searchParams.delete("view");
        changed = true;
      }

      if (changed) {
        history.replaceState(null, "", url.toString());
      }
    } catch (_e) {}
  }

  function bootstrapFromUrlOnce() {
    try {
      clearStateIfPageChanged();

      const alreadyBootstrapped = sessionStorage.getItem(PAGE_BOOTSTRAP_KEY) === "true";
      if (alreadyBootstrapped) return;

      const initialView = getInitialUrlView();
      if (initialView) {
        pageState.patch({
          activeView: initialView,
          userId: "",
          dashboardUrl: ""
        });
      }

      stripBootstrapQueryParams();
      sessionStorage.setItem(PAGE_BOOTSTRAP_KEY, "true");
    } catch (_e) {}
  }

  window.PrimedAuthShared = {
    CONFIG: CONFIG,
    pageState: pageState,
    loginUiState: loginUiState,
    showOnlyView: showOnlyView,
    resolveEndpoint: resolveEndpoint,
    getCookie: getCookie,
    setCookie: setCookie,
    ensureCsrfCookie: ensureCsrfCookie,
    buildHeaders: buildHeaders,
    setUserSessionCookie: setUserSessionCookie,
    safeRedirectUrl: safeRedirectUrl,
    getLoginRedirectUrl: getLoginRedirectUrl,
    detectIdentifierType: detectIdentifierType,
    getReferralCodeFromUrl: getReferralCodeFromUrl,
    bootstrapFromUrlOnce: bootstrapFromUrlOnce,
    clearAllAuthState: clearAllAuthState
  };
})(window);
