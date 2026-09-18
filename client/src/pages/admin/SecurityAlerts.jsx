import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";

const SEVERITY_TABS = ["All", "Failed Logins", "Blocked Devices", "Blocked Users"];

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState({ failedLogins: [], blockedDevices: [], blockedUsers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getSecurityAlerts();
        if (res.success) setAlerts(res.alerts);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalAlerts = alerts.failedLogins.length + alerts.blockedDevices.length + alerts.blockedUsers.length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Security Alerts</h4>
          <p className="text-secondary small mb-0">
            Real-time threat intelligence — failed access attempts, blocked devices, and suspended accounts
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger text-white fs-6 px-3 py-2">
            <i className="bi bi-exclamation-triangle-fill me-1"></i> {loading ? "..." : totalAlerts} Active Alerts
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 border-start border-danger border-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-danger bg-opacity-10 rounded-3 p-2 text-danger">
                <i className="bi bi-door-closed-fill fs-3"></i>
              </div>
              <div>
                <div className="text-secondary small fw-semibold">FAILED LOGINS</div>
                <h2 className="fw-bold text-danger mb-0">{loading ? "..." : alerts.failedLogins.length}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 border-start border-warning border-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-10 rounded-3 p-2 text-warning">
                <i className="bi bi-laptop fs-3"></i>
              </div>
              <div>
                <div className="text-secondary small fw-semibold">BLOCKED DEVICES</div>
                <h2 className="fw-bold text-warning mb-0">{loading ? "..." : alerts.blockedDevices.length}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 border-start border-secondary border-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-secondary bg-opacity-10 rounded-3 p-2 text-secondary">
                <i className="bi bi-person-x-fill fs-3"></i>
              </div>
              <div>
                <div className="text-secondary small fw-semibold">SUSPENDED ACCOUNTS</div>
                <h2 className="fw-bold text-dark mb-0">{loading ? "..." : alerts.blockedUsers.length}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <ul className="nav nav-pills gap-1">
            {SEVERITY_TABS.map(tab => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link py-1 px-3 small fw-semibold ${activeTab === tab ? "active" : "text-secondary"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
          <div className="input-group" style={{ maxWidth: "260px" }}>
            <span className="input-group-text bg-light border-end-0 text-secondary small">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-sm bg-light border-start-0"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <>
              {/* --- Failed Logins --- */}
              {(activeTab === "All" || activeTab === "Failed Logins") && (
                <div>
                  {activeTab === "All" && (
                    <div className="px-4 pt-3 pb-2 d-flex align-items-center gap-2">
                      <span className="badge bg-danger">High</span>
                      <h6 className="fw-bold text-dark mb-0">Failed Login Attempts</h6>
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th className="ps-4 py-2 border-0">USER</th>
                          <th className="py-2 border-0">DEVICE</th>
                          <th className="py-2 border-0">LOCATION</th>
                          <th className="py-2 border-0">TIMESTAMP</th>
                          <th className="py-2 border-0">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.failedLogins
                          .filter(a =>
                            !searchTerm ||
                            (a.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((a, i) => (
                          <tr key={i}>
                            <td className="ps-4 py-2">
                              <div className="fw-semibold text-dark">{a.full_name || "Unknown"}</div>
                              <div className="text-secondary" style={{ fontSize: "0.73rem" }}>{a.email}</div>
                            </td>
                            <td className="py-2 text-secondary">{a.device_name || "Unknown device"}</td>
                            <td className="py-2 text-secondary">{a.location || "—"}</td>
                            <td className="py-2 text-secondary">
                              {a.login_time ? new Date(a.login_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                            </td>
                            <td className="py-2">
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                <i className="bi bi-x-circle me-1"></i>{a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- Blocked Devices --- */}
              {(activeTab === "All" || activeTab === "Blocked Devices") && (
                <div className={activeTab === "All" ? "border-top" : ""}>
                  {activeTab === "All" && (
                    <div className="px-4 pt-3 pb-2 d-flex align-items-center gap-2">
                      <span className="badge bg-warning text-dark">Medium</span>
                      <h6 className="fw-bold text-dark mb-0">Blocked Devices</h6>
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th className="ps-4 py-2 border-0">OWNER</th>
                          <th className="py-2 border-0">DEVICE</th>
                          <th className="py-2 border-0">ENVIRONMENT</th>
                          <th className="py-2 border-0">TRUST SCORE</th>
                          <th className="py-2 border-0">LAST SEEN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.blockedDevices
                          .filter(d =>
                            !searchTerm ||
                            (d.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (d.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((d, i) => (
                          <tr key={i}>
                            <td className="ps-4 py-2">
                              <div className="fw-semibold text-dark">{d.full_name}</div>
                              <div className="text-secondary" style={{ fontSize: "0.73rem" }}>{d.email}</div>
                            </td>
                            <td className="py-2 text-dark">{d.device_name}</td>
                            <td className="py-2 text-secondary">{d.os} / {d.browser}</td>
                            <td className="py-2">
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress" style={{ height: "6px", width: "60px" }}>
                                  <div className="progress-bar bg-danger" style={{ width: `${d.trust_score}%` }}></div>
                                </div>
                                <span className="text-danger fw-semibold small">{d.trust_score}%</span>
                              </div>
                            </td>
                            <td className="py-2 text-secondary">
                              {d.last_used ? new Date(d.last_used).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- Blocked Users --- */}
              {(activeTab === "All" || activeTab === "Blocked Users") && (
                <div className={activeTab === "All" ? "border-top" : ""}>
                  {activeTab === "All" && (
                    <div className="px-4 pt-3 pb-2 d-flex align-items-center gap-2">
                      <span className="badge bg-secondary">Info</span>
                      <h6 className="fw-bold text-dark mb-0">Suspended Accounts</h6>
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th className="ps-4 py-2 border-0">USER</th>
                          <th className="py-2 border-0">EMAIL</th>
                          <th className="py-2 border-0">ACCOUNT STATUS</th>
                          <th className="py-2 border-0">REGISTERED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.blockedUsers
                          .filter(u =>
                            !searchTerm ||
                            (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((u, i) => (
                          <tr key={i}>
                            <td className="ps-4 py-2 fw-semibold text-dark">{u.full_name}</td>
                            <td className="py-2 text-secondary">{u.email}</td>
                            <td className="py-2">
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                {u.account_status}
                              </span>
                            </td>
                            <td className="py-2 text-secondary">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SecurityAlerts;
