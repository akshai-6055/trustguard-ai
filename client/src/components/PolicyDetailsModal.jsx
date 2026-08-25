import React from "react";

const PolicyDetailsModal = ({ show, onClose, policy, loading }) => {
  if (!show) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const getActionBadge = (action) => {
    const act = (action || "").toLowerCase();
    if (act === "allow") {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-check-circle-fill me-1"></i> Allow
        </span>
      );
    }
    if (act === "deny") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-x-circle-fill me-1"></i> Deny
        </span>
      );
    }
    if (act === "mfa") {
      return (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-shield-lock-fill me-1"></i> MFA Required
        </span>
      );
    }
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-1">
        {action || "Unknown"}
      </span>
    );
  };

  const getDeviceBadge = (status) => {
    const st = (status || "").toLowerCase();
    if (st === "trusted") {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-shield-check me-1"></i> Trusted
        </span>
      );
    }
    if (st === "pending") {
      return (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-clock-history me-1"></i> Pending
        </span>
      );
    }
    if (st === "blocked") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-shield-x me-1"></i> Blocked
        </span>
      );
    }
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-1 fw-semibold">
        <i className="bi bi-hdd-network me-1"></i> Any Device
      </span>
    );
  };

  const getTrustScoreRisk = (min, max) => {
    const avg = ((Number(min) || 0) + (Number(max) || 100)) / 2;
    if (avg >= 80) return { label: "Low Risk / Trusted", color: "text-success", bg: "bg-success" };
    if (avg >= 50) return { label: "Medium Risk", color: "text-warning", bg: "bg-warning" };
    return { label: "High Risk", color: "text-danger", bg: "bg-danger" };
  };

  const risk = policy ? getTrustScoreRisk(policy.min_trust_score, policy.max_trust_score) : null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-white border-bottom px-4 py-3 align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                style={{ background: "#eef4ff", color: "#0047ab" }}
              >
                <i className="bi bi-shield-check fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">Policy Details</h5>
                <span className="text-secondary small">Policy-Based Access Control Evaluation Rules</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading policy details...</span>
                </div>
                <p className="text-muted small mt-2">Loading policy details...</p>
              </div>
            ) : !policy ? (
              <div className="alert alert-warning mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i> Policy information is not available.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {/* Main Identity Banner Card */}
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2 mb-2">
                    <div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 small mb-1">
                        Policy #{policy.policy_id}
                      </span>
                      <h4 className="fw-bold text-dark mb-1">{policy.policy_name}</h4>
                      <p className="text-secondary small mb-0">
                        {policy.description || "No description provided for this policy rule."}
                      </p>
                    </div>
                    <div className="text-sm-end">{getActionBadge(policy.action)}</div>
                  </div>
                </div>

                {/* Grid Attributes */}
                <div className="row g-3">
                  {/* Role */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Role</span>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-person-badge text-primary fs-5"></i>
                        <span className="fw-bold text-dark">
                          {policy.role_name || (policy.role_id === 1 ? "Administrator" : "Employee")}
                        </span>
                      </div>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Role ID: {policy.role_id}
                      </span>
                    </div>
                  </div>

                  {/* Permission */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Permission</span>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-unlock text-primary fs-5"></i>
                        <span className="fw-bold text-dark">
                          {policy.permission_name || `Permission #${policy.permission_id}`}
                        </span>
                      </div>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Permission ID: {policy.permission_id}
                      </span>
                    </div>
                  </div>

                  {/* Resource */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Target Resource</span>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-folder-symlink text-primary fs-5"></i>
                        <span className="fw-bold text-dark">{policy.resource_name}</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>Protected Asset</span>
                    </div>
                  </div>

                  {/* Device Requirement */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Required Device Status</span>
                      <div className="mt-1">{getDeviceBadge(policy.required_device_status)}</div>
                    </div>
                  </div>

                  {/* Trust Score Range */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Trust Score Range</span>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold fs-5 text-dark">
                          {policy.min_trust_score}% – {policy.max_trust_score}%
                        </span>
                        <span className={`small fw-semibold ${risk.color}`}>{risk.label}</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className={`progress-bar ${risk.bg}`}
                          role="progressbar"
                          style={{
                            width: `${Math.max(10, policy.max_trust_score - policy.min_trust_score)}%`,
                            marginLeft: `${policy.min_trust_score}%`
                          }}
                          aria-valuenow={policy.max_trust_score}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Decision Action */}
                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
                      <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Decision Action</span>
                      <div className="mt-1">{getActionBadge(policy.action)}</div>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted small">
                          <i className="bi bi-clock-history me-1"></i> Policy Created:{" "}
                          <strong className="text-dark">{formatDate(policy.created_at)}</strong>
                        </span>
                        <span className="badge bg-light text-secondary border px-2 py-1 small">
                          Zero-Trust Active Rule
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white border-top px-4 py-3">
            <button
              type="button"
              className="btn btn-secondary rounded-3 px-4 fw-semibold"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailsModal;
