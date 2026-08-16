import "./ProblemStatement.css";
import {
  FaSmog,
  FaTree,
  FaTemperatureHigh,
  FaIndustry,
  FaChartLine,
  FaLeaf,
  FaShieldAlt,
  FaGlobe
} from "react-icons/fa";

function ProblemStatement() {
  return (
    <section className="problem-section">

      <div className="problem-heading">

        <span className="problem-tag">
          PROBLEM STATEMENT
        </span>

        <h2>
          Why Carbon Footprint Monitoring Matters?
        </h2>

        <p>
          Climate change and rising carbon emissions have become one of
          the biggest global challenges. Monitoring emissions helps
          individuals and organizations make informed decisions for a
          sustainable future.
        </p>

      </div>

      <div className="problem-container">

        {/* Left Side */}

        <div className="problem-card">

          <h3>Current Challenges</h3>

          <div className="problem-item">
            <FaSmog />
            <span>Air Pollution</span>
          </div>

          <div className="problem-item">
            <FaTemperatureHigh />
            <span>Global Warming</span>
          </div>

          <div className="problem-item">
            <FaTree />
            <span>Deforestation</span>
          </div>

          <div className="problem-item">
            <FaIndustry />
            <span>Industrial Carbon Emissions</span>
          </div>

        </div>

        {/* Right Side */}

        <div className="solution-card">

          <h3>Our Solution</h3>

          <div className="solution-item">
            <FaChartLine />
            <span>Real-Time Carbon Analytics</span>
          </div>

          <div className="solution-item">
            <FaLeaf />
            <span>Eco-Friendly Recommendations</span>
          </div>

          <div className="solution-item">
            <FaShieldAlt />
            <span>Secure User Management</span>
          </div>

          <div className="solution-item">
            <FaGlobe />
            <span>Environmental Awareness</span>
          </div>

        </div>

      </div>

    </section>
  );
}

export default ProblemStatement;