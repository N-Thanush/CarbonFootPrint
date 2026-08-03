import "./Features.css";

import {
  FaChartLine,
  FaShieldAlt,
  FaUsers,
  FaGlobe,
  FaEnvelope,
  FaLeaf
} from "react-icons/fa";

function Features() {

    const features = [

        {
            icon: <FaChartLine />,
            title: "Carbon Tracking",
            description:
            "Monitor daily carbon emissions with intelligent calculations."
        },

        {
            icon: <FaShieldAlt />,
            title: "Secure Authentication",
            description:
            "Spring Security, JWT and BCrypt keep your data protected."
        },

        {
            icon: <FaUsers />,
            title: "User Dashboard",
            description:
            "View your profile, activities and environmental statistics."
        },

        {
            icon: <FaLeaf />,
            title: "Eco Recommendations",
            description:
            "Receive suggestions to reduce your carbon footprint."
        },

        {
            icon: <FaGlobe />,
            title: "Analytics",
            description:
            "Interactive charts and reports for better decision making."
        },

        {
            icon: <FaEnvelope />,
            title: "Email Notifications",
            description:
            "Receive approval status and login credentials securely."
        }

    ];

    return (

        <section className="features" id="features">

            <div className="features-heading">

                <span>OUR FEATURES</span>

                <h2>
                    Powerful Features for a Greener Tomorrow
                </h2>

                <p>
                    Our platform combines modern technology with
                    environmental awareness to help users monitor,
                    analyze and reduce carbon emissions effectively.
                </p>

            </div>

            <div className="features-grid">

                {features.map((feature,index)=>(
                    <div className="feature-card" key={index}>

                        <div className="feature-icon">
                            {feature.icon}
                        </div>

                        <h3>{feature.title}</h3>

                        <p>{feature.description}</p>

                    </div>
                ))}

            </div>

        </section>

    );

}

export default Features;