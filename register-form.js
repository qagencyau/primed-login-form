class RegisterForm extends HTMLElement {
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
        <div class="form_field-error" id="password-error">Passwords do not match.</div>

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

  _bindEvents() {
    const form    = this.querySelector('#register-form-el');
    const password = this.querySelector('#register-password');
    const confirm  = this.querySelector('#register-confirm-password');
    const error    = this.querySelector('#password-error');
    const backBtn  = this.querySelector('#back-to-login');

    // Hide error initially
    error.style.display = 'none';

    // Clear error as user re-types
    confirm.addEventListener('input', () => {
      if (error.style.display === 'block') {
        error.style.display = 'none';
        confirm.classList.remove('is-error');
        password.classList.remove('is-error');
      }
    });

    // Validate on submit
    form.addEventListener('submit', (e) => {
      if (password.value !== confirm.value) {
        e.preventDefault();
        error.style.display = 'block';
        confirm.classList.add('is-error');
        password.classList.add('is-error');
        confirm.focus();
      }
    });

    // Swap back to login
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const loginForm = document.createElement('login-form');
      this.replaceWith(loginForm);
    });
  }
}

customElements.define('register-form', RegisterForm);