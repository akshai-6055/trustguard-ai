import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const userRole = result.user?.role_id;
      const userRoleName = result.user?.role_name?.toLowerCase();

      if (userRole === 1 || userRoleName === "admin" || userRoleName === "administrator") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      setErrorMessage(result.message);
    }
  };


  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white px-3 py-5 font-sans">
      <div className="w-100 rounded-4 shadow-sm border border-light-subtle p-4 p-md-5 bg-white" style={{ maxWidth: "440px" }}>
        <div className="mb-4">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2">
            <div
              className="rounded-3 p-2 d-flex align-items-center justify-content-center"
              style={{ background: "#eef4ff", color: "#0047ab" }}
            >
              <i className="bi bi-shield-lock-fill fs-4"></i>
            </div>
            <span className="fw-bold text-dark fs-5">TrustGuard AI</span>
          </Link>
        </div>

        <h2 className="fw-bold text-dark fs-3 mb-1">Welcome Back</h2>
        <p className="text-secondary small mb-4">Access your secure enterprise dashboard.</p>

        {errorMessage && (
          <div className="alert alert-danger rounded-3 small py-2 mb-3" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-envelope-fill"></i>
              </span>
              <input
                type="email"
                className="form-control form-control-lg bg-light border-start-0 fs-6"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">Password</label>
              <a href="#forgot" className="small fw-semibold text-decoration-none" style={{ color: "#0047ab" }}>
                Forgot Password?
              </a>
            </div>
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
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
              </button>
            </div>
          </div>

          <div className="form-check mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="rememberDevice"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <label className="form-check-label small text-secondary" htmlFor="rememberDevice">
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-lg w-100 rounded-3 fw-semibold text-white shadow-sm fs-6 d-flex align-items-center justify-content-center gap-2"
            style={{ background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Verifying...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i> Secure Login
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-2">
          <span className="text-muted small me-1">Authorized access only.</span>
          <Link to="/register" className="fw-semibold small text-decoration-none" style={{ color: "#0047ab" }}>
            Request Access
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
