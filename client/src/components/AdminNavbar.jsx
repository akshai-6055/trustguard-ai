import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2 px-4 d-flex justify-content-end align-items-center">

      {/* Action Items */}
      <div className="d-flex align-items-center gap-3">
        {/* User Profile */}
        <div className="d-flex align-items-center gap-2 pe-1">
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

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 ms-2 px-3 py-1 rounded-3 fw-medium"
          title="Sign Out"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
