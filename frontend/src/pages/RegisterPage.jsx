import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';

const TODAY_DATE = new Date().toISOString().split('T')[0];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    designation: '',
    organization: '',
    industryType: 'Technology / IT',
    address: '',
    documentType: 'AADHAAR',
    documentFileUrl: '',
    documentFileName: '',
    profilePictureUrl: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await authApi.uploadDocument(file);
      setForm((prev) => ({
        ...prev,
        documentFileUrl: res.url,
        documentFileName: res.fileName || file.name,
      }));
    } catch (err) {
      setError('File upload failed: ' + (err.message || 'Error uploading document file'));
    } finally {
      setUploading(false);
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format';

    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Phone number must be 10 digits';

    if (!form.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else if (form.dateOfBirth > TODAY_DATE) {
      errors.dateOfBirth = 'Date of birth must be in the past';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!form.address.trim()) errors.address = 'Full address is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    window.onRegisterCaptchaSuccess = (token) => {
      setCaptchaVerified(true);
      setError('');
    };
    window.onRegisterCaptchaExpired = () => {
      setCaptchaVerified(false);
    };
  }, []);

  useEffect(() => {
    if (currentStep === 3 && window.grecaptcha) {
      try {
        window.grecaptcha.render();
      } catch (e) {
        // already rendered or handled automatically by api.js
      }
    }
  }, [currentStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaVerified) {
      setError('Please complete the Google reCAPTCHA verification before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        captchaToken: window.grecaptcha ? window.grecaptcha.getResponse() : '',
      };
      await authApi.register(payload);
      setSuccess(true);
    } catch (err) {
      if (err.data?.data && typeof err.data.data === 'object') {
        setFieldErrors(err.data.data);
      }
      setError(err.message || 'Registration failed. Please check form details.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mat-illust-page">
        <div className="mat-illust-container">
          <div className="mat-auth-card mat-success-card" style={{ margin: '0 auto', maxWidth: '600px' }}>
            <div className="mat-floating-header header-green">
              <h3>Registration Submitted Successfully</h3>
              <p>Your application is pending admin approval</p>
            </div>

            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="mat-success-icon-ring">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 style={{ color: 'white', marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                Welcome aboard, {form.fullName}!
              </h2>
              <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Your profile and identity documents have been submitted to the platform administrator.
                An activation email will be sent to <strong style={{ color: '#4ade80' }}>{form.email}</strong> upon approval.
              </p>

              <Link to="/login" className="mat-btn-gradient btn-gradient-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Return to Sign In Page &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mat-illust-page">
      {/* Top Navbar */}
      <nav className="mat-illust-navbar">
        <div className="mat-illust-nav-brand">
          <div className="mat-nav-logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <strong>Carbon Footprint</strong>
        </div>

        <div className="mat-illust-nav-links">
          <Link to="/login" className="mat-nav-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Creative Tim Material Dashboard PRO Split Illustration Layout */}
      <div className="mat-illust-container">
        {/* LEFT COLUMN: Illustration & Slogan Hero */}
        <div className="mat-illust-left">
          <div className="mat-illust-hero-card">
            <div className="mat-illust-img-wrapper">
              <img src="/carbon.png" alt="Carbon Footprint Sustainability" />
            </div>
            <div className="mat-illust-hero-content">
              <span className="mat-hero-badge">ECO SUSTAINABILITY PLATFORM</span>
              <h2>Your journey to Net-Zero Carbon Footprint begins here</h2>
              <p>Join 10,000+ eco-conscious organizations actively measuring, tracking, and reducing their environmental footprint.</p>
              <div className="mat-hero-features">
                <div className="feature-item">
                  <span className="feature-check">✓</span> Real-time Emissions Analytics
                </div>
                <div className="feature-item">
                  <span className="feature-check">✓</span> Admin Verified Identity Security
                </div>
                <div className="feature-item">
                  <span className="feature-check">✓</span> Automated ISO 14064 Compliance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Material Registration Wizard */}
        <div className="mat-illust-right">
          <div className="mat-auth-card">
            {/* Floating Header */}
            <div className="mat-floating-header header-purple">
              <h2>Create Account</h2>
              <p>Fill in your profile details to register</p>
            </div>

            {/* Stepper Navigation */}
            <div className="mat-wizard-stepper">
              <div
                className={`mat-step-tab ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                onClick={() => currentStep > 1 && setCurrentStep(1)}
              >
                <div className="mat-step-badge">{currentStep > 1 ? '✓' : '1'}</div>
                <div className="mat-step-text">
                  <strong>Personal</strong>
                  <span>User Profile</span>
                </div>
              </div>

              <div className="mat-step-line" />

              <div
                className={`mat-step-tab ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                onClick={() => currentStep > 2 && setCurrentStep(2)}
              >
                <div className="mat-step-badge">{currentStep > 2 ? '✓' : '2'}</div>
                <div className="mat-step-text">
                  <strong>Organization</strong>
                  <span>Identity & Proof</span>
                </div>
              </div>

              <div className="mat-step-line" />

              <div className={`mat-step-tab ${currentStep === 3 ? 'active' : ''}`}>
                <div className="mat-step-badge">3</div>
                <div className="mat-step-text">
                  <strong>Review</strong>
                  <span>Security & Submit</span>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="mat-wizard-body">
                <h4 className="mat-section-head">01. Personal Details & Contact Information</h4>

                <div className="mat-form-grid">
                  <div className="mat-input-group">
                    <label>Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      name="fullName"
                      className={`mat-input ${fieldErrors.fullName ? 'error' : ''}`}
                      placeholder="e.g. Rahul Sharma"
                      value={form.fullName}
                      onChange={handleChange}
                    />
                    {fieldErrors.fullName && <span className="mat-field-err">{fieldErrors.fullName}</span>}
                  </div>

                  <div className="mat-input-group">
                    <label>Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      name="email"
                      className={`mat-input ${fieldErrors.email ? 'error' : ''}`}
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {fieldErrors.email && <span className="mat-field-err">{fieldErrors.email}</span>}
                  </div>

                  <div className="mat-input-group">
                    <label>Phone Number <span className="req">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      className={`mat-input ${fieldErrors.phone ? 'error' : ''}`}
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      onChange={handleChange}
                    />
                    {fieldErrors.phone && <span className="mat-field-err">{fieldErrors.phone}</span>}
                  </div>

                  <div className="mat-input-group">
                    <label>Date of Birth <span className="req">*</span></label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      max={TODAY_DATE}
                      className={`mat-input ${fieldErrors.dateOfBirth ? 'error' : ''}`}
                      value={form.dateOfBirth}
                      onChange={handleChange}
                    />
                    {fieldErrors.dateOfBirth && <span className="mat-field-err">{fieldErrors.dateOfBirth}</span>}
                  </div>

                  <div className="mat-input-group">
                    <label>Gender</label>
                    <select name="gender" className="mat-select" value={form.gender} onChange={handleChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer Not To Say">Prefer Not To Say</option>
                    </select>
                  </div>

                  <div className="mat-input-group">
                    <label>Designation / Role Title</label>
                    <input
                      type="text"
                      name="designation"
                      className="mat-input"
                      placeholder="e.g. Sustainability Specialist"
                      value={form.designation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mat-wizard-actions">
                  <div />
                  <button type="button" className="mat-btn-gradient btn-gradient-purple" onClick={handleNext}>
                    Next: Organization & Proof &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="mat-wizard-body">
                <h4 className="mat-section-head">02. Organization & Identity Document Upload</h4>

                <div className="mat-form-grid">
                  <div className="mat-input-group">
                    <label>Organization / Company</label>
                    <input
                      type="text"
                      name="organization"
                      className="mat-input"
                      placeholder="e.g. Infosys Ltd."
                      value={form.organization}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mat-input-group">
                    <label>Industry Type</label>
                    <select name="industryType" className="mat-select" value={form.industryType} onChange={handleChange}>
                      <option value="Technology / IT">Technology / IT</option>
                      <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                      <option value="Energy & Utilities">Energy & Utilities</option>
                      <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Education & NGO">Education & NGO</option>
                      <option value="Government & Public Sector">Government & Public Sector</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mat-input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Full Address <span className="req">*</span></label>
                  <textarea
                    name="address"
                    rows="2"
                    className={`mat-input ${fieldErrors.address ? 'error' : ''}`}
                    placeholder="Street address, City, State, Pin Code"
                    value={form.address}
                    onChange={handleChange}
                  />
                  {fieldErrors.address && <span className="mat-field-err">{fieldErrors.address}</span>}
                </div>

                <div className="mat-input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Identity Document Type</label>
                  <select name="documentType" className="mat-select" value={form.documentType} onChange={handleChange}>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VOTER_ID">Voter ID Card</option>
                  </select>
                </div>

                {/* Document Upload Zone */}
                <div className="mat-input-group" style={{ marginBottom: '2rem' }}>
                  <label>Upload Identity Proof File (PDF or Image)</label>
                  <div className="mat-dropzone">
                    <input
                      type="file"
                      id="mat-doc-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    {form.documentFileName ? (
                      <div className="mat-uploaded-badge">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                        <div>
                          <strong>{form.documentFileName}</strong>
                          <span>Document uploaded & attached successfully</span>
                        </div>
                        <label htmlFor="mat-doc-input" className="mat-btn-outline">Change File</label>
                      </div>
                    ) : (
                      <label htmlFor="mat-doc-input" className="mat-dropzone-inner">
                        <div className="mat-dropzone-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <strong>{uploading ? 'Uploading File...' : 'Click to Browse & Upload Identity Proof'}</strong>
                        <span>Supported formats: PDF, JPG, PNG (Max 25MB)</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="mat-wizard-actions">
                  <button type="button" className="mat-btn-secondary" onClick={handleBack}>
                    &larr; Back
                  </button>
                  <button type="button" className="mat-btn-gradient btn-gradient-purple" onClick={handleNext}>
                    Next: Review & Submit &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="mat-wizard-body">
                <h4 className="mat-section-head">03. Review Profile Details & reCAPTCHA Verification</h4>

                <div className="mat-review-grid">
                  <div className="mat-review-card">
                    <h5>Personal Details</h5>
                    <ul>
                      <li><span>Full Name:</span> <strong>{form.fullName}</strong></li>
                      <li><span>Email Address:</span> <strong>{form.email}</strong></li>
                      <li><span>Phone Number:</span> <strong>{form.phone}</strong></li>
                      <li><span>Date of Birth:</span> <strong>{form.dateOfBirth}</strong></li>
                      <li><span>Gender:</span> <strong>{form.gender}</strong></li>
                      <li><span>Designation:</span> <strong>{form.designation || 'N/A'}</strong></li>
                    </ul>
                  </div>

                  <div className="mat-review-card">
                    <h5>Organization & Document Details</h5>
                    <ul>
                      <li><span>Organization:</span> <strong>{form.organization || 'Individual'}</strong></li>
                      <li><span>Industry:</span> <strong>{form.industryType}</strong></li>
                      <li><span>Address:</span> <strong>{form.address}</strong></li>
                      <li><span>Document Type:</span> <strong>{form.documentType}</strong></li>
                      <li><span>Document File:</span> <strong>{form.documentFileName || 'No file attached'}</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Official Google reCAPTCHA v2 Widget */}
                <div className="mat-recaptcha-wrapper" style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
                  <div
                    className="g-recaptcha"
                    data-sitekey="6LcTyHEtAAAAACYHIrgr0EaW2-2M2ntyoIjtbuwP"
                    data-callback="onRegisterCaptchaSuccess"
                    data-expired-callback="onRegisterCaptchaExpired"
                    data-theme="dark"
                  />
                </div>

                <div className="mat-wizard-actions">
                  <button type="button" className="mat-btn-secondary" onClick={handleBack}>
                    &larr; Back
                  </button>
                  <button type="submit" className="mat-btn-gradient btn-gradient-green" disabled={loading}>
                    {loading ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}

            <div className="mat-wizard-footer">
              Already have an account? <Link to="/login">Sign in here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
