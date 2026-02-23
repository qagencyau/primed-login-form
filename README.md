# Primed Login Form

Standalone login, registration, and logout scripts for Primed Clinic. Built as native Custom Elements and plain JavaScript, they can be dropped into any HTML page or Webflow project without a framework.

---

## Files

| File | Type | Description |
|---|---|---|
| `login-form.js` | Custom Element `<login-form>` | Login form with password and OTP code flows, CSRF verification, and session cookie management |
| `register-form.js` | Custom Element `<register-form>` | Registration form with full guest account creation and email verification prompt |
| `logout.js` | Plain script | Binds to any `[data-logout-button="true"]` element and handles server logout + cookie cleanup |
| `auth.js` | Plain script | Reads the `__user` JWT cookie to determine auth state and show/hide `[data-auth]` elements |
| `style.css` | Stylesheet | Error states, form toggle, and field validation styles |

---

## Installation

### 1. Add the files to your project

Copy all `.js` files and `style.css` into your project's asset directory.

### 2. Load the scripts and stylesheet

Add the following to your HTML page:

```html
<!-- In <head> -->
<link rel="stylesheet" href="/path/to/style.css">
<script src="/path/to/login-form.js" defer></script>
<script src="/path/to/register-form.js" defer></script>
<script src="/path/to/logout.js" defer></script>
<script src="/path/to/auth.js" defer></script>
```

> `login-form.js` and `register-form.js` must both be loaded — they reference each other when swapping between forms.

### 3. Place the login form

Add `<login-form>` anywhere in your page body:

```html
<login-form></login-form>
```

The register form does not need to be placed manually. It is swapped in when the user clicks **Register**, and swapped back when they click **Back to Login**.

### 4. Add a logout trigger

Add `data-logout-button="true"` to any existing element:

```html
<a href="#" data-logout-button="true">Log out</a>
<button data-logout-button="true">Log out</button>
```

### 5. Show/hide elements based on auth state

Add `data-auth="in"` or `data-auth="out"` to any element to conditionally show or hide it based on the user's session:

```html
<nav data-auth="in">Welcome back!</nav>
<nav data-auth="out"><login-form></login-form></nav>
```

---

## Webflow Installation

### 1. Upload the files

Go to **Assets** in your Webflow project and upload all `.js` files and `style.css`.

### 2. Add scripts to the page

In your **Page Settings**, add the stylesheet to **Inside `<head>` tag**:

```html
<link rel="stylesheet" href="[YOUR_STYLE_CSS_ASSET_URL]">
```

And add the scripts to **Before `</body>` tag**:

```html
<script src="[YOUR_LOGIN_FORM_JS_ASSET_URL]" defer></script>
<script src="[YOUR_REGISTER_FORM_JS_ASSET_URL]" defer></script>
<script src="[YOUR_LOGOUT_JS_ASSET_URL]" defer></script>
<script src="[YOUR_AUTH_JS_ASSET_URL]" defer></script>
```

Replace the bracketed URLs with the CDN URLs provided by Webflow after uploading.

### 3. Place the login form

In the Webflow Designer, add an **HTML Embed** element and paste:

```html
<login-form></login-form>
```

### 4. Add logout and auth visibility

Apply the data attributes directly to any Webflow element via the **Custom Attributes** panel in the Designer:

| Attribute | Value | Effect |
|---|---|---|
| `data-logout-button` | `true` | Triggers logout on click |
| `data-auth` | `in` | Visible only when logged in |
| `data-auth` | `out` | Visible only when logged out |

---

## Configuration

### `login-form.js`

Update the static properties at the top of the file:

```js
static LOGIN_ENDPOINT         = "https://your-api.com/api/login";
static SEND_CODE_ENDPOINT     = "https://your-api.com/api/send-code";
static VALIDATE_CODE_ENDPOINT = "https://your-api.com/api/validate-code";
static SANCTUM_CSRF_ENDPOINT  = "https://your-api.com/sanctum/csrf-cookie";
```

### `register-form.js`

```js
static REGISTER_ENDPOINT     = "https://your-api.com/api/register/guest";
static SANCTUM_CSRF_ENDPOINT = "https://your-api.com/sanctum/csrf-cookie";
```

### `logout.js`

```js
const LOGOUT_ENDPOINT = "https://your-api.com/api/logout";
```

### Redirect targets

After a successful login or logout, the page redirects to `/` by default. Search for `window.location.href` in `login-form.js` and `logout.js` to change these targets.

---

## How It Works

### Login — Password flow

1. User enters email and password and submits.
2. The form fetches the Sanctum CSRF cookie if one isn't already valid.
3. Credentials are `POST`ed to `/api/login` with `credentials: "include"` so session cookies are exchanged automatically.
4. On success, a `__user` JWT session cookie is set client-side and the page redirects.

### Login — OTP / Code flow

1. User switches to **Login with Code** and enters their email or phone number.
2. The input is validated with regex to detect whether it is an email or phone number.
3. The identifier is `POST`ed to `/api/send-code`. On success the form advances to the OTP input step.
4. The user enters the code received and submits. This is `POST`ed to `/api/validate-code`.
5. On success, the same `__user` cookie is set and the page redirects — identical to the password flow.
6. A **Resend code** link is available on the OTP step that re-triggers the send-code request without requiring the user to go back.

### Registration

1. User fills in all fields and submits.
2. Client-side check confirms both password fields match before any API call is made.
3. The payload is `POST`ed to `/api/register/guest` with CSRF verification.
4. On success the form is replaced with an email verification prompt. No session cookie is created — the user must verify their email and log in separately.

### Logout

1. Click on any `[data-logout-button="true"]` element triggers a `POST` to `/api/logout` with `credentials: "include"`.
2. The `XSRF-TOKEN` cookie is read and sent as the `X-XSRF-TOKEN` header.
3. On completion (success or otherwise), the `__user` cookie is cleared and the page redirects to `/`.

### Auth state visibility (`auth.js`)

On page load, `auth.js` reads the `__user` cookie and attempts to parse it as a JWT. If the cookie is present and the token is not expired:
- All `[data-auth="in"]` elements are shown.
- All `[data-auth="out"]` elements are hidden.

If the cookie is absent or invalid, the reverse applies. Note that this is a client-side check only — it does not verify the JWT signature against a server secret.

### CSRF

All `POST` requests use Laravel Sanctum's CSRF cookie pattern. Before each request, the scripts check whether a valid `XSRF-TOKEN` cookie exists (using a locally stored expiry timestamp). If not, they fetch the `/sanctum/csrf-cookie` endpoint first. The token is then extracted from the cookie and sent as the `X-XSRF-TOKEN` request header. The `primed_clinic_session` cookie is attached automatically by the browser via `credentials: "include"`.

### Session cookie (`__user`)

On successful login, a `__user` cookie is set containing a signed HS256 JWT. The signing key is generated fresh using `crypto.subtle.generateKey()` with `extractable: false`, meaning it exists only in memory for that browser session. The token contains an `iat` (issued-at) timestamp and a `jti` (unique ID). The cookie expires when the browser session ends.

---

## Dependencies

No external libraries or frameworks required. The components use:

- [Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) — web component lifecycle
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — JWT generation (`crypto.subtle`, `crypto.randomUUID`)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — all HTTP requests

All are supported in all modern browsers.
