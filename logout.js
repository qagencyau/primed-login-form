(() => {

  // ── Config ──────────────────────────────────────────────────────────────
  const LOGOUT_ENDPOINT_MAP = {
      "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/logout",
      "www.primedclinic.com.au":              "https://app.primedclinic.com.au/api/logout",
    };
// ── Endpoint resolver ────────────────────────────────────────────────────
  function resolveEndpoint(map) {
    const hostname = window.location.hostname;

    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) {
        return url;
      }
    }

    throw new Error(`No logout endpoint configured for host: ${hostname}`);
  }
  // ── Cookie helpers ───────────────────────────────────────────────────────
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function clearSessionCookies() {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }

  // ── Logout handler ───────────────────────────────────────────────────────
  async function handleLogout(e) {
    e.preventDefault();

    const xsrfToken = getCookie("XSRF-TOKEN");
    const LOGOUT_ENDPOINT = resolveEndpoint(LOGOUT_ENDPOINT_MAP);

    if (!xsrfToken) {
      console.warn("No XSRF token found — session may already be expired.");
    }

    try {
      const res = await fetch(LOGOUT_ENDPOINT, {
        method: "POST",
        credentials: "include", // sends primed_clinic_session cookie automatically
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg  = data?.message || data?.error || `Logout failed (${res.status}).`;
        console.error("Logout error:", msg);
        //return;
      }

      // Server session destroyed — clear client-side cookies and redirect
      clearSessionCookies();
      window.location.href = "/";

    } catch (err) {
      console.error("Logout failed due to a network error:", err);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const buttons = document.querySelectorAll('[data-logout-button="true"]');

    buttons.forEach((btn) => {
      if (btn.dataset.logoutBound === "true") return;
      btn.dataset.logoutBound = "true";
      btn.addEventListener("click", handleLogout);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
