import { useState } from "react";

const countries = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "United Arab Emirates",
  "Saudi Arabia",
  "India",
  "Vietnam",
  "Thailand",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "Brazil",
  "Mexico",
  "Australia",
  "China",
  "Other",
];

const initialValues = {
  name: "",
  email: "",
  phone: "",
  country: "",
  countryOther: "",
  projectDetails: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s().-]{6,}$/;

export default function InquiryForm({ onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const validate = (nextValues = values) => {
    const nextErrors = {};

    if (!nextValues.name.trim()) nextErrors.name = "Please enter your name.";
    if (!nextValues.email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!emailPattern.test(nextValues.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!nextValues.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (!phonePattern.test(nextValues.phone.trim())) {
      nextErrors.phone = "Use an international phone format, for example +86 189 9881 8260.";
    }
    if (!nextValues.projectDetails.trim()) {
      nextErrors.projectDetails = "Please describe your project details.";
    }
    if (nextValues.country === "Other" && !nextValues.countryOther.trim()) {
      nextErrors.countryOther = "Please enter your country or region.";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    setErrors(validate(nextValues));
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setStatus({
        type: "error",
        message: "Please complete the required fields before submitting your inquiry.",
      });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "success", message: "Submitting your inquiry..." });

    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      setStatus({
        type: "success",
        message: "Inquiry submitted successfully. Our sales team will contact you soon.",
      });
      setValues(initialValues);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Submission failed. Please try again or email info@mokasfx.com.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
      {status.message ? (
        <div className={`form-feedback is-visible is-${status.type}`} role="status" aria-live="polite">
          {status.message}
        </div>
      ) : null}

      <div className="inquiry-field row-2">
        <div className="field-control">
          <label htmlFor="inquiry-name">Name <span className="required" aria-hidden="true">*</span></label>
          <input id="inquiry-name" name="name" value={values.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" aria-invalid={Boolean(errors.name)} required />
          <p className="field-error">{errors.name}</p>
        </div>

        <div className="field-control">
          <label htmlFor="inquiry-email">Email <span className="required" aria-hidden="true">*</span></label>
          <input id="inquiry-email" name="email" type="email" value={values.email} onChange={handleChange} placeholder="name@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} required />
          <p className="field-error">{errors.email}</p>
        </div>
      </div>

      <div className="inquiry-field row-2">
        <div className="field-control">
          <label htmlFor="inquiry-phone">Phone <span className="required" aria-hidden="true">*</span></label>
          <input id="inquiry-phone" name="phone" type="tel" value={values.phone} onChange={handleChange} placeholder="+1 312 847 1928" autoComplete="tel" aria-invalid={Boolean(errors.phone)} required />
          <p className="field-error">{errors.phone}</p>
        </div>

        <div className="field-control">
          <label htmlFor="inquiry-country">Country / Region</label>
          <select id="inquiry-country" name="country" value={values.country} onChange={handleChange} autoComplete="country-name">
            <option value="">Select country / region</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          <p className="field-error">{errors.country}</p>
        </div>
      </div>

      {values.country === "Other" ? (
        <div className="inquiry-field other-country-field">
          <label htmlFor="inquiry-country-other">Other Country / Region <span className="required" aria-hidden="true">*</span></label>
          <input id="inquiry-country-other" name="countryOther" value={values.countryOther} onChange={handleChange} placeholder="Please enter your country or region" autoComplete="country-name" aria-invalid={Boolean(errors.countryOther)} required />
          <p className="field-error">{errors.countryOther}</p>
        </div>
      ) : null}

      <div className="inquiry-field">
        <label htmlFor="inquiry-details">Project Details <span className="required" aria-hidden="true">*</span></label>
        <textarea id="inquiry-details" name="projectDetails" rows={6} value={values.projectDetails} onChange={handleChange} placeholder="Tell us the product type, quantity, event date, venue size or special requirements." aria-invalid={Boolean(errors.projectDetails)} required />
        <p className="field-error">{errors.projectDetails}</p>
      </div>

      <div className="form-submit-row">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Send Inquiry"}
        </button>
        <p>Required fields are marked with <span className="required" aria-hidden="true">*</span>.</p>
      </div>
    </form>
  );
}
