import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import deviceService from "../services/deviceService";
import DashboardNavbar from "../components/DashboardNavbar";

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [preciseLocation, setPreciseLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
            const data = await res.json();
            
            let addressStr = "";
            if (data && data.address) {
              const { amenity, house_number, road, neighbourhood, suburb, city, town, state } = data.address;
              const parts = [amenity, house_number, road, neighbourhood, suburb, city || town, state].filter(Boolean);
              addressStr = parts.join(", ");
            } else if (data && data.display_name) {
              addressStr = data.display_name;
            }
            
            if (addressStr) {
               setPreciseLocation(`${addressStr} (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
            } else {
               setPreciseLocation(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
            }
          } catch (err) {
            setPreciseLocation(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          }
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  }, []);
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
        } else if (dashRes.status === "rejected") {
          const errData = dashRes.reason?.response?.data;
          if (errData?.mfaRequired) {
            setShowMfaModal(true);
          } else {
            setErrorMessage(errData?.message || "Failed to load dashboard data");
          }
        }

        if (devRes.status === "fulfilled" && devRes.value?.success) {
          setUserDevices(devRes.value.devices || []);
        } else if (devRes.status === "rejected") {
          const errData = devRes.reason?.response?.data;
          if (errData?.mfaRequired && !showMfaModal) {
            setShowMfaModal(true);
          }
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleVerifyMfa = async () => {
    try {
      setMfaError("");
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code: mfaCode })
      });
      const data = await res.json();
      if (data.success) {
        setShowMfaModal(false);
        setMfaCode("");
        // Reload dashboard data now that MFA is passed
        window.location.reload(); 
      } else {
        setMfaError(data.message || "Invalid code");
      }
    } catch (err) {
      setMfaError("Failed to verify MFA");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || dashboardData?.user?.full_name || "John Doe";
  const displayRole = user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee");

  const trustScore = dashboardData?.trustScore !== undefined ? dashboardData.trustScore : (loading ? "..." : 100);
  const trustStatus = trustScore >= 80 ? "Trusted" : trustScore >= 50 ? "Pending" : "Blocked";
  const riskLevel = trustScore >= 80 ? "Low Risk" : trustScore >= 50 ? "Medium Risk" : "High Risk";
  const statusColorClass = trustScore >= 80 ? "success" : trustScore >= 50 ? "warning" : "danger";

  return (
    <div className="min-vh-100 d-flex flex-column bg-light font-sans" style={{ backgroundColor: "#f4f6fa" }}>
      {/* ========================================================================= */}
      {/* TOP NAVBAR                                                                */}
      {/* ========================================================================= */}
      <DashboardNavbar />

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
            <Link
              to="/login-history"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-clock-history fs-5"></i> Login History
            </Link>

            {/* Security Notifications Link */}
            <Link
              to="/security-notifications"
              className="btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 fw-semibold text-secondary"
            >
              <i className="bi bi-bell fs-5"></i> Security Notifications
            </Link>

            {/* Active Sessions Link */}
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
                    <div className={`rounded-3 p-2 d-flex align-items-center justify-content-center text-${statusColorClass === 'success' ? 'primary' : statusColorClass}`} style={{ background: statusColorClass === 'success' ? '#eef4ff' : '' }}>
                      <i className="bi bi-shield-fill fs-4" style={{ color: statusColorClass === 'success' ? '#0047ab' : '' }}></i>
                    </div>
                    <span className={`fw-bold fs-2 text-${statusColorClass === 'success' ? 'primary' : statusColorClass}`} style={{ color: statusColorClass === 'success' ? '#0047ab' : '' }}>{trustScore}{trustScore !== "..." ? "%" : ""}</span>
                  </div>
                  <div>
                    <div className="fw-bold text-dark small mb-1">Trust Score: {trustScore}{trustScore !== "..." ? "%" : ""}</div>
                    <div className="mb-2">
                      <span className={`badge bg-${statusColorClass}-subtle text-${statusColorClass} border border-${statusColorClass}-subtle rounded-pill px-2 py-1`} style={{ fontSize: "0.7rem" }}>
                        Status: {trustStatus}
                      </span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>Risk Level: {riskLevel}</span>
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
                    <span className="fw-semibold text-dark small d-block" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={preciseLocation || dashboardData?.lastLogin?.location || "Unknown"}>
                      {locationLoading ? "Detecting..." : (preciseLocation || dashboardData?.lastLogin?.location || "Unknown")}
                    </span>
                  </div>
                  <div className="col-6 col-sm-3">
                    <span className="text-secondary small d-block mb-1">Current Time</span>
                    <span className="fw-semibold text-dark small d-block">{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Recent Login Activity Card */}
              <div id="login-history" className="card border-0 shadow-sm rounded-4 bg-white p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold text-dark mb-0">Recent Login Activity</h5>
                  <Link to="/login-history" className="small fw-semibold text-decoration-none" style={{ color: "#0047ab" }}>
                    View All
                  </Link>
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
                      {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                        dashboardData.recentActivity.map((activity, idx) => (
                          <tr key={idx} className="border-bottom">
                            <td className="ps-0 py-3 fw-medium text-dark">
                              {new Date(activity.login_time).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 text-secondary">{activity.device_name}</td>
                            <td className="py-3 text-secondary">{activity.location}</td>
                            <td className="text-end pe-0 py-3">
                              <span className={`badge rounded-pill px-3 py-1 ${
                                activity.status === "Success" ? "bg-success-subtle text-success border border-success-subtle" :
                                activity.status === "Pending" ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle" :
                                "bg-danger-subtle text-danger border border-danger-subtle"
                              }`}>
                                {activity.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-secondary">No recent login activity</td>
                        </tr>
                      )}
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
                {dashboardData?.recentNotifications?.length > 0 && (
                  <span className="badge bg-danger rounded-circle p-1" style={{ width: "18px", height: "18px", fontSize: "0.65rem" }}>
                    {dashboardData.recentNotifications.length}
                  </span>
                )}
              </div>
              <Link to="/security-notifications" className="small fw-semibold text-decoration-none" style={{ color: "#0047ab" }}>
                View all
              </Link>
            </div>

            <div className="row g-3">
              {dashboardData?.recentNotifications?.length > 0 ? (
                dashboardData.recentNotifications.map(notif => {
                  const actionLower = notif.action.toLowerCase();
                  let icon = "bi-check-circle-fill";
                  let color = "success";
                  let level = "LOW";
                  
                  if (actionLower.includes("fail") || actionLower.includes("anomaly") || actionLower.includes("block")) {
                    icon = "bi-exclamation-triangle-fill"; color = "danger"; level = "HIGH";
                  } else if (actionLower.includes("decay") || actionLower.includes("warn")) {
                    icon = "bi-exclamation-circle-fill"; color = "warning"; level = "MEDIUM";
                  }

                  return (
                    <div key={notif.id} className="col-12 col-md-4">
                      <div className={`p-3 bg-${color}-subtle bg-opacity-25 rounded-3 border border-${color}-subtle d-flex align-items-center justify-content-between h-100`}>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${icon} text-${color} fs-5`}></i>
                          <div>
                            <div className="fw-bold text-dark small">{notif.action}</div>
                            <span className="text-secondary d-block" style={{ fontSize: "0.75rem" }}>
                              {new Date(notif.created_at).toLocaleString("en-GB", { 
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" 
                              })}
                            </span>
                          </div>
                        </div>
                        <span className={`badge bg-${color === "warning" ? "warning text-dark" : color} px-2 py-1`} style={{ fontSize: "0.65rem" }}>
                          {level}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-12 text-center py-3 text-secondary">
                  <i className="bi bi-bell-slash fs-3 d-block mb-2 text-muted"></i>
                  No recent notifications.
                </div>
              )}
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

      {/* MFA MODAL */}
      {showMfaModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title"><i className="bi bi-shield-lock-fill me-2"></i> Security Verification</h5>
              </div>
              <div className="modal-body">
                <p>We detected unusual activity or a policy requirement. Please enter the 6-digit code generated by the system to continue.</p>
                {mfaError && <div className="alert alert-danger p-2">{mfaError}</div>}
                <input 
                  type="text" 
                  className="form-control form-control-lg text-center" 
                  placeholder="------" 
                  maxLength="6"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowMfaModal(false); handleLogout(); }}>Cancel (Logout)</button>
                <button type="button" className="btn btn-primary" onClick={handleVerifyMfa} disabled={mfaCode.length !== 6}>Verify Code</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
