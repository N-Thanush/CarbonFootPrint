import "./Navbar.css";
import { Link } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";

function Navbar() {
  return (
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

      <div className="nav-buttons">
        <Link to="/login">
          <button className="login-btn">Login</button>
        </Link>

        <Link to="/register">
          <button className="register-btn">Register</button>
        </Link>
      </div>

    </nav>
  );
}

export default Navbar;