import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Registration page component for creating new user accounts
const Register = () => {
  // Form field states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Message states for user feedback
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullNameError, setFullNameError] = useState("");
  const fullNameRef = useRef(null);

  // Get register function from authentication context and navigation hook
  const { register } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // HELPER FUNCTION: Calculate password strength
  // ============================================
  // Evaluates password strength based on length:
  // - Empty: 0% (secondary)
  // - < 6 chars: Weak (33%, danger/red)
  // - < 10 chars: Medium (66%, warning/yellow)  
  // - >= 10 chars: Strong (100%, primary/blue)
  const getPasswordStrength = () => {
    if (!password) return { label: "", width: "0%", color: "bg-secondary" };
    if (password.length < 6) return { label: "Weak", width: "33%", color: "bg-danger" };
    if (password.length < 10) return { label: "Medium", width: "66%", color: "bg-warning" };
    return { label: "Strong", width: "100%", color: "bg-primary" };
  };

  const strength = getPasswordStrength();

  const fullNameRegex = /^[A-Za-z ]+$/;

  const validateFullName = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setFullNameError("Full name is required.");
      return false;
    }

    if (!fullNameRegex.test(trimmedValue)) {
      setFullNameError("Full name can only contain letters and spaces.");
      return false;
    }

    setFullNameError("");
    return true;
  };

  // ============================================
  // FORM SUBMISSION HANDLER
  // ============================================
  // Handles account creation form submission
  // Validates passwords match, terms accepted, then calls register API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateFullName(fullName)) {
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    const userData = {
      full_name: fullName,
      email,
      password,
      role_id: department === "Admin" ? 1 : 2 // Map role to DB role_id
    };

    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex justify-content-center align-items-center px-3 py-5 font-sans">
      <div className="w-100 rounded-4 shadow-lg border border-light-subtle overflow-hidden bg-white" style={{ maxWidth: "1100px" }}>
        <div className="row g-0">
          <div
            className="col-lg-6 d-none d-lg-flex flex-column justify-content-center p-5 text-white position-relative"
            style={{ background: "linear-gradient(135deg, #0d47a1 0%, #0047ab 50%, #1d4ed8 100%)" }}
          >
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ background: "radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 38%)" }}
            />
            <div className="position-relative">
              {/* Main shield lock icon - explicitly styled to be white and properly sized */}

              {/* Main heading for the left panel */}
              <h1 className="fw-bold fs-2 mb-3 text-white">Join the Zero Trust Revolution</h1>
              {/* Subheading description */}
              <p className="opacity-90 small mb-4 text-white">
                Secure your enterprise with AI-driven visibility, seamless access control, and intelligent risk detection.
              </p>

              {/* Feature list with icons - vertically stacked features */}
              <div className="d-grid gap-3">
                {/* Feature 1: Identity Verification with shield icon */}
                <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-3 px-3 py-2">
                  <i className="bi bi-shield-check text-white" style={{ fontSize: "1.25rem" }}></i>
                  <span className="small text-white">Identity Verification</span>
                </div>
                {/* Feature 2: Trusted Devices with monitor icon */}
                <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-3 px-3 py-2">
                  <i className="bi bi-pc-display text-white" style={{ fontSize: "1.25rem" }}></i>
                  <span className="small text-white">Trusted Devices</span>
                </div>
                {/* Feature 3: Policy-Based Access with graph icon */}
                <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-3 px-3 py-2">
                  <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: "1.25rem" }}></i>
                  <span className="small text-white">Policy-Based Access</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 d-flex flex-column justify-content-center p-4 p-md-5 bg-white">
            <div className="mx-auto w-100" style={{ maxWidth: "460px" }}>
              {/* Brand logo section - links to home page */}
              <div className="mb-4">
                <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2">
                  {/* Logo background box with shield icon */}
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ background: "#eef4ff", color: "#0047ab" }}
                  >
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: "1.5rem" }}></i>
                  </div>
                  {/* Brand name text */}
                  <span className="fw-bold text-dark fs-5">TrustGuard AI</span>
                </Link>
              </div>

              {/* Page heading */}
              <h2 className="fw-bold text-dark fs-3 mb-1">Create Your Account</h2>
              {/* Page subheading */}
              <p className="text-secondary small mb-4">Start your secure journey with enterprise-grade protection.</p>

              {/* Error message alert - displays only if errorMessage is set */}
              {errorMessage && (
                <div className="alert alert-danger rounded-3 small py-2 mb-3" role="alert">
                  {errorMessage}
                </div>
              )}

              {/* Success message alert - displays only if successMessage is set */}
              {successMessage && (
                <div className="alert alert-success rounded-3 small py-2 mb-3" role="alert">
                  {successMessage}
                </div>
              )}

              {/* Registration form */}
              <form onSubmit={handleSubmit}>
                {/* Full Name input field */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Full Name</label>
                  {/* Input group with person icon on left */}
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      {/* Person icon for name field */}
                      <i className="bi bi-person-fill"></i>
                    </span>
                    <input
                      type="text"
                      ref={fullNameRef}
                      className="form-control form-control-lg bg-light border-start-0 fs-6"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fullNameError) {
                          validateFullName(e.target.value);
                        }
                      }}
                      onBlur={(e) => validateFullName(e.target.value)}
                      required
                    />
                  </div>
                  {fullNameError && (
                    <div className="text-danger small mt-1">{fullNameError}</div>
                  )}
                </div>

                {/* Work Email input field */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Work Email Address</label>
                  {/* Input group with envelope icon */}
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      {/* Envelope icon for email field */}
                      <i className="bi bi-envelope-fill"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-lg bg-light border-start-0 fs-6"
                      placeholder="john@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => {
                        if (!validateFullName(fullName)) {
                          fullNameRef.current?.focus();
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Department / Role dropdown field */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Department / Role</label>
                  {/* Input group with building icon */}
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      {/* Building icon for department field */}
                      <i className="bi bi-building-fill"></i>
                    </span>
                    <select
                      className="form-select form-select-lg bg-light border-start-0 fs-6"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select department</option>
                      <option value="Admin">Admin</option>
                      <option value="Security">Employee</option>
                    </select>
                  </div>
                </div>

                {/* Password and Confirm Password fields */}
<div className="row g-2 mb-2">

  {/* Password */}
  <div className="col-6">
    <label className="form-label small fw-semibold text-dark">
      Password
    </label>

    <div className="input-group">
      <span className="input-group-text bg-light border-end-0 text-muted">
        <i className="bi bi-lock-fill"></i>
      </span>

      <input
        type={showPassword ? "text" : "password"}
        className="form-control form-control-lg bg-light border-start-0 border-end-0 fs-6"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="button"
        className="input-group-text bg-light border-start-0 text-muted"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        <i
          className={
            showPassword
              ? "bi bi-eye-slash-fill"
              : "bi bi-eye-fill"
          }
        ></i>
      </button>
    </div>
  </div>

  {/* Confirm Password */}
  <div className="col-6">
    <label className="form-label small fw-semibold text-dark">
      Confirm Password
    </label>

    <div className="input-group">
      <span className="input-group-text bg-light border-end-0 text-muted">
        <i className="bi bi-lock-fill"></i>
      </span>

      <input
        type={showConfirmPassword ? "text" : "password"}
        className="form-control form-control-lg bg-light border-start-0 border-end-0 fs-6"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <button
        type="button"
        className="input-group-text bg-light border-start-0 text-muted"
        onClick={() => setShowConfirmPassword((prev) => !prev)}
        aria-label={
          showConfirmPassword
            ? "Hide confirm password"
            : "Show confirm password"
        }
      >
        <i
          className={
            showConfirmPassword
              ? "bi bi-eye-slash-fill"
              : "bi bi-eye-fill"
          }
        ></i>
      </button>
    </div>
  </div>

</div>

                {/* Terms and Conditions checkbox */}
                <div className="form-check mb-4 mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <label className="form-check-label small text-secondary" htmlFor="agreeTerms">
                    I agree to the <a href="#terms" className="text-decoration-none text-primary">Terms of Service</a> and{" "}
                    <a href="#privacy" className="text-decoration-none text-primary">Privacy Policy</a>.
                  </label>
                </div>

                {/* Submit button with loading state */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-lg w-100 rounded-3 fw-semibold text-white shadow-sm fs-6 d-flex align-items-center justify-content-center gap-2"
                  style={{ background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
                >
                  {loading ? (
                    <>
                      {/* Spinner icon displayed while account is being created */}
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      {/* Person plus icon on button */}
                      <i className="bi bi-person-plus-fill"></i> Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Login link section - directs users who already have an account to login page */}
              <div className="text-center mt-4">
                <span className="text-muted small me-1">Already have an account?</span>
                <Link to="/login" className="fw-semibold small text-decoration-none" style={{ color: "#0047ab" }}>
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
