import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import About from "../components/About/About";
import ProblemStatement from "../components/ProblemStatement/ProblemStatement";
import Features from "../components/Features/Features";
import Footer from "../components/Footer/Footer";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <ProblemStatement />
      <Features />
      <Footer />
    </>
  );
}

export default LandingPage;