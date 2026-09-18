import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";

const RiskGauge = ({ score }) => {
  const color = score >= 80 ? "#198754" : score >= 50 ? "#fd7e14" : "#dc3545";
  const label = score >= 80 ? "TRUSTED" : score >= 50 ? "MODERATE" : "HIGH RISK";
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="progress flex-grow-1" style={{ height: "8px" }}>
        <div className="progress-bar" style={{ width: `${score}%`, backgroundColor: color }}></div>
      </div>
      <span className="small fw-bold" style={{ color, minWidth: "70px" }}>{score}% — {label}</span>
    </div>
  );
};

const ContinuousAuthentication = () => {
  const [data, setData] = useState({ trustDist: [], highRiskUsers: [], avgTrustPerUser: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getRiskAssessmentData();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error("Failed to load risk data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trusted    = data.trustDist.find(d => d.status === "Trusted")?.count  || 0;
  const pending    = data.trustDist.find(d => d.status === "Pending")?.count  || 0;
  const blocked    = data.trustDist.find(d => d.status === "Blocked")?.count  || 0;
  const total      = Number(trusted) + Number(pending) + Number(blocked) || 1;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">AI Risk Assessment</h4>
          <p className="text-secondary small mb-0">
            Continuous device trust monitoring and adaptive Zero Trust scoring engine
          </p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-success-subtle text-success border px-3 py-2">
            <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i> Engine: Active
          </span>
        </div>
      </div>

      {/* Trust Distribution Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-shield-check-fill text-success fs-3"></i>
              </div>
              <div>
                <div className="text-secondary small fw-semibold">TRUSTED DEVICES</div>
                <h2 className="fw-bold text-dark mb-0">{loading ? "..." : trusted}</h2>
                <div className="text-success small">{loading ? "" : `${Math.round(trusted / total * 100)}% of fleet`}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-hourglass-split text-warning fs-3"></i>
              </div>
              <div>
                <div className="text-secondary small fw-semibold">PENDING REVIEW</div>
                <h2 className="fw-bold text-dark mb-0">{loading ? "..." : pending}</h2>
                <div className="text-warning small">{loading ? "" : `${Math.round(pending / total * 100)}% of fleet`}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-danger border-opacity-25 bg-danger-subtle shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-danger rounded-3 p-3">
                <i className="bi bi-shield-x text-white fs-3"></i>
              </div>
              <div>
                <div className="text-danger small fw-semibold">BLOCKED DEVICES</div>
                <h2 className="fw-bold text-danger mb-0">{loading ? "..." : blocked}</h2>
                <div className="text-danger small">{loading ? "" : `${Math.round(blocked / total * 100)}% of fleet`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* High-Risk Devices */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                High-Risk Device Endpoints
              </h6>
              <span className="badge bg-danger-subtle text-danger border">Trust Score &lt; 50%</span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
              ) : data.highRiskUsers.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-shield-check fs-1 d-block mb-2 text-success opacity-75"></i>
                  <p className="mb-0">No high-risk devices detected. System secure.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-secondary">
                      <tr>
                        <th className="ps-3 py-2 border-0">USER</th>
                        <th className="py-2 border-0">DEVICE</th>
                        <th className="py-2 border-0">ENVIRONMENT</th>
                        <th className="py-2 border-0" style={{ minWidth: "200px" }}>TRUST SCORE</th>
                        <th className="py-2 border-0">LAST SEEN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.highRiskUsers.map((u, i) => (
                        <tr key={i}>
                          <td className="ps-3 py-2">
                            <div className="fw-semibold text-dark">{u.full_name}</div>
                            <div className="text-secondary" style={{ fontSize: "0.73rem" }}>{u.email}</div>
                          </td>
                          <td className="py-2 text-dark">{u.device_name}</td>
                          <td className="py-2 text-secondary">{u.os} / {u.browser}</td>
                          <td className="py-2"><RiskGauge score={u.trust_score} /></td>
                          <td className="py-2 text-secondary">
                            {u.last_used ? new Date(u.last_used).toLocaleDateString() : "N/A"}
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

        {/* Avg Trust per User (leaderboard style) */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-dark text-white">
            <div className="card-header border-secondary border-bottom p-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-graph-down-arrow text-danger"></i>
                Lowest Trust Users
              </h6>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-light spinner-border-sm"></div></div>
              ) : data.avgTrustPerUser.length === 0 ? (
                <p className="text-secondary small text-center py-3">No data available.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.avgTrustPerUser.map((u, i) => (
                    <div key={i}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small fw-medium text-light text-truncate" style={{ maxWidth: "150px" }}>{u.full_name}</span>
                        <span className={`badge ${u.avg_trust >= 80 ? "bg-success" : u.avg_trust >= 50 ? "bg-warning text-dark" : "bg-danger"}`}>
                          {u.avg_trust}%
                        </span>
                      </div>
                      <div className="progress" style={{ height: "5px", backgroundColor: "rgba(255,255,255,0.1)" }}>
                        <div
                          className={`progress-bar ${u.avg_trust >= 80 ? "bg-success" : u.avg_trust >= 50 ? "bg-warning" : "bg-danger"}`}
                          style={{ width: `${u.avg_trust}%` }}
                        ></div>
                      </div>
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

export default ContinuousAuthentication;
