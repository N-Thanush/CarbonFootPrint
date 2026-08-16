import "./Hero.css";
import { Link } from "react-router-dom";
import { FaGlobeAsia } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa";
import { FaLeaf } from "react-icons/fa";

const Hero = () => {
  return (
    <section className="hero">

      <div className="hero-left">

        <span className="hero-tag">
          🌿 Build a Sustainable Future
        </span>

        <h1>
          Carbon Footprint
          <br />
          Monitoring System
        </h1>

        <h3>
          Track • Measure • Reduce
        </h3>

        <p>
          Monitor your daily carbon emissions, understand your
          environmental impact, and take meaningful steps toward
          a cleaner and greener future with our intelligent
          carbon tracking platform.
        </p>

        <div className="hero-buttons">
          <Link to="/register">
            <button className="primary-btn">
              Get Started
            </button>
          </Link>

          <Link to="/login">
            <button className="secondary-btn">
              Login
            </button>
          </Link>
        </div>

        <div className="hero-stats">

          <div className="stat-card">
            <FaUsers />
            <h2>10K+</h2>
            <span>Registered Users</span>
          </div>

          <div className="stat-card">
            <FaChartLine />
            <h2>95%</h2>
            <span>Accuracy</span>
          </div>

          <div className="stat-card">
            <FaLeaf />
            <h2>24/7</h2>
            <span>Monitoring</span>
          </div>

        </div>

      </div>

      <div className="hero-right">

        <FaGlobeAsia className="earth"/>

      </div>

    </section>
  );
};

export default Hero;