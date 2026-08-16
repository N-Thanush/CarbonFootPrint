import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { Link } from "react-router-dom";
import "./BenefitsPage.css";
import benefitsPageImage from "../assets/Images/benefits image 2.jpg";

import {
  FaCheckCircle,
  FaArrowRight
} from "react-icons/fa";

function BenefitsPage() {

    const benefitsPage = [

        "Reduce your daily carbon footprint",

        "Make environmentally responsible decisions",

        "Secure authentication with JWT & Spring Security",

        "Interactive dashboard with charts",

        "Promote sustainable living"

    ];

    return (

      <>
        <Navbar />
        <section className="benefitsPage">

            <div className="benefitsPage-image">

                <img
                    src={benefitsPageImage}
                    alt="BenefitsPage"
                />

            </div>

            <div className="benefitsPage-content">

                <span className="benefitsPage-tag">
                    WHY CHOOSE OUR PLATFORM
                </span>

                <h2>
                    Benefits You'll Experience
                </h2>

                <p>

                    Our Carbon Footprint Monitoring System helps users
                    understand their environmental impact through
                    intelligent tracking, secure authentication,
                    analytics and personalized recommendations.

                </p>

                <div className="benefitsPage-list">

                    {benefitsPage.map((item,index)=>(

                        <div
                            className="benefitsPage-item"
                            key={index}
                        >

                            <FaCheckCircle />

                            <span>{item}</span>

                        </div>

                    ))}

                </div>

                <Link to="/register">
                  <button className="benefitsPage-btn">
                      Start Your Journey
                      <FaArrowRight />
                  </button>
                </Link>

            </div>

        </section>
        <Footer />
      </>

    );

}

export default BenefitsPage;