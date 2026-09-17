import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) return;

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const result = await adminLogin(cleanEmail, password);
    setLoading(false);

    if (result.success) {
      navigate("/admin/dashboard");
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center px-3 py-5 font-sans" style={{ backgroundColor: "#0b1120" }}>
      <div className="w-100 rounded-4 shadow-lg p-4 p-md-5" style={{ maxWidth: "440px", backgroundColor: "#111827", border: "1px solid #1f2937" }}>
        <div className="mb-4 text-center">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
            <i className="bi bi-shield-lock-fill text-white fs-2"></i>
          </div>
          <h2 className="fw-bold text-white fs-4 mb-1">Admin Portal</h2>
          <p className="text-secondary small">TrustGuard AI Security Administration</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger rounded-3 small py-2 mb-4 bg-transparent border-danger text-danger d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-light">Administrator Email</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <i className="bi bi-envelope-fill"></i>
              </span>
              <input
                type="email"
                className="form-control form-control-lg bg-dark border-secondary text-light fs-6 focus-ring focus-ring-primary"
                placeholder="admin@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-light mb-1">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <i className="bi bi-lock-fill"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-lg bg-dark border-secondary border-end-0 text-light fs-6 focus-ring focus-ring-primary"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-group-text bg-dark border-secondary border-start-0 text-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-100 rounded-3 fw-semibold text-white shadow-sm fs-6 d-flex align-items-center justify-content-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Authenticating...
              </>
            ) : (
              <>
                Secure Login <i className="bi bi-arrow-right-short fs-4 lh-1"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-5 pt-3 border-top border-secondary">
          <Link to="/" className="text-secondary small text-decoration-none hover-white d-inline-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i> Return to main site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
