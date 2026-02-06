import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const navigate = useNavigate();

  // FEATURE ANIMATION
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setFeaturesVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );

    if (featuresRef.current) observer.observe(featuresRef.current);

    return () => {
      if (featuresRef.current) observer.unobserve(featuresRef.current);
    };
  }, []);

  const scrollToSection = (ref) => {
    if (!ref.current) return;
    window.scrollTo({
      top: ref.current.offsetTop - 80,
      behavior: "smooth",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-container">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo" onClick={scrollToTop}>
          QR Attendance Pro
        </div>

        <ul className="nav-links">
          <li onClick={scrollToTop}>Home</li>
          <li onClick={() => scrollToSection(featuresRef)}>Features</li>
          <li onClick={() => scrollToSection(aboutRef)}>About</li>
          <li className="nav-btn" onClick={() => navigate("/login")}>
            Login
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1 className="hero-title">QR Attendance Pro</h1>
        <p className="hero-subtitle">
          Instant attendance tracking using QR codes
        </p>

        <div className="hero-buttons">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Student / Teacher Login
          </button>

          <button
            className="btn btn-outline"
            onClick={() => scrollToSection(featuresRef)}
          >
            View Features
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section
        ref={featuresRef}
        className={`features ${featuresVisible ? "visible" : ""}`}
      >
        <h2>Features</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>QR Attendance</h3>
            <p>Students mark attendance instantly.</p>
          </div>

          <div className="feature-card">
            <h3>Live Reports</h3>
            <p>Teachers get real-time attendance data.</p>
          </div>

          <div className="feature-card">
            <h3>Secure Login</h3>
            <p>JWT-based authentication.</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={aboutRef} className="about">
        <h2>About</h2>
        <p>
          Built for colleges to eliminate proxy attendance and save time using
          QR-based verification.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 QR Attendance Pro
      </footer>

    </div>
  );
}