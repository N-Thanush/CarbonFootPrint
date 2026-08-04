import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request reset email flow
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword({ email });
      setSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Perform password reset via token flow
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token: resetToken, newPassword });
      setSuccess(res.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mat-illust-page">
      {/* Top Navbar */}
      <nav className="mat-illust-navbar">
        <div className="mat-illust-nav-brand">
          <div className="mat-nav-logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <strong>Thanush - Carbon Footprint Platform</strong>
        </div>

        <div className="mat-illust-nav-links">
          <Link to="/" className="mat-nav-pill">
            &larr; Home
          </Link>
          <Link to="/login" className="mat-nav-pill">
            Sign In &rarr;
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="mat-auth-page">
        <div className="mat-auth-card" style={{ maxWidth: '480px' }}>
          {/* Floating Header Banner */}
          <div className="mat-floating-header header-green">
            <h2>{resetToken ? 'Reset Password' : 'Forgot Password?'}</h2>
            <p>
              {resetToken
                ? 'Create a new secure password for your account'
                : 'Enter your registered email address to receive a reset link'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {!resetToken ? (
            <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="mat-input-group">
                <label htmlFor="reset-email">Email Address <span className="req">*</span></label>
                <input
                  id="reset-email"
                  type="email"
                  className="mat-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="mat-btn-gradient btn-gradient-green" style={{ width: '100%', padding: '0.875rem' }} disabled={loading}>
                {loading ? 'Sending Reset Link...' : 'Send Reset Link →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="mat-input-group">
                <label htmlFor="new-password">New Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showNewPass ? 'text' : 'password'}
                    className="mat-input"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPass ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="mat-input-group">
                <label htmlFor="confirm-password">Confirm New Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm-password"
                    type={showConfirmPass ? 'text' : 'password'}
                    className="mat-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showConfirmPass ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button type="submit" className="mat-btn-gradient btn-gradient-green" style={{ width: '100%', padding: '0.875rem' }} disabled={loading}>
                {loading ? 'Resetting Password...' : 'Confirm Reset Password →'}
              </button>
            </form>
          )}

          <div className="mat-wizard-footer" style={{ marginTop: '1.5rem' }}>
            <p>Remembered your password? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
