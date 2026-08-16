import './Footer.css';
import { Link } from 'react-router-dom';
import { FaLeaf, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <FaLeaf className="footer-logo-icon" />
            <span>Carbon Footprint</span>
          </div>
          <p>
            An intelligent carbon emissions tracking & sustainability management platform.
            Measure your daily impact, make informed decisions, and join the global mission towards Net-Zero.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/benefits">Benefits</Link></li>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Platform Services</h4>
            <ul>
              <li><Link to="/services">Emissions Analytics</Link></li>
              <li><Link to="/services">Identity Security</Link></li>
              <li><Link to="/services">ISO Compliance</Link></li>
              <li><Link to="/services">Admin Approval</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact & Support</h4>
            <ul>
              <li><FaEnvelope style={{ marginRight: '6px' }} /> support@carbonfootprint.org</li>
              <li>ISO 14064 Standardized</li>
              <li>Admin Verified Portal</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Carbon Footprint Monitoring System. All rights reserved.</p>
      </div>
    </footer>
  );
}
