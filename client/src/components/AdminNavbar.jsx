import React from "react";
import { useAuth } from "../context/AuthContext";

const AdminNavbar = () => {
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2 px-4 d-flex justify-content-between align-items-center">
      {/* Global Search (mockup) */}
      <div className="input-group" style={{ maxWidth: "400px" }}>
        <span className="input-group-text bg-light border-end-0 text-secondary">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control bg-light border-start-0 fs-6"
          placeholder="Global system search..."
        />
      </div>

      {/* Action Items */}
      <div className="d-flex align-items-center gap-4">
        {/* Notifications */}
        <div className="position-relative cursor-pointer text-secondary">
          <i className="bi bi-bell fs-5"></i>
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New alerts</span>
          </span>
        </div>

        {/* User Profile */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex flex-column text-end" style={{ lineHeight: "1.1" }}>
            <span className="fw-semibold text-dark small">{user?.full_name || "Admin"}</span>
            <span className="text-primary fw-bold" style={{ fontSize: "0.65rem", textTransform: "uppercase" }}>
              Super Admin
            </span>
          </div>
          <div
            className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
            style={{ width: "38px", height: "38px", fontSize: "1rem" }}
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
