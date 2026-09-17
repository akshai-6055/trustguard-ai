import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none fw-medium w-100 mb-1 transition-all ${
      isActive(path) ? "bg-primary text-white shadow-sm" : "text-secondary hover-bg-light"
    }`;

  const iconClass = (path) =>
    `fs-5 ${isActive(path) ? "text-white" : "text-secondary"}`;

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside
      className="bg-white border-end d-flex flex-column justify-content-between p-3"
      style={{
        width: "260px",
        minWidth: "260px",
        minHeight: "100vh",
        position: "sticky",
        top: 0
      }}
    >
      <div>
        {/* Brand */}
        <div className="mb-4 px-2 d-flex align-items-center gap-2">
          <div className="bg-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
            <i className="bi bi-shield-lock-fill text-white fs-5"></i>
          </div>
          <div>
            <div className="fw-bold fs-5 text-dark lh-1">TrustGuard AI</div>
            <div className="small text-primary fw-semibold" style={{ fontSize: "0.75rem" }}>Enterprise Zero Trust</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="d-flex flex-column">
          <Link to="/admin/dashboard" className={linkClass("/admin/dashboard")}>
            <i className={`bi bi-grid-fill ${iconClass("/admin/dashboard")}`}></i>
            Dashboard
          </Link>
          
          <Link to="/admin/users" className={linkClass("/admin/users")}>
            <i className={`bi bi-people-fill ${iconClass("/admin/users")}`}></i>
            User Management
          </Link>

          <Link to="/admin/devices" className={linkClass("/admin/devices")}>
            <i className={`bi bi-laptop ${iconClass("/admin/devices")}`}></i>
            Device Management
          </Link>

          <Link to="/admin/policies" className={linkClass("/admin/policies")}>
            <i className={`bi bi-shield-lock ${iconClass("/admin/policies")}`}></i>
            Policy Management
          </Link>

          <Link to="/admin/audit-logs" className={linkClass("/admin/audit-logs")}>
            <i className={`bi bi-journal-text ${iconClass("/admin/audit-logs")}`}></i>
            Audit Logs
          </Link>

          {/*<Link to="/admin/continuous-authentication" className={linkClass("/admin/continuous-authentication")}>
            <i className={`bi bi-shield-check ${iconClass("/admin/continuous-authentication")}`}></i>
            AI Risk Assessment
          </Link>*/}
          
          <Link to="/admin/security-alerts" className={linkClass("/admin/security-alerts")}>
            <i className={`bi bi-exclamation-triangle ${iconClass("/admin/security-alerts")}`}></i>
            Security Alerts
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-3 border-top d-flex flex-column">
        <Link to="/admin/profile" className={linkClass("/admin/profile")}>
          <i className={`bi bi-gear-fill ${iconClass("/admin/profile")}`}></i>
          System Settings
        </Link>
        <button
          onClick={handleLogout}
          className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-medium text-danger hover-bg-light w-100"
        >
          <i className="bi bi-box-arrow-right fs-5 text-danger"></i>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
