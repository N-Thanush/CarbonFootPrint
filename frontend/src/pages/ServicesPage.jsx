import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { Link } from "react-router-dom";
import "./ServicesPage.css";

import {
  FaChartLine,
  FaUsersCog,
  FaEnvelopeOpenText,
  FaArrowRight,
  FaLock,
  FaSeedling,
  FaChartPie,
  FaUserCheck,
  FaSignInAlt,
  FaKey,
  FaTachometerAlt
} from "react-icons/fa";

import servicesHeroImage from "../assets/Images/services-hero.jpg";

function ServicesPage() {

  const servicesPage = [

    {
      icon: <FaChartLine />,
      title: "Carbon Emission Analysis",
      description:
        "Track, calculate and visualize your carbon footprint with intelligent monitoring."
    },

    {
      icon: <FaUsersCog />,
      title: "User Registration",
      description:
        "Secure registration with document upload and manual admin approval."
    },

    {
      icon: <FaEnvelopeOpenText />,
      title: "Email Notification",
      description:
        "Automatic email delivery for account approval and login credentials."
    },

    {
      icon: <FaLock />,
      title: "Secure Authentication",
      description:
        "JWT authentication with Spring Security and BCrypt encrypted passwords."
    },

    {
      icon: <FaChartPie />,
      title: "Analytics Dashboard",
      description:
        "Interactive graphs, reports and statistics to monitor environmental impact."
    },

    {
      icon: <FaSeedling />,
      title: "Green Recommendations",
      description:
        "Receive smart suggestions to reduce emissions and promote sustainability."
    }

  ];

  return (

    <>

      <Navbar />

      {/* ================= HERO ================= */}

      <section className="servicesHero">

        <div className="servicesHero-left">

          <span className="services-tag">
            OUR PROFESSIONAL SERVICES
          </span>

          <h1>
            Smart Carbon <br />
            Monitoring Services
          </h1>

          <p>
            Our Carbon Footprint Monitoring System provides secure,
            intelligent and real-time solutions that help individuals
            and organizations understand, monitor and reduce their
            environmental impact.
          </p>

          <div className="services-buttons">

            <button className="primaryServiceBtn">
              Explore Services
            </button>

            <button className="secondaryServiceBtn">
              Contact Us
            </button>

          </div>

        </div>

        <div className="servicesHero-right">

          <img
            src={servicesHeroImage}
            alt="Carbon Monitoring"
          />

        </div>

      </section>

      {/* ================= SERVICES ================= */}

      <section className="servicesPage">

        <div className="servicesPage-heading">

          <span>OUR SERVICES</span>

          <h2>Smart Solutions for a Sustainable Future</h2>

          <p>
            Explore our intelligent services designed to simplify carbon
            emission monitoring while maintaining security and efficiency.
          </p>

        </div>

        <div className="servicesPage-grid">

          {servicesPage.map((service, index) => (

            <div className="servicesPage-card" key={index}>

              <div className="servicesPage-icon">

                {service.icon}

              </div>

              <h3>{service.title}</h3>

              <p>{service.description}</p>

              <button>

                Learn More

                <FaArrowRight />

              </button>

            </div>

          ))}

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section className="workflowSection">

        <div className="workflowHeading">

          <span>HOW IT WORKS</span>

          <h2>Simple & Secure Workflow</h2>

          <p>

            Our system follows a secure registration and approval process
            before granting dashboard access.

          </p>

        </div>

        <div className="workflowGrid">

          <div className="workflowCard">

            <FaUsersCog />

            <h3>Register</h3>

            <p>Create your account and upload required documents.</p>

          </div>

          <div className="workflowCard">

            <FaUserCheck />

            <h3>Admin Approval</h3>

            <p>Your registration request is reviewed by the administrator.</p>

          </div>

          <div className="workflowCard">

            <FaEnvelopeOpenText />

            <h3>Email Credentials</h3>

            <p>Approved users receive temporary login credentials.</p>

          </div>

          <div className="workflowCard">

            <FaSignInAlt />

            <h3>First Login</h3>

            <p>Login using the temporary username and password.</p>

          </div>

          <div className="workflowCard">

            <FaKey />

            <h3>Reset Password</h3>

            <p>Create your secure password during the first login.</p>

          </div>

          <div className="workflowCard">

            <FaTachometerAlt />

            <h3>Dashboard Access</h3>

            <p>Access reports, analytics and monitor carbon emissions.</p>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="serviceCTA">

        <h2>

          Ready to Build a Greener Future?

        </h2>

        <p>

          Join thousands of users who are taking the first step toward
          reducing carbon emissions and creating a sustainable future.

        </p>

        <Link to="/register">
          <button style={{ cursor: 'pointer' }}>
            Get Started
          </button>
        </Link>

      </section>

      <Footer />
    </>
  );
}

export default ServicesPage;