import React, { useEffect, useState } from "react";
import dashboardService from "../services/dashboardService";
import AdminLayout from "../layouts/AdminLayout";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalDevices: 0,
    trustedDevices: 0,
    untrustedDevices: 0,
    failedLogins: 0,
    activeSessions: 0,
    recentRegistrations: [],
    latestLoginActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getAdminDashboard();
        if (data.success) {
          setDashboardData(data.dashboard);
        } else {
          setErrorMessage(data.message || "Failed to load admin metrics.");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Unauthorized or forbidden to access admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Security Command Center</h4>
          <p className="text-secondary small mb-0">Overview of enterprise user accounts, active security statuses, and system login activity</p>
        </div>
        <div>
          <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
            <i className="bi bi-download"></i> Export Report
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-shield-x fs-5"></i>
          <div>{errorMessage}</div>
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      {/* Primary Metrics Row */}
      <div className="row g-3 mb-4">
        {/* Total Users */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-10 text-primary rounded p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <i className="bi bi-people-fill"></i>
                </div>
                <span className="text-secondary fw-semibold small">Total Employees</span>
              </div>
              <span className="badge bg-primary-subtle text-primary">+2.4%</span>
            </div>
            <h2 className="fw-bold text-dark mb-0 mt-2">{loading ? "..." : dashboardData.totalUsers}</h2>
          </div>
        </div>

        {/* Active Users */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-info bg-opacity-10 text-info rounded p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <span className="text-secondary fw-semibold small">Active Users</span>
              </div>
              <span className="badge bg-light border text-secondary">Stable</span>
            </div>
            <h2 className="fw-bold text-dark mb-0 mt-2">{loading ? "..." : dashboardData.activeUsers}</h2>
          </div>
        </div>

        {/* Trusted Devices */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-warning bg-opacity-10 text-warning rounded p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <i className="bi bi-laptop"></i>
                </div>
                <span className="text-secondary fw-semibold small">Trusted Devices</span>
              </div>
              <span className="badge bg-warning-subtle text-warning-emphasis">Managed</span>
            </div>
            <h2 className="fw-bold text-dark mb-0 mt-2">{loading ? "..." : dashboardData.trustedDevices}</h2>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="col-md-3">
          <div className="card border-danger border-opacity-25 shadow-sm rounded-3 h-100 p-3 bg-danger-subtle">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-danger text-white rounded p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <span className="text-danger fw-semibold small">Failed Logins</span>
              </div>
              <span className="badge bg-danger text-white">Attention</span>
            </div>
            <h2 className="fw-bold text-danger mb-0 mt-2">
              {loading ? "..." : dashboardData.failedLogins} <span className="fs-6 fw-normal text-danger-emphasis">Today</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <h6 className="fw-bold text-dark mb-3">Risk Distribution</h6>
            <div className="d-flex flex-column align-items-center justify-content-center py-4">
              <div className="position-relative" style={{ width: "160px", height: "160px" }}>
                <svg viewBox="0 0 36 36" className="w-100 h-100">
                  <path
                    className="text-light"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeDasharray="50, 100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke="#a52a2a"
                    strokeDasharray="35, 100"
                    strokeDashoffset="-50"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-danger"
                    strokeDasharray="15, 100"
                    strokeDashoffset="-85"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <h4 className="fw-bold mb-0">100%</h4>
                  <small className="text-secondary" style={{ fontSize: "0.7rem" }}>Coverage</small>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary"><i className="bi bi-circle-fill text-primary me-1" style={{ fontSize: "0.5rem" }}></i> Low Risk</span>
                <span className="fw-semibold">50%</span>
              </div>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary"><i className="bi bi-circle-fill text-danger text-opacity-75 me-1" style={{ color: "#a52a2a", fontSize: "0.5rem" }}></i> Medium Risk</span>
                <span className="fw-semibold">35%</span>
              </div>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary"><i className="bi bi-circle-fill text-danger me-1" style={{ fontSize: "0.5rem" }}></i> High Risk</span>
                <span className="fw-semibold">15%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
           {/* Active Users/Blocked Users/Untrusted Devices text representation or Chart Mockup */}
           <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-dark mb-0">System Overview</h6>
                <select className="form-select form-select-sm w-auto">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              
              <div className="row text-center mb-4">
                <div className="col border-end">
                  <h3 className="fw-bold mb-0">{loading ? "..." : dashboardData.activeSessions}</h3>
                  <small className="text-secondary">Active Sessions</small>
                </div>
                <div className="col border-end">
                  <h3 className="fw-bold mb-0">{loading ? "..." : dashboardData.untrustedDevices}</h3>
                  <small className="text-secondary">Untrusted Devices</small>
                </div>
                <div className="col">
                  <h3 className="fw-bold mb-0">{loading ? "..." : dashboardData.blockedUsers}</h3>
                  <small className="text-secondary">Blocked Users</small>
                </div>
              </div>

              <div className="bg-light rounded p-4 text-center d-flex align-items-center justify-content-center h-100 min-vh-25">
                 <span className="text-secondary small"><i className="bi bi-bar-chart"></i> Login Trend Chart (Mockup)</span>
              </div>
           </div>
        </div>
      </div>

      {/* Tables Row: Recent Activities & Security Alerts */}
      <div className="row g-3">
        {/* Recent Activities */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Recent Activities</h6>
              <a href="#view-all" className="text-decoration-none small fw-semibold">View All</a>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                </div>
              ) : dashboardData.latestLoginActivity.length === 0 ? (
                <p className="text-muted small mb-0 text-center py-4">No recent activities found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-secondary">
                      <tr>
                        <th className="ps-3 border-0 py-2">USER</th>
                        <th className="border-0 py-2">ACTION</th>
                        <th className="border-0 py-2">TIMESTAMP</th>
                        <th className="border-0 py-2 pe-3 text-end">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {dashboardData.latestLoginActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td className="ps-3 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-secondary" style={{width: "32px", height: "32px"}}>
                                {activity.full_name ? activity.full_name.substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{activity.full_name || "User"}</div>
                                <div className="text-secondary" style={{ fontSize: "0.75rem" }}>{activity.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-dark">System Login Attempt</div>
                            <div className="text-secondary" style={{ fontSize: "0.75rem" }}>{activity.device_name || 'Web Device'}</div>
                          </td>
                          <td className="py-3 text-secondary">
                            {activity.login_time ? new Date(activity.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </td>
                          <td className="py-3 pe-3 text-end">
                            <span className={`badge rounded-pill ${activity.status === "Success" ? "bg-primary-subtle text-primary border border-primary-subtle" : "bg-danger-subtle text-danger border border-danger-subtle"}`}>
                              <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.4rem" }}></i>
                              {activity.status === "Success" ? "COMPLETED" : "BLOCKED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-dark text-white">
            <div className="card-header border-bottom border-secondary p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-megaphone text-danger me-2"></i> Security Alerts
              </h6>
              <span className="badge bg-danger">LIVE</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                <div className="border-start border-danger border-3 ps-2">
                  <div className="text-danger small fw-semibold mb-1">High Severity</div>
                  <div className="fw-medium text-light mb-1">Attempted brute force from IP: 192.168.1.104</div>
                  <div className="text-secondary" style={{ fontSize: "0.75rem" }}>2 minutes ago</div>
                </div>

                <div className="border-start border-warning border-3 ps-2">
                  <div className="text-warning small fw-semibold mb-1">Medium Severity</div>
                  <div className="fw-medium text-light mb-1">Unusual login location: Singapore</div>
                  <div className="text-secondary" style={{ fontSize: "0.75rem" }}>14 minutes ago</div>
                </div>

                <div className="border-start border-danger border-3 ps-2">
                  <div className="text-danger small fw-semibold mb-1">High Severity</div>
                  <div className="fw-medium text-light mb-1">Multiple failed logins for Admin account</div>
                  <div className="text-secondary" style={{ fontSize: "0.75rem" }}>1 hour ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
