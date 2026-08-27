import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import deviceService from "../services/deviceService";

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashRes, devRes] = await Promise.allSettled([
          dashboardService.getEmployeeDashboard(),
          deviceService.getDevices()
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value?.success) {
          setDashboardData(dashRes.value.dashboard);
        }

        if (devRes.status === "fulfilled" && devRes.value?.success) {
          setUserDevices(devRes.value.devices || []);
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || dashboardData?.user?.full_name || "John Doe";
  const displayRole = user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee");

  return (
    <div className="min-vh-100 d-flex flex-column bg-light font-sans" style={{ backgroundColor: "#f4f6fa" }}>
      {/* ========================================================================= */}
      {/* TOP NAVBAR                                                                */}
      {/* ========================================================================= */}
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
            <button className="btn btn-link text-secondary position-relative p-1 border-0">
              <i className="bi bi-bell fs-5"></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </button>

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

      {/* ========================================================================= */}
      {/* MAIN CONTAINER (SIDEBAR + CONTENT AREA)                                   */}
      {/* ========================================================================= */}
      <div className="d-flex flex-grow-1">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className="bg-white border-end d-flex flex-column justify-content-between p-3"
          style={{ width: "240px", minWidth: "240px" }}
        >
          <div className="d-flex flex-column gap-1">
            {/* Dashboard Link */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold ${
                activeTab === "dashboard" ? "text-primary" : "text-secondary"
              }`}
              style={{
                backgroundColor: activeTab === "dashboard" ? "#eef4ff" : "transparent",
                color: activeTab === "dashboard" ? "#0047ab" : "#6c757d"
              }}
            >
              <i className="bi bi-grid-fill fs-5"></i> Dashboard
            </button>

            {/* My Profile Link */}
            <Link
              to="/profile"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-person fs-5"></i> My Profile
            </Link>

            {/* Trusted Devices Link */}
            <Link
              to="/trusted-devices"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-laptop fs-5"></i> Trusted Devices
            </Link>

            {/* Resource Access / Policy Link */}
            <Link
              to="/policies"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-key fs-5"></i> Resource Access
            </Link>

            {/* Continuous Authentication Link */}
            <Link
              to="/continuous-authentication"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-shield-check fs-5"></i> Continuous Authentication
            </Link>

            {/* Login History Link */}
            <a
              href="#login-history"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-clock-history fs-5"></i> Login History
            </a>

            {/* Security Notifications Link */}
            <a
              href="#security-notifications"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-bell fs-5"></i> Security Notifications
            </a>

            {/* Active Sessions Link */}
            <a
              href="#active-sessions"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-activity fs-5"></i> Active Sessions
            </a>
          </div>

          {/* Bottom Sidebar Items */}
          <div className="pt-3 border-top">
            <Link
              to="/change-password"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary w-100"
            >
              <i className="bi bi-key-fill fs-5"></i> Change Password
            </Link>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-grow-1 p-4 p-xl-5 overflow-auto">
          {errorMessage && (
            <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
              <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
            </div>
          )}

          {/* PAGE TITLE BANNER */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="fw-bold text-dark fs-2 mb-0">Welcome back, {displayName}</h1>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 small fw-semibold">
                {displayRole}
              </span>
            </div>
            <p className="text-secondary small mb-0">
              Your identity, trusted device, and resource access are continuously verified using Zero Trust Security principles.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* TOP 4 METRIC CARDS                                                        */}
          {/* ========================================================================= */}
          <div className="row g-3 mb-4">
            {/* Card 1: Trust Score */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                <div className="card-body p-2 d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-primary" style={{ background: "#eef4ff" }}>
                      <i className="bi bi-shield-fill fs-4" style={{ color: "#0047ab" }}></i>
                    </div>
                    <span className="fw-bold fs-2 text-primary" style={{ color: "#0047ab" }}>92%</span>
                  </div>
                  <div>
                    <div className="fw-bold text-dark small mb-1">Trust Score: 92%</div>
                    <div className="mb-2">
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1" style={{ fontSize: "0.7rem" }}>
                        Status: Trusted
                      </span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>Risk Level: Low Risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Trusted Devices */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                <div className="card-body p-2 d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-secondary bg-light">
                      <i className="bi bi-laptop fs-4"></i>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="p-1 bg-success rounded-circle"></span>
                      <span className="fw-bold fs-3 text-dark">
                        {loading ? "..." : userDevices.filter((d) => d.status === "Trusted").length}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold text-dark small mb-1">Trusted Devices</div>
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {loading
                        ? "Loading devices..."
                        : `${userDevices.length} Registered, ${userDevices.filter((d) => d.status === "Pending").length} Pending Approval`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Accessible Resources */}
            <div className="col-12 col-sm-6 col-xl-3">
              <Link to="/policies" className="text-decoration-none">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="card-body p-2 d-flex flex-column justify-content-between">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ background: "#fef3c7", color: "#d97706" }}>
                        <i className="bi bi-key-fill fs-4"></i>
                      </div>
                      <span className="fw-bold fs-3 text-dark">
                        <i className="bi bi-arrow-up-right fs-5 text-secondary"></i>
                      </span>
                    </div>
                    <div>
                      <div className="fw-bold text-dark small mb-1 d-flex align-items-center justify-content-between">
                        <span>Resource Access</span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2" style={{ fontSize: "0.65rem" }}>
                          View Policies
                        </span>
                      </div>
                      <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                        View PBAC security policies & permissions
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Card 4: Security Alerts */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                <div className="card-body p-2 d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-danger" style={{ background: "#fee2e2" }}>
                      <i className="bi bi-bell-fill fs-4"></i>
                    </div>
                    <span className="badge bg-danger rounded-circle p-2 fs-6">1</span>
                  </div>
                  <div>
                    <div className="fw-bold text-dark small mb-1">Security Alerts</div>
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>1 Active Alert, Unread</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION (CURRENT SESSION + TRUSTED DEVICES WIDGET)                */}
          {/* ========================================================================= */}
          <div className="row g-4 mb-4">
            {/* Left Column: Current Session & Recent Login Activity */}
            <div className="col-lg-8 d-flex flex-column gap-4">
              {/* Current Session Card */}
              <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="rounded-2 p-1 text-primary" style={{ background: "#eef4ff" }}>
                    <i className="bi bi-shield-check fs-5" style={{ color: "#0047ab" }}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">Current Session</h5>
                </div>

                <div className="row g-3 pt-2">
                  <div className="col-6 col-sm-3">
                    <span className="text-secondary small d-block mb-1">Status</span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                      Verified
                    </span>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-secondary small d-block mb-1">Device</span>
                    <span className="fw-semibold text-dark small d-block">Office Laptop</span>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-secondary small d-block mb-1">Location</span>
                    <span className="fw-semibold text-dark small d-block">Kottayam, Kerala</span>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-secondary small d-block mb-1">Started</span>
                    <span className="fw-semibold text-dark small d-block">09:15 AM</span>
                  </div>
                </div>
              </div>

              {/* Recent Login Activity Card */}
              <div id="login-history" className="card border-0 shadow-sm rounded-4 bg-white p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold text-dark mb-0">Recent Login Activity</h5>
                  <a href="#view-all" className="small fw-semibold text-decoration-none" style={{ color: "#0047ab" }}>
                    View All
                  </a>
                </div>

                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead>
                      <tr className="border-bottom text-uppercase text-secondary" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                        <th className="fw-semibold ps-0 py-2">DATE</th>
                        <th className="fw-semibold py-2">DEVICE</th>
                        <th className="fw-semibold py-2">LOCATION</th>
                        <th className="fw-semibold text-end pe-0 py-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      <tr className="border-bottom">
                        <td className="ps-0 py-3 fw-medium text-dark">28 Jul 2026</td>
                        <td className="py-3 text-secondary">Office Laptop</td>
                        <td className="py-3 text-secondary">Kottayam</td>
                        <td className="text-end pe-0 py-3">
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                            Success
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-0 py-3 fw-medium text-dark">26 Jul 2026</td>
                        <td className="py-3 text-secondary">Unknown Device</td>
                        <td className="py-3 text-secondary">Unknown</td>
                        <td className="text-end pe-0 py-3">
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1">
                            Blocked
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Trusted Devices Widget */}
            <div className="col-lg-4">
              <div id="trusted-devices" className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="fw-bold text-dark mb-0">Trusted Devices</h5>
                    <Link
                      to="/trusted-devices"
                      className="small fw-semibold text-decoration-none d-flex align-items-center gap-1"
                      style={{ color: "#0047ab" }}
                    >
                      Manage Devices <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    </div>
                  ) : userDevices.length === 0 ? (
                    <div className="p-3 bg-light rounded-3 text-center border mb-3">
                      <p className="text-secondary small mb-1">No devices registered yet</p>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Register your device to gain secure zero-trust access.
                      </span>
                    </div>
                  ) : (
                    userDevices.slice(0, 2).map((device) => {
                      const isPhone =
                        (device.os || "").toLowerCase().includes("phone") ||
                        (device.os || "").toLowerCase().includes("android") ||
                        (device.os || "").toLowerCase().includes("ios");
                      const isDesktop = (device.os || "").toLowerCase().includes("windows") || (device.os || "").toLowerCase().includes("linux");

                      return (
                        <div
                          key={device.id}
                          className="p-3 bg-light rounded-3 mb-3 border d-flex align-items-center justify-content-between"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-3 p-2 bg-white text-primary border">
                              <i
                                className={`bi ${isPhone ? "bi-phone" : isDesktop ? "bi-display" : "bi-laptop"} fs-4`}
                                style={{ color: "#0047ab" }}
                              ></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark small">{device.device_name}</div>
                              <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                                {device.browser} •{" "}
                                <span
                                  className={
                                    device.status === "Trusted"
                                      ? "text-success fw-medium"
                                      : device.status === "Pending"
                                      ? "text-warning fw-medium"
                                      : "text-danger fw-medium"
                                  }
                                >
                                  {device.status} {device.trust_score}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link to="/trusted-devices" className="btn btn-link text-secondary p-1" title="Manage device">
                            <i className="bi bi-gear"></i>
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Device Button */}
                <Link
                  to="/trusted-devices"
                  className="btn border-dashed border-2 w-100 py-2 rounded-3 text-secondary small fw-semibold mt-3 bg-light text-center text-decoration-none d-block"
                >
                  + Add Trusted Device
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM SECTION (SECURITY NOTIFICATIONS)                                   */}
          {/* ========================================================================= */}
          <div id="security-notifications" className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0">Security Notifications</h5>
                <span className="badge bg-danger rounded-circle p-1" style={{ width: "18px", height: "18px", fontSize: "0.65rem" }}>
                  1
                </span>
              </div>
              <a href="#mark-read" className="small fw-semibold text-decoration-none" style={{ color: "#0047ab" }}>
                Mark all as read
              </a>
            </div>

            <div className="row g-3">
              {/* Notification 1 */}
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                    <div>
                      <div className="fw-bold text-dark small">New device verified</div>
                      <span className="text-secondary d-block" style={{ fontSize: "0.75rem" }}>2 hours ago</span>
                    </div>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: "0.65rem" }}>
                    LOW
                  </span>
                </div>
              </div>

              {/* Notification 2 */}
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                    <div>
                      <div className="fw-bold text-dark small">Password updated</div>
                      <span className="text-secondary d-block" style={{ fontSize: "0.75rem" }}>Yesterday, 14:20</span>
                    </div>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: "0.65rem" }}>
                    LOW
                  </span>
                </div>
              </div>

              {/* Notification 3 */}
              <div className="col-12 col-md-4">
                <div className="p-3 bg-danger-subtle bg-opacity-25 rounded-3 border border-danger-subtle d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                    <div>
                      <div className="fw-bold text-dark small">Failed login attempt</div>
                      <span className="text-secondary d-block" style={{ fontSize: "0.75rem" }}>26 Jul, 18:45 • Unknown Device</span>
                    </div>
                  </div>
                  <span className="badge bg-danger text-white px-2 py-1" style={{ fontSize: "0.65rem" }}>
                    HIGH
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FOOTER                                                                    */}
          {/* ========================================================================= */}
          <footer className="text-center text-secondary small py-2 mt-4" style={{ fontSize: "0.75rem" }}>
            TrustGuard AI – Adaptive Zero Trust Security Platform | Version 1.0 | &copy; 2026 TrustGuard AI | Continuous Monitoring Active
          </footer>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
