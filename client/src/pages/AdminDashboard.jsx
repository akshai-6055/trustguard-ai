import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../services/dashboardService";
import adminService from "../services/adminService";
import AdminLayout from "../layouts/AdminLayout";
import LoginTrendChart from "../components/LoginTrendChart";
import RiskDistributionChart from "../components/RiskDistributionChart";

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
    latestLoginActivity: [],
    loginTrends: null,
    riskDistribution: null
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Dynamic Risk Distribution state
  const [riskData, setRiskData] = useState({
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    coverage: 100,
  });
  const [riskLoading, setRiskLoading] = useState(true);

  // Dynamic real-time security alerts/notifications
  const [securityAlerts, setSecurityAlerts] = useState({
    failedLogins: [],
    blockedDevices: [],
    blockedUsers: []
  });
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Login Trend Chart state
  const [timeframe, setTimeframe] = useState(7); // 7 or 30 days
  const [trendData7, setTrendData7] = useState([]);
  const [trendData30, setTrendData30] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getAdminDashboard();
        if (data.success) {
          setDashboardData(data.dashboard);
          if (data.dashboard?.loginTrends) {
            setTrendData7(data.dashboard.loginTrends.past7Days || []);
            setTrendData30(data.dashboard.loginTrends.past30Days || []);
            setChartLoading(false);
          }
          if (data.dashboard?.riskDistribution) {
            setRiskData(data.dashboard.riskDistribution);
            setRiskLoading(false);
          }
        } else {
          setErrorMessage(data.message || "Failed to load admin metrics.");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Unauthorized or forbidden to access admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSecurityAlerts = async () => {
      try {
        setAlertsLoading(true);
        const res = await adminService.getSecurityAlerts();
        if (res.success && res.alerts) {
          setSecurityAlerts(res.alerts);
        }
      } catch (err) {
        console.error("Failed to load real-time security alerts:", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    const fetchTrendsFallback = async () => {
      try {
        // Try dedicated login-trends endpoint first
        try {
          const res7 = await adminService.getLoginTrends(7);
          const res30 = await adminService.getLoginTrends(30);
          if (res7.success && res30.success) {
            setTrendData7(res7.trends);
            setTrendData30(res30.trends);
            setChartLoading(false);
            return;
          }
        } catch {
          // If endpoint is not yet loaded in current server process, fallback to audit logs
        }

        const auditRes = await adminService.getAuditLogs();
        if (auditRes.success && auditRes.logs) {
          const computeTrends = (logs, days) => {
            const dateMap = {};
            logs.forEach((log) => {
              if (!log.login_time) return;
              const d = new Date(log.login_time);
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const dateStr = `${yyyy}-${mm}-${dd}`;
              if (!dateMap[dateStr]) {
                dateMap[dateStr] = { date: dateStr, successful: 0, failed: 0, total: 0 };
              }
              if (log.status === "Success") {
                dateMap[dateStr].successful += 1;
              } else {
                dateMap[dateStr].failed += 1;
              }
              dateMap[dateStr].total += 1;
            });

            const result = [];
            const now = new Date();
            for (let i = days - 1; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - i);
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const dateStr = `${yyyy}-${mm}-${dd}`;
              if (dateMap[dateStr]) {
                result.push(dateMap[dateStr]);
              } else {
                result.push({ date: dateStr, successful: 0, failed: 0, total: 0 });
              }
            }
            return result;
          };

          setTrendData7(computeTrends(auditRes.logs, 7));
          setTrendData30(computeTrends(auditRes.logs, 30));
        }
      } catch (err) {
        console.error("Failed to load trend fallback:", err);
      } finally {
        setChartLoading(false);
      }
    };

    const fetchRiskAssessment = async () => {
      try {
        setRiskLoading(true);
        const res = await adminService.getRiskAssessmentData();
        if (res.success && res.data?.trustDist) {
          const trusted = res.data.trustDist.find((d) => d.status === "Trusted")?.count || 0;
          const pending = res.data.trustDist.find((d) => d.status === "Pending")?.count || 0;
          const blocked = res.data.trustDist.find((d) => d.status === "Blocked")?.count || 0;
          setRiskData({
            lowRisk: Number(trusted),
            mediumRisk: Number(pending),
            highRisk: Number(blocked),
            coverage: 100,
          });
        }
      } catch (err) {
        console.error("Failed to load risk assessment data:", err);
      } finally {
        setRiskLoading(false);
      }
    };

    fetchAdminMetrics();
    fetchSecurityAlerts();
    fetchTrendsFallback();
    fetchRiskAssessment();
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    try {
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now.getTime() - past.getTime();
      if (diffMs < 0) return "Just now";
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  // Combine real-time security alerts into an unified notifications feed
  const dynamicAlerts = useMemo(() => {
    const items = [];

    (securityAlerts.failedLogins || []).forEach((log) => {
      items.push({
        id: `failed-${log.id}`,
        severity: "High Severity",
        severityLevel: "danger",
        icon: "bi-exclamation-triangle-fill",
        title: `Failed Login (${log.status || "Failed"})`,
        detail: `${log.full_name || "Unknown User"} (${log.email || "No email"}) on ${log.device_name || "Device"}`,
        subDetail: log.location ? `Location: ${log.location}` : (log.browser || ""),
        timestamp: log.login_time,
      });
    });

    (securityAlerts.blockedDevices || []).forEach((dev) => {
      items.push({
        id: `device-${dev.id}`,
        severity: "Medium Severity",
        severityLevel: "warning",
        icon: "bi-laptop-fill",
        title: `Blocked Device: ${dev.device_name}`,
        detail: `User: ${dev.full_name || dev.email} • Trust Score: ${dev.trust_score}%`,
        subDetail: `${dev.os || ""} ${dev.browser ? `(${dev.browser})` : ""}`,
        timestamp: dev.last_used,
      });
    });

    (securityAlerts.blockedUsers || []).forEach((usr) => {
      items.push({
        id: `user-${usr.id}`,
        severity: "High Severity",
        severityLevel: "danger",
        icon: "bi-person-x-fill",
        title: `Suspended Account: ${usr.full_name}`,
        detail: `${usr.email} — Status: ${usr.account_status}`,
        subDetail: "Account suspended due to policy violation",
        timestamp: usr.created_at,
      });
    });

    items.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return items;
  }, [securityAlerts]);

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
              {loading ? "..." : dashboardData.failedLogins} <span className="fs-6 fw-normal text-danger-emphasis">Total</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="row g-3 mb-4">
        {/* Dynamic & Responsive Risk Distribution */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-dark mb-0">Risk Distribution</h6>
              <Link to="/admin/continuous-authentication" className="text-decoration-none small text-primary fw-semibold">
                Details
              </Link>
            </div>
            <RiskDistributionChart
              lowCount={riskData.lowRisk}
              mediumCount={riskData.mediumRisk}
              highCount={riskData.highRisk}
              coverage={riskData.coverage}
              loading={riskLoading}
            />
          </div>
        </div>

        {/* Login Trend Chart & System Overview */}
        <div className="col-md-8">
           <div className="card border-0 shadow-sm rounded-3 h-100 p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold text-dark mb-0">Login Trend Chart</h6>
                  <small className="text-secondary">Authentication traffic and failure analytics</small>
                </div>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${timeframe === 7 ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setTimeframe(7)}
                  >
                    Past 7 Days
                  </button>
                  <button
                    type="button"
                    className={`btn ${timeframe === 30 ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setTimeframe(30)}
                  >
                    Past 30 Days
                  </button>
                </div>
              </div>
              
              <div className="row text-center mb-3 g-2">
                <div className="col border-end">
                  <h4 className="fw-bold mb-0 text-dark">{loading ? "..." : dashboardData.activeSessions}</h4>
                  <small className="text-secondary" style={{ fontSize: "0.75rem" }}>Active Sessions</small>
                </div>
                <div className="col border-end">
                  <h4 className="fw-bold mb-0 text-warning">{loading ? "..." : dashboardData.untrustedDevices}</h4>
                  <small className="text-secondary" style={{ fontSize: "0.75rem" }}>Untrusted Devices</small>
                </div>
                <div className="col">
                  <h4 className="fw-bold mb-0 text-danger">{loading ? "..." : dashboardData.blockedUsers}</h4>
                  <small className="text-secondary" style={{ fontSize: "0.75rem" }}>Blocked Users</small>
                </div>
              </div>

              {/* Interactive Trend Chart */}
              <div style={{ height: "230px", position: "relative" }}>
                 <LoginTrendChart
                   data={timeframe === 7 ? trendData7 : trendData30}
                   loading={chartLoading}
                   timeframe={timeframe}
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Tables Row: Recent Activities & Security Notifications */}
      <div className="row g-3">
        {/* Recent Activities */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Recent Activities</h6>
              <Link to="/admin/audit-logs" className="text-decoration-none small fw-semibold">View All</Link>
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

        {/* Security Notifications (formerly Security Alerts card, changed from black to white with dynamic real-time alerts) */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-danger bg-opacity-10 text-danger rounded p-1 d-flex align-items-center justify-content-center" style={{ width: "30px", height: "30px" }}>
                  <i className="bi bi-bell-fill fs-6"></i>
                </div>
                <h6 className="fw-bold text-dark mb-0">Security Notifications</h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-flex align-items-center gap-1">
                  <i className="bi bi-circle-fill" style={{ fontSize: "0.4rem" }}></i> LIVE
                </span>
                <Link to="/admin/security-alerts" className="text-decoration-none small fw-semibold text-primary">
                  View All
                </Link>
              </div>
            </div>
            <div className="card-body p-3" style={{ maxHeight: "380px", overflowY: "auto" }}>
              {alertsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                  <p className="text-muted small mt-2 mb-0">Loading real-time alerts...</p>
                </div>
              ) : dynamicAlerts.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-shield-check text-success fs-2 mb-2 d-block"></i>
                  <div className="fw-semibold text-dark small">All Systems Secure</div>
                  <div className="small text-secondary">No active threat notifications detected.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {dynamicAlerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-start border-3 ps-3 py-2 rounded-end bg-light ${
                        alert.severityLevel === "danger" ? "border-danger" : "border-warning"
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span
                          className={`badge ${
                            alert.severityLevel === "danger" ? "bg-danger text-white" : "bg-warning text-dark"
                          }`}
                          style={{ fontSize: "0.65rem" }}
                        >
                          <i className={`bi ${alert.icon} me-1`}></i>
                          {alert.severity}
                        </span>
                        <span className="text-secondary" style={{ fontSize: "0.72rem" }}>
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <div className="fw-semibold text-dark small mb-1">{alert.title}</div>
                      <div className="text-secondary" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
                        {alert.detail}
                      </div>
                      {alert.subDetail && (
                        <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                          <i className="bi bi-info-circle me-1"></i>
                          {alert.subDetail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
