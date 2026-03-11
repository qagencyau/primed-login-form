(function () {
  "use strict";

  const LOOKUP_ID = "register-address";
  const DETAILS_WRAPPER_ID = "address-details-wrapper";

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };
  const MANUAL_TOGGLE_ID = "address-manual-toggle";

  // Match your form spacing. If your form uses a different rhythm, change this.
  const ROW_GAP_PX = 16;

  function injectStyles() {
    if (document.getElementById("primed-address-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-address-styles";
    style.textContent = `
      /* Animation */
      .addr-anim {
        overflow: hidden;
        transition: max-height 260ms ease, opacity 220ms ease;
        will-change: max-height, opacity;
      }

      /* Spacing inside the detailed address wrapper */
      #${DETAILS_WRAPPER_ID} > * + * {
        margin-top: ${ROW_GAP_PX}px;
      }

      /* If your 2-col rows contain form_field-wrapper children,
         this adds a little internal vertical space if they ever wrap */
      #${DETAILS_WRAPPER_ID} .form_field-2col .form_field-wrapper + .form_field-wrapper {
        margin-top: 0;
      }

      .address-manual-toggle {
        display: none;
        margin-top: ${ROW_GAP_PX}px;
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .address-manual-toggle.is-visible {
        display: block;
      }

      .address-manual-toggle label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .address-manual-toggle input[type="checkbox"] {
        margin: 0;
      }

      .address-field-is-locked {
        background: #f7f7f7;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function clearAddressFields() {
    Object.values(FIELD_IDS).forEach(function (id) {
      const el = $(id);
      if (el) el.value = "";
    });
  }

  function getAddressFieldElements() {
    return Object.values(FIELD_IDS)
      .map(function (id) { return $(id); })
      .filter(Boolean);
  }

  function ensureManualToggle(wrapper) {
    if (!wrapper) return null;

    let toggle = document.getElementById(MANUAL_TOGGLE_ID);
    if (toggle) return toggle;

    toggle = document.createElement("div");
    toggle.id = MANUAL_TOGGLE_ID;
    toggle.className = "address-manual-toggle";
    toggle.innerHTML =
      '<label for="address-manual-entry-checkbox">' +
      '<input type="checkbox" id="address-manual-entry-checkbox" />' +
      "<span>Manually enter address</span>" +
      "</label>";

    wrapper.appendChild(toggle);

    const checkbox = toggle.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.addEventListener("change", function () {
        setAddressFieldsReadOnly(!checkbox.checked);
      });
    }

    return toggle;
  }

  function setAddressFieldsReadOnly(readOnly) {
    getAddressFieldElements().forEach(function (el) {
      el.readOnly = !!readOnly;
      el.classList.toggle("address-field-is-locked", !!readOnly);
      el.setAttribute("aria-readonly", readOnly ? "true" : "false");
    });
  }

  function showManualToggle(wrapper, checked) {
    const toggle = ensureManualToggle(wrapper);
    if (!toggle) return;

    const checkbox = toggle.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = !!checked;
    toggle.classList.add("is-visible");
    setAddressFieldsReadOnly(!checked);
  }

  function hideManualToggle(wrapper) {
    const toggle = ensureManualToggle(wrapper);
    if (!toggle) return;

    const checkbox = toggle.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = false;
    toggle.classList.remove("is-visible");
    setAddressFieldsReadOnly(false);
  }

  function getComponent(place, type) {
    if (!place || !place.address_components) return null;
    for (const c of place.address_components) {
      if (c.types && c.types.indexOf(type) > -1) return c;
    }
    return null;
  }

  function populateAddress(place) {
    const streetNumberC = getComponent(place, "street_number");
    const routeC = getComponent(place, "route");

    const suburbC =
      getComponent(place, "locality") ||
      getComponent(place, "postal_town") ||
      getComponent(place, "sublocality") ||
      getComponent(place, "sublocality_level_1");

    const stateC = getComponent(place, "administrative_area_level_1");
    const postcodeC = getComponent(place, "postal_code");

    const streetNumberEl = $(FIELD_IDS.streetNumber);
    const streetNameEl = $(FIELD_IDS.streetName);
    const suburbEl = $(FIELD_IDS.suburb);
    const stateEl = $(FIELD_IDS.state);
    const postcodeEl = $(FIELD_IDS.postcode);

    if (streetNumberEl) streetNumberEl.value = streetNumberC ? streetNumberC.long_name : "";
    if (streetNameEl) streetNameEl.value = routeC ? routeC.long_name : "";
    if (suburbEl) suburbEl.value = suburbC ? suburbC.long_name : "";
    if (stateEl) stateEl.value = stateC ? (stateC.short_name || stateC.long_name) : "";
    if (postcodeEl) postcodeEl.value = postcodeC ? postcodeC.long_name : "";

    [streetNumberEl, streetNameEl, suburbEl, stateEl, postcodeEl].forEach(function (el) {
      if (!el) return;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function showAnimated(el) {
    if (!el) return;

    el.classList.add("addr-anim");
    el.style.display = "block";
    el.style.opacity = "0";
    el.style.maxHeight = "0px";
    el.style.pointerEvents = "none";

    void el.offsetHeight;

    const target = el.scrollHeight;
    el.style.opacity = "1";
    el.style.maxHeight = target + "px";
    el.style.pointerEvents = "auto";

    setTimeout(function () {
      el.style.maxHeight = "none";
    }, 320);
  }

  function hideAnimatedToNone(el) {
    if (!el) return;

    el.classList.add("addr-anim");

    const h = el.scrollHeight;
    el.style.maxHeight = h + "px";
    el.style.opacity = "1";
    el.style.pointerEvents = "auto";

    void el.offsetHeight;

    el.style.maxHeight = "0px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";

    setTimeout(function () {
      el.style.display = "none";
    }, 300);
  }

  function waitForPlaces(onReady, onFail) {
    const start = Date.now();
    const maxWaitMs = 15000;

    (function tick() {
      const ready =
        window.google &&
        google.maps &&
        google.maps.places &&
        typeof google.maps.places.Autocomplete === "function";

      if (ready) return onReady();

      if (Date.now() - start > maxWaitMs) {
        if (typeof onFail === "function") onFail();
        return;
      }

      setTimeout(tick, 200);
    })();
  }

  function bindIfReady() {
    const lookupInput = $(LOOKUP_ID);
    const wrapper = $(DETAILS_WRAPPER_ID);

    if (!lookupInput || !wrapper) return false;
    if (lookupInput.__primedBound) return true;

    lookupInput.__primedBound = true;

    // Ensure initial hidden state (no gap)
    wrapper.style.display = "none";
    wrapper.style.opacity = "0";
    wrapper.style.maxHeight = "0px";
    wrapper.style.pointerEvents = "none";
    wrapper.classList.add("addr-anim");
    ensureManualToggle(wrapper);

    waitForPlaces(
      function () {
        const ac = new google.maps.places.Autocomplete(lookupInput, {
          types: ["address"],
          componentRestrictions: { country: "au" },
          fields: ["address_components", "formatted_address"],
        });

        ac.addListener("place_changed", function () {
          const place = ac.getPlace();
          if (!place || !place.address_components) return;

          if (place.formatted_address) lookupInput.value = place.formatted_address;

          populateAddress(place);
          showAnimated(wrapper);
          showManualToggle(wrapper, false);
        });

        lookupInput.addEventListener("input", function () {
          if (!lookupInput.value.trim()) {
            clearAddressFields();
            hideManualToggle(wrapper);
            hideAnimatedToNone(wrapper);
          } else {
            hideManualToggle(wrapper);
          }
        });
      },
      function () {
        // If Google fails, show fields so user can type
        wrapper.style.display = "block";
        wrapper.style.opacity = "1";
        wrapper.style.maxHeight = "none";
        wrapper.style.pointerEvents = "auto";
        showManualToggle(wrapper, true);
      }
    );

    return true;
  }

  function startObserver() {
    if (bindIfReady()) return;

    const obs = new MutationObserver(function () {
      if (bindIfReady()) obs.disconnect();
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 20000);
  }

  function init() {
    injectStyles();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
