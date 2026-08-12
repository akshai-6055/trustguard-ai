import { useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const [activeTab, setActiveTab] = useState("home");

  // Smooth scroll handler for anchor links
  const handleScroll = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-page">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg landing-navbar fixed-top py-3">
        <div className="container">
          {/* Brand Logo & Name */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <div className="brand-icon">
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <span className="fw-bold text-black fs-5 tracking-tight">TrustGuard AI</span>
          </Link>

          {/* Mobile Toggler */}
          <button
            className="navbar-toggler border-0 text-black shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
          >
            <i className="bi bi-list fs-2"></i>
          </button>

          {/* Nav Links & Action Buttons */}
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1">
              <li className="nav-item">
                <a
                  href="#home"
                  className={`nav-link-custom ${activeTab === "home" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleScroll("home"); }}
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#pipeline"
                  className={`nav-link-custom ${activeTab === "pipeline" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleScroll("pipeline"); }}
                >
                  Features
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#principles"
                  className={`nav-link-custom ${activeTab === "principles" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleScroll("principles"); }}
                >
                  Modules
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#why"
                  className={`nav-link-custom ${activeTab === "why" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleScroll("why"); }}
                >
                  Technology
                </a>
              </li>
            </ul>

            {/* Top Right Auth Action Buttons */}
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              <Link to="/login" className="btn-nav-outline">
                Login
              </Link>
              <Link to="/register" className="btn-nav-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section text-center position-relative">
        <div className="container position-relative z-2">
          {/* Badge */}
          <div className="d-flex justify-content-center">
            <div className="platform-badge">
              <i className="bi bi-shield-check"></i> ZERO TRUST SECURITY PLATFORM
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="hero-heading mt-4 mb-3">
            Never Trust. <span className="text-gradient-blue">Always Verify.</span>
            <br />
            Every Request.
          </h1>

          {/* Description */}
          <p className="hero-description mt-3 mb-4">
            Trust nothing. Verify everything. TrustGuard AI continuously validates every identity, device, and access request to protect organizational resources with adaptive Zero Trust security.
          </p>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4 pt-2">
            <Link to="/register" className="btn-blue-primary">
              Get Started <i className="bi bi-arrow-right"></i>
            </Link>
            <Link to="/login" className="btn-dark-outline">
              <i className="bi bi-box-arrow-in-right"></i> Login
            </Link>
          </div>

          {/* Mouse Scroll Indicator */}
          <div className="d-flex justify-content-center">
            <a
              href="#pipeline"
              className="scroll-indicator"
              onClick={(e) => { e.preventDefault(); handleScroll("pipeline"); }}
            >
              <div className="mouse-icon">
                <div className="scroll-dot"></div>
              </div>
              SCROLL TO EXPLORE
            </a>
          </div>
        </div>
      </section>

      {/* The Verification Pipeline Section */}
      <section id="pipeline" className="py-5 my-4">
        <div className="container">
          <h2 className="section-title mb-5">The Verification Pipeline</h2>

          <div className="pipeline-wrapper">
            {/* Step 1 */}
            <div className="pipeline-card">
              <div className="pipeline-icon-box">
                <i className="bi bi-box-arrow-in-right"></i>
              </div>
              <h4 className="pipeline-card-title">User Login</h4>
            </div>

            <div className="pipeline-connector"></div>

            {/* Step 2 */}
            <div className="pipeline-card">
              <div className="pipeline-icon-box">
                <i className="bi bi-person-badge"></i>
              </div>
              <h4 className="pipeline-card-title">Identity</h4>
            </div>

            <div className="pipeline-connector"></div>

            {/* Step 3 */}
            <div className="pipeline-card">
              <div className="pipeline-icon-box">
                <i className="bi bi-display"></i>
              </div>
              <h4 className="pipeline-card-title">Device</h4>
            </div>

            <div className="pipeline-connector"></div>

            {/* Step 4 */}
            <div className="pipeline-card">
              <div className="pipeline-icon-box">
                <i className="bi bi-shield-lock"></i>
              </div>
              <h4 className="pipeline-card-title">Policy</h4>
            </div>

            <div className="pipeline-connector"></div>

            {/* Step 5 (Active Highlighted Step) */}
            <div className="pipeline-card active-card">
              <div className="pipeline-icon-box">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h4 className="pipeline-card-title">Secure Access</h4>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Principles Section */}
      <section id="principles" className="py-5 my-4">
        <div className="container">
          <h2 className="section-title mb-5">The Core Principles</h2>

          <div className="row g-4">
            {/* Principle 1 */}
            <div className="col-lg-4 col-md-6">
              <div className="principle-card">
                <div className="principle-icon-wrapper">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3 className="principle-title">Never Trust</h3>
                <p className="principle-desc">Authenticate every request.</p>
              </div>
            </div>

            {/* Principle 2 */}
            <div className="col-lg-4 col-md-6">
              <div className="principle-card">
                <div className="principle-icon-wrapper">
                  <i className="bi bi-lock-fill"></i>
                </div>
                <h3 className="principle-title">Always Verify</h3>
                <p className="principle-desc">
                  Validate user identity and device before every sensitive action.
                </p>
              </div>
            </div>

            {/* Principle 3 */}
            <div className="col-lg-4 col-md-12">
              <div className="principle-card">
                <div className="principle-icon-wrapper">
                  <i className="bi bi-key-fill"></i>
                </div>
                <h3 className="principle-title">Least Privilege</h3>
                <p className="principle-desc">
                  Grant only the permissions required for the user's role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why TrustGuard AI Section */}
      <section id="why" className="py-5 my-4">
        <div className="container">
          <h2 className="section-title">Why TrustGuard AI?</h2>
          <p className="section-subtitle">
            Architected specifically for rigorous academic evaluation of modern identity access
            management paradigms.
          </p>

          <div className="row g-4 mt-2">
            <div className="col-md-6 col-lg-3">
              <div className="feature-box h-100">
                <div className="text-primary mb-3 fs-3">
                  <i className="bi bi-fingerprint"></i>
                </div>
                <h4 className="fs-5 fw-bold text-white mb-2">Identity & Auth</h4>
                <p className="text-secondary small mb-0">
                  User registration, bcrypt password hashing, and JWT token authentication.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="feature-box h-100">
                <div className="text-primary mb-3 fs-3">
                  <i className="bi bi-laptop"></i>
                </div>
                <h4 className="fs-5 fw-bold text-white mb-2">Device Trust</h4>
                <p className="text-secondary small mb-0">
                  Device fingerprinting, approval/blocking workflow, and status verification.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="feature-box h-100">
                <div className="text-primary mb-3 fs-3">
                  <i className="bi bi-sliders"></i>
                </div>
                <h4 className="fs-5 fw-bold text-white mb-2">Access Policies</h4>
                <p className="text-secondary small mb-0">
                  Department-based permissions, time-window constraints, and least privilege access.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="feature-box h-100">
                <div className="text-primary mb-3 fs-3">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <h4 className="fs-5 fw-bold text-white mb-2">Audit & Analytics</h4>
                <p className="text-secondary small mb-0">
                  Real-time session monitoring and comprehensive event logs for full compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology" className="py-5 my-4">
        <div className="container text-center">
          <h2 className="section-title mb-2">Built With Cutting-Edge Tech</h2>
          <p className="section-subtitle mb-5">Powered by industry-standard open-source technologies</p>

          <div className="d-flex flex-wrap justify-content-center gap-4">
            <div className="feature-box px-4 py-3 d-flex align-items-center gap-3">
              <i className="bi bi-code-slash text-primary fs-3"></i>
              <div className="text-start">
                <div className="fw-bold text-white">React 19 & Vite</div>
                <div className="small text-secondary">Frontend Engine</div>
              </div>
            </div>

            <div className="feature-box px-4 py-3 d-flex align-items-center gap-3">
              <i className="bi bi-server text-primary fs-3"></i>
              <div className="text-start">
                <div className="fw-bold text-white">Node.js & Express</div>
                <div className="small text-secondary">Backend REST API</div>
              </div>
            </div>

            <div className="feature-box px-4 py-3 d-flex align-items-center gap-3">
              <i className="bi bi-database text-primary fs-3"></i>
              <div className="text-start">
                <div className="fw-bold text-white">MySQL Database</div>
                <div className="small text-secondary">Relational Storage</div>
              </div>
            </div>

            <div className="feature-box px-4 py-3 d-flex align-items-center gap-3">
              <i className="bi bi-shield-check text-primary fs-3"></i>
              <div className="text-start">
                <div className="fw-bold text-white">JWT & bcrypt</div>
                <div className="small text-secondary">Security & Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="landing-footer">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
            </div>

            <div className="text-secondary small text-center text-md-start">
              &copy; 2026 TrustGuard AI Academic Project. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
