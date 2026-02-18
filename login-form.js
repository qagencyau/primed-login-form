class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <form
        name="wf-form-Log-in-Form-14"
        method="get"
        class="sign-up-login_header_form"
        aria-label="Log in Form 14"
      >
        <!-- Email -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Email</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Email"
            placeholder=""
            type="email"
            required
          />
        </div>

        <!-- Password -->
        <div class="form_field-wrapper">
          <div class="field-label-wrapper">
            <div class="form_field-label">Password</div>
            <a href="#" class="text-style-link">Reset your password</a>
          </div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Password"
            placeholder=""
            type="password"
            required
          />
        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            value="Login"
          />

          <div class="button-group is-center">
            <a href="/client-onboarding" class="button-glide-over w-inline-block">
              <span class="button-glide-over__container">
                <span class="button-glide-over__icon is-first">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
                <span class="button-glide-over__text">Register</span>
                <span class="button-glide-over__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
              </span>
              <div class="button-glide-over__background"></div>
            </a>
          </div>
        </div>
      </form>
    `;
  }
}

customElements.define('login-form', LoginForm);