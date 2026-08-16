import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const token = localStorage.getItem('token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('You must be logged in to change your password.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(token, {
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      // Update stored user state
      if (user) {
        localStorage.setItem('user', JSON.stringify({ ...user, mustChangePassword: false }));
      }

      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessPopup(false);
    if (user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="mat-illust-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav className="mat-illust-navbar">
        <div className="mat-illust-nav-brand">
          <div className="mat-nav-logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <strong>Carbon Footprint Platform</strong>
        </div>

        <div className="mat-illust-nav-links">
          <Link to="/" className="mat-nav-pill">
            &larr; Home
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="mat-auth-card" style={{ width: '100%', maxWidth: '480px', background: '#ffffff', border: '1px solid #DFF5E1', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#2E7D32' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', color: '#1B5E20', fontWeight: 800 }}>Create New Password</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Please enter your new password and re-enter it to confirm.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="mat-input-group">
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Enter New Password <span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="mat-input"
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter new password (min 6 characters)"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="mat-input-group">
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Re-enter New Password <span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="mat-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label="Toggle confirm password visibility"
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mat-btn-gradient btn-gradient-green"
              style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '0.9375rem' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Submit & Update Password →'}
            </button>
          </form>
        </div>
      </div>

      {/* ===== SUCCESS POPUP MODAL ===== */}
      {showSuccessPopup && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.75)', position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '440px', background: '#ffffff', border: '1px solid #DFF5E1', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 10px 25px rgba(46, 125, 50, 0.3)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', color: '#1B5E20', fontWeight: 800 }}>Password Changed Successfully!</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Your account password has been successfully updated. You can now use your new password to log in anytime.
            </p>
            <button
              className="mat-btn-gradient btn-gradient-green"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 700 }}
              onClick={handleSuccessOk}
            >
              OK / Continue to Dashboard &rarr;
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION (TOP-RIGHT) */}
      {(success || error) && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderLeft: success ? '4px solid #10B981' : '4px solid #EF4444',
            color: '#F8FAFC',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 9999,
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {success ? `✓ ${success}` : `✕ ${error}`}
          </span>
          <button
            onClick={() => { setSuccess(''); setError(''); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0 0 0 0.5rem',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
