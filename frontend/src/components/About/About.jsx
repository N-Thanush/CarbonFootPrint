import "./About.css";
import { Link } from "react-router-dom";
import { FaLeaf, FaChartLine, FaShieldAlt, FaGlobe } from "react-icons/fa";

const About = () => {
  return (
    <section className="about" id="about">

      <div className="about-image">

        <img
          src="https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=700"
          alt="Nature"
        />

      </div>

      <div className="about-content">

        <span className="section-tag">
          ABOUT OUR PROJECT
        </span>

        <h2>
          Carbon Footprint Monitoring System
        </h2>

        <p>
          The Carbon Footprint Monitoring System is designed to help
          individuals and organizations understand, monitor, and reduce
          their carbon emissions. By analyzing daily activities and
          environmental data, the platform provides valuable insights
          that encourage sustainable living and responsible decision-making.
        </p>

        <div className="about-features">

          <div className="about-item">
            <FaLeaf />
            <span>Promotes Sustainable Living</span>
          </div>

          <div className="about-item">
            <FaChartLine />
            <span>Real-Time Carbon Analytics</span>
          </div>

          <div className="about-item">
            <FaShieldAlt />
            <span>Secure User Management</span>
          </div>

          <div className="about-item">
            <FaGlobe />
            <span>Supports Environmental Awareness</span>
          </div>

        </div>
        

        <Link to="/services">
          <button className="about-btn">
            Learn More &rarr;
          </button>
        </Link>

      </div>

    </section>
  );
};

export default About;