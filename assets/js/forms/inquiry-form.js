/* Shared inquiry form validation and prototype submission feedback. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    // TODO: replace mock submission with Fluent Forms / server-side submission.
      const inquiryForms = Array.from(document.querySelectorAll('[data-inquiry-form]'));
      if (inquiryForms.length) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^\+?[0-9][0-9\s().-]{6,}$/;

        const setFeedback = (form, type, message) => {
          const feedback = form.querySelector('[data-form-feedback]');
          if (!feedback) return;
          feedback.textContent = message;
          feedback.classList.remove('is-success', 'is-error');
          feedback.classList.add('is-visible', type === 'success' ? 'is-success' : 'is-error');
        };

        const clearFeedback = (form) => {
          const feedback = form.querySelector('[data-form-feedback]');
          if (!feedback) return;
          feedback.textContent = '';
          feedback.classList.remove('is-visible', 'is-success', 'is-error');
        };

        const setFieldError = (field, message) => {
          const form = field.form;
          const error = form && form.querySelector(`[data-error-for="${field.name}"]`);
          field.classList.toggle('is-invalid', Boolean(message));
          field.setAttribute('aria-invalid', message ? 'true' : 'false');
          if (error) {
            error.textContent = message;
            if (!error.id && field.id) error.id = `${field.id}-error`;
            if (message && error.id) field.setAttribute('aria-describedby', error.id);
            if (!message) field.removeAttribute('aria-describedby');
          }
        };

        const validateField = (field) => {
          const value = field.value.trim();
          let message = '';
          if (field.required && !value) {
            message = field.dataset.errorRequired || 'Please complete this field.';
          } else if (field.type === 'email' && value && !emailPattern.test(value)) {
            message = field.dataset.errorFormat || 'Please enter a valid email address.';
          } else if (field.type === 'tel' && value && !phonePattern.test(value)) {
            message = field.dataset.errorFormat || 'Please enter a valid phone number.';
          }
          setFieldError(field, message);
          return !message;
        };

        inquiryForms.forEach((form) => {
          const fields = Array.from(form.querySelectorAll('input, select, textarea'));
          const countrySelect = form.querySelector('select[name="country"]');
          const otherCountryField = form.querySelector('[data-other-country-field]');
          const otherCountryInput = form.querySelector('input[name="countryOther"]');
          const submitButton = form.querySelector('button[type="submit"]');
          const submitLabel = submitButton ? (submitButton.dataset.submitLabel || submitButton.textContent) : '';
          const updateOtherCountry = () => {
            if (!countrySelect || !otherCountryField || !otherCountryInput) return;
            const showOther = countrySelect.value === 'Other';
            otherCountryField.hidden = !showOther;
            otherCountryInput.required = showOther;
            if (!showOther) {
              otherCountryInput.value = '';
              setFieldError(otherCountryInput, '');
            }
          };

          fields.forEach((field) => {
            field.addEventListener('input', () => {
              validateField(field);
              clearFeedback(form);
            });
            field.addEventListener('blur', () => validateField(field));
          });
          if (countrySelect) {
            countrySelect.addEventListener('change', () => {
              updateOtherCountry();
              clearFeedback(form);
            });
            updateOtherCountry();
          }

          form.addEventListener('submit', (event) => {
            event.preventDefault();
            updateOtherCountry();
            const validFields = fields.map(validateField);
            const isValid = validFields.every(Boolean);
            const firstInvalid = fields.find((field) => field.classList.contains('is-invalid'));

            if (!isValid) {
              setFeedback(form, 'error', 'Please complete the required fields before submitting your inquiry.');
              if (firstInvalid) firstInvalid.focus();
              return;
            }

            if (submitButton) {
              submitButton.disabled = true;
              submitButton.textContent = 'Submitting...';
            }
            setFeedback(form, 'success', 'Submitting your inquiry...');

            window.setTimeout(() => {
              setFeedback(form, 'success', 'Inquiry submitted successfully. Our sales team will contact you soon.');
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitLabel;
              }
              form.reset();
              updateOtherCountry();
              fields.forEach((field) => setFieldError(field, ''));
            }, 500);
          });
        });
      }
  });
})();

