import { useState } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <FaLeaf className="logo-icon" />
          <span>Carbon Footprint</span>
        </div>

        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <a href="/#about">About Us</a>
          </li>
          <li>
            <Link to="/services">Services</Link>
          </li>
          <li>
            <Link to="/benefits">Benefits</Link>
          </li>
          <li>
            <a href="/#contact">Contact Us</a>
          </li>
        </ul>

        <div className="nav-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {token && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.375rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                  {user.fullName || 'User'}
                </span>
              </div>

              <button
                className="login-btn"
                onClick={() => setShowLogoutModal(true)}
                style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <button className="login-btn">Login</button>
              </Link>
              <Link to="/register">
                <button className="register-btn">Register</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showLogoutModal && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.75)', position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '440px', background: '#ffffff', border: '1px solid #DFF5E1', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)', color: '#1e293b' }}>
            <div style={{ width: '60px', height: '60px', background: '#FFF3E0', borderRadius: '50%', border: '1px solid #FFE0B2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1E293B', fontWeight: 800 }}>Confirm Logout</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to log out of your session?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
                onClick={handleLogout}
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;