import React, { useEffect, useState } from "react";
import dashboardService from "../services/dashboardService";
import DashboardLayout from "../layouts/DashboardLayout";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
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
    <DashboardLayout
      title="Administrator Command Dashboard"
      subtitle="Overview of enterprise user accounts, active security statuses, and system login activity"
    >
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
          <i className="bi bi-shield-x me-2"></i>
          {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="row g-4 mb-4">
        {/* Card 1: Total Users */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted fw-semibold small">Total Users</span>
                <div className="rounded-3 p-3 bg-primary bg-opacity-10 text-primary">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{loading ? "..." : dashboardData.totalUsers}</h2>
              <p className="text-muted small mb-0">Registered accounts in database</p>
            </div>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted fw-semibold small">Active Users</span>
                <div className="rounded-3 p-3 bg-success bg-opacity-10 text-success">
                  <i className="bi bi-person-check-fill fs-3"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{loading ? "..." : dashboardData.activeUsers}</h2>
              <p className="text-muted small mb-0">Accounts with active access permission</p>
            </div>
          </div>
        </div>

        {/* Card 3: Blocked Users */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted fw-semibold small">Blocked / Inactive Users</span>
                <div className="rounded-3 p-3 bg-danger bg-opacity-10 text-danger">
                  <i className="bi bi-person-x-fill fs-3"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{loading ? "..." : dashboardData.blockedUsers}</h2>
              <p className="text-muted small mb-0">Restricted or disabled access accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Registrations & Latest Login Activity */}
      <div className="row g-4">
        {/* Recent Registrations */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-person-plus-fill text-primary me-2"></i> Recent Registrations
              </h5>
              <span className="badge bg-light text-secondary border">Latest 5</span>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                </div>
              ) : dashboardData.recentRegistrations.length === 0 ? (
                <p className="text-muted small mb-0 text-center py-3">No recent user registrations found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {dashboardData.recentRegistrations.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="fw-semibold text-dark">{user.full_name}</div>
                            <div className="text-muted text-truncate" style={{ maxWidth: "160px" }}>{user.email}</div>
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              {user.role_name}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.account_status === "active" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                              {user.account_status || "active"}
                            </span>
                          </td>
                          <td className="text-muted">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
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

        {/* Latest Login Activity */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-activity text-info me-2"></i> Latest Login Activity
              </h5>
              <span className="badge bg-light text-secondary border">Audit Trail</span>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-info"></div>
                </div>
              ) : dashboardData.latestLoginActivity.length === 0 ? (
                <div className="p-3 bg-light rounded-3 text-center">
                  <p className="text-muted small mb-0">No external login events logged yet.</p>
                  <span className="text-secondary" style={{ fontSize: "0.75rem" }}>Authentication logs will record on login.</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>User</th>
                        <th>IP Address</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {dashboardData.latestLoginActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td>
                            <div className="fw-semibold text-dark">{activity.full_name || activity.email}</div>
                          </td>
                          <td>
                            <code className="text-secondary">{activity.ip_address || "127.0.0.1"}</code>
                          </td>
                          <td className="text-muted">
                            {activity.login_time ? new Date(activity.login_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Just now"}
                          </td>
                          <td>
                            <span className="badge bg-success-subtle text-success">
                              {activity.status || "Success"}
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
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
