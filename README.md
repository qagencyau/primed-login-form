# Primed Login Form

Standalone login and registration web components for Primed Clinic. Built as native Custom Elements, they can be dropped into any HTML page or Webflow project without a framework.

---

## Components

| File | Custom Element | Description |
|---|---|---|
| `login-form.js` | `<login-form>` | Email/password login with CSRF verification and session cookie |
| `register-form.js` | `<register-form>` | Email/password/confirm registration with client-side password validation |
| `style.css` | — | Error and form state styles |

---

## Installation

### 1. Add the files to your project

Copy `login-form.js`, `register-form.js`, and `style.css` into your project's asset directory.

### 2. Load the scripts and stylesheet

Add the following to the `<head>` of your HTML page:

```html
<link rel="stylesheet" href="/path/to/style.css">
<script src="/path/to/login-form.js" defer></script>
<script src="/path/to/register-form.js" defer></script>
```

> Both scripts must be loaded for the form-swapping behaviour to work. The `defer` attribute ensures the custom elements are defined before the browser upgrades the tags.

### 3. Place the component

Add `<login-form>` anywhere in your page body where you want the form to appear:

```html
<body>
  <login-form></login-form>
</body>
```

The register form does not need to be placed manually — it is rendered automatically when the user clicks the **Register** button, replacing the login form in-place. Clicking **Back to Login** reverses this.

---

## Webflow Installation

### 1. Upload the files

Go to **Assets** in your Webflow project and upload `login-form.js`, `register-form.js`, and `style.css`.

### 2. Add scripts to the page

In your page settings, add the following to the **Before `</body>` tag** section:

```html
<script src="[YOUR_LOGIN_FORM_JS_ASSET_URL]" defer></script>
<script src="[YOUR_REGISTER_FORM_JS_ASSET_URL]" defer></script>
```

And add the stylesheet to the **Inside `<head>` tag** section:

```html
<link rel="stylesheet" href="[YOUR_STYLE_CSS_ASSET_URL]">
```

Replace the bracketed URLs with the CDN URLs provided by Webflow after uploading.

### 3. Add an Embed element

In the Webflow Designer, add an **HTML Embed** component to your page and paste in:

```html
<login-form></login-form>
```

---

## Configuration

At the top of `login-form.js`, update the following static properties to match your backend:

```js
static LOGIN_ENDPOINT        = "https://your-api.com/api/login";
static SANCTUM_CSRF_ENDPOINT = "https://your-api.com/sanctum/csrf-cookie";
```

| Property | Description |
|---|---|
| `LOGIN_ENDPOINT` | The API route that accepts `POST` login requests |
| `SANCTUM_CSRF_ENDPOINT` | The Laravel Sanctum route that issues the `XSRF-TOKEN` cookie |
| `CSRF_TTL_SECONDS` | How long (in seconds) the CSRF token is considered valid before re-fetching. Defaults to `7200` (2 hours) |

---

## How It Works

### Authentication flow

1. On submit, the form checks for a valid `XSRF-TOKEN` cookie. If missing or expired, it fetches the Sanctum CSRF endpoint first.
2. Credentials are sent via `POST` to `LOGIN_ENDPOINT` with `credentials: "include"` so session cookies are sent and received.
3. On a successful response, a `__user` session cookie is set on the client as a lightweight session indicator. This is a signed JWT generated using the Web Crypto API (`HMAC-SHA256`) and expires when the browser session ends.
4. The page redirects to `/`. Update `window.location.href` in `_handleSubmit` if you need a different redirect target.

### Password validation (register form)

Client-side only. The confirm password field is checked against the password field on submit. If they don't match, submission is blocked and an inline error is shown. The error clears as the user re-types.

### Form swapping

The login and register forms replace each other in the DOM using `replaceWith()`. No routing or page navigation is involved.

---

## Dependencies

No external libraries or frameworks required. The components use:

- [Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) — for the web component
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — for JWT generation (`crypto.subtle`, `crypto.randomUUID`)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — for login and CSRF requests

All are supported in all modern browsers.