import React from "react";
import { Link, useLocation } from "react-router-dom";

const EmployeeSidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold w-100 ${
      isActive(path) ? "text-primary" : "text-secondary"
    }`;

  const linkStyle = (path) => ({
    backgroundColor: isActive(path) ? "#eef4ff" : "transparent",
    color: isActive(path) ? "#0047ab" : "#6c757d"
  });

  return (
    <aside
      className="bg-white border-end d-flex flex-column justify-content-between p-3"
      style={{
        width: "240px",
        minWidth: "240px",
        minHeight: "calc(100vh - 70px)"
      }}
    >
      <div className="d-flex flex-column gap-1">

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={linkClass("/dashboard")}
          style={linkStyle("/dashboard")}
        >
          <i className="bi bi-grid-fill fs-5"></i>
          Dashboard
        </Link>

        {/* My Profile */}
        <Link
          to="/profile"
          className={linkClass("/profile")}
          style={linkStyle("/profile")}
        >
          <i className="bi bi-person fs-5"></i>
          My Profile
        </Link>

        {/* Trusted Devices */}
        <Link
          to="/trusted-devices"
          className={linkClass("/trusted-devices")}
          style={linkStyle("/trusted-devices")}
        >
          <i className="bi bi-laptop fs-5"></i>
          Trusted Devices
        </Link>

        {/* Resource Access */}
        <Link
          to="/policies"
          className={linkClass("/policies")}
          style={linkStyle("/policies")}
        >
          <i className="bi bi-key fs-5"></i>
          Resource Access
        </Link>

        {/* Continuous Authentication */}
        <Link
          to="/continuous-authentication"
          className={linkClass("/continuous-authentication")}
          style={linkStyle("/continuous-authentication")}
        >
          <i className="bi bi-shield-check fs-5"></i>
          Continuous Authentication
        </Link>

        {/* Login History */}
        <a
          href="#login-history"
          className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary w-100"
        >
          <i className="bi bi-clock-history fs-5"></i>
          Login History
        </a>

        {/* Security Notifications */}
        <a
          href="#security-notifications"
          className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary w-100"
        >
          <i className="bi bi-bell fs-5"></i>
          Security Notifications
        </a>

        {/* Active Sessions */}
        <a
          href="#active-sessions"
          className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary w-100"
        >
          <i className="bi bi-activity fs-5"></i>
          Active Sessions
        </a>

      </div>

      {/* Bottom Section */}
      <div className="pt-3 border-top">

        {/* Change Password */}
        <Link
          to="/change-password"
          className={linkClass("/change-password")}
          style={linkStyle("/change-password")}
        >
          <i className="bi bi-key-fill fs-5"></i>
          Change Password
        </Link>

      </div>
    </aside>
  );
};

export default EmployeeSidebar;