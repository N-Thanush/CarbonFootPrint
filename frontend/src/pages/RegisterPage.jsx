import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';

const DOC_HINTS = {
  AADHAAR: 'Aadhaar: exactly 12 digits (e.g., 234567890123)',
  PAN: 'PAN: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)',
  VOTER_ID: 'Voter ID: 3 letters + 7 digits (e.g., ABC1234567)',
};

/**
 * Registration page — collects all user profile data, validates identity documents,
 * and submits to the Spring Boot backend.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    organization: '',
    profilePictureUrl: '',
    documentType: '',
    documentNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear field-level error when user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    setError('');
  };

  // Client-side validation
  const validate = () => {
    const errors = {};

    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format';

    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Phone must be exactly 10 digits';

    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';

    if (!form.address.trim()) errors.address = 'Address is required';

    if (!form.documentType) errors.documentType = 'Select a document type';

    if (!form.documentNumber.trim()) errors.documentNumber = 'Document number is required';
    else {
      const num = form.documentNumber.trim().toUpperCase();
      if (form.documentType === 'AADHAAR' && !/^\d{12}$/.test(num)) {
        errors.documentNumber = 'Aadhaar must be exactly 12 digits';
      } else if (form.documentType === 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(num)) {
        errors.documentNumber = 'PAN format: ABCDE1234F';
      } else if (form.documentType === 'VOTER_ID' && !/^[A-Z]{3}\d{7}$/.test(num)) {
        errors.documentNumber = 'Voter ID format: ABC1234567';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    if (!captchaVerified) {
      setError('Please complete the CAPTCHA verification before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        captchaToken: 'dev_pass', // Sent to backend for verification
      };
      const data = await authApi.register(payload);
      setSuccess(data.message || 'Registration successful! Your account is pending admin approval.');
      // Clear form on success
      setForm({
        fullName: '', email: '', password: '', phone: '',
        dateOfBirth: '', address: '', organization: '', profilePictureUrl: '',
        documentType: '', documentNumber: '',
      });
      setCaptchaVerified(false);
    } catch (err) {
      // Handle validation errors from backend (field-level)
      if (err.data && err.data.data && typeof err.data.data === 'object') {
        setFieldErrors(err.data.data);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us in tracking your carbon footprint</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Row 1: Name + Email */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-fullName">Full Name *</label>
              <input
                id="reg-fullName"
                className={`form-input ${fieldErrors.fullName ? 'error' : ''}`}
                type="text"
                name="fullName"
                placeholder="Thanush N"
                value={form.fullName}
                onChange={handleChange}
              />
              {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
          </div>

          {/* Row 2: Password + Phone */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password *</label>
              <div className="password-wrapper">
                <input
                  id="reg-password"
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number *</label>
              <input
                id="reg-phone"
                className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
              />
              {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
            </div>
          </div>

          {/* Row 3: DOB + Organization */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-dob">Date of Birth *</label>
              <input
                id="reg-dob"
                className={`form-input ${fieldErrors.dateOfBirth ? 'error' : ''}`}
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
              {fieldErrors.dateOfBirth && <span className="field-error">{fieldErrors.dateOfBirth}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-org">Organization (optional)</label>
              <input
                id="reg-org"
                className="form-input"
                type="text"
                name="organization"
                placeholder="Company / University"
                value={form.organization}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-address">Address *</label>
            <input
              id="reg-address"
              className={`form-input ${fieldErrors.address ? 'error' : ''}`}
              type="text"
              name="address"
              placeholder="City, State"
              value={form.address}
              onChange={handleChange}
            />
            {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
          </div>

          {/* Row 4: Document Type + Document Number */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-docType">Identity Document *</label>
              <select
                id="reg-docType"
                className={`form-input form-select ${fieldErrors.documentType ? 'error' : ''}`}
                name="documentType"
                value={form.documentType}
                onChange={handleChange}
              >
                <option value="">Select document type</option>
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="VOTER_ID">Voter ID</option>
              </select>
              {fieldErrors.documentType && <span className="field-error">{fieldErrors.documentType}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-docNum">Document Number *</label>
              <input
                id="reg-docNum"
                className={`form-input ${fieldErrors.documentNumber ? 'error' : ''}`}
                type="text"
                name="documentNumber"
                placeholder={form.documentType === 'PAN' ? 'ABCDE1234F' : form.documentType === 'VOTER_ID' ? 'ABC1234567' : '123456789012'}
                value={form.documentNumber}
                onChange={handleChange}
              />
              {fieldErrors.documentNumber && <span className="field-error">{fieldErrors.documentNumber}</span>}
              {form.documentType && !fieldErrors.documentNumber && (
                <div className="doc-hint">{DOC_HINTS[form.documentType]}</div>
              )}
            </div>
          </div>

          {/* reCAPTCHA Widget */}
          <div className="captcha-box">
            <label className="captcha-label">
              <input
                type="checkbox"
                className="captcha-checkbox"
                checked={captchaVerified}
                onChange={(e) => setCaptchaVerified(e.target.checked)}
              />
              <span className="captcha-checkmark"></span>
              <span className="captcha-text">I'm not a robot</span>
            </label>
            <div className="captcha-badge-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>reCAPTCHA</span>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
