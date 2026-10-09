import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../services/axiosInstance";

const DashboardNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Optionally fetch notifications just to get the count for the bell icon
    const fetchNotificationsCount = async () => {
      try {
        const res = await axiosInstance.get("/user/notifications");
        if (res.data.success && res.data.notifications) {
          // Just show if there are any notifications, max 3 like dashboard
          setUnreadCount(res.data.notifications.length > 0 ? Math.min(res.data.notifications.length, 3) : 0);
        }
      } catch (err) {
        console.error("Failed to load notifications count", err);
      }
    };
    fetchNotificationsCount();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "User";
  const displayRole = user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee");

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4 py-2 sticky-top">
      <div className="container-fluid">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark fs-5">
          <div className="rounded-3 p-1 d-flex align-items-center justify-content-center text-primary">
            <i className="bi bi-shield-lock-fill fs-3" style={{ color: "#0047ab" }}></i>
          </div>
          <span>
            <span style={{ color: "#0047ab" }}>TrustGuard</span> <span className="text-secondary fw-normal">AI</span>
          </span>
        </Link>

        {/* Right Header Actions */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          {/* Notification Icon */}
          <Link to="/security-notifications" className="btn btn-link text-secondary position-relative p-1 border-0">
            <i className="bi bi-bell fs-5"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            )}
          </Link>

          {/* User Profile Info */}
          <div className="d-flex align-items-center gap-2 border-start ps-3 me-2">
            <div
              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold overflow-hidden"
              style={{ width: "38px", height: "38px", fontSize: "0.9rem", background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="d-flex flex-column text-start" style={{ lineHeight: "1.2" }}>
              <span className="fw-bold text-dark small">{displayName}</span>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>{displayRole}</span>
            </div>
            <i className="bi bi-chevron-down text-muted small ms-1"></i>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-sm text-white fw-semibold rounded-3 px-3 py-2 d-flex align-items-center gap-2"
            style={{ background: "#0047ab" }}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
