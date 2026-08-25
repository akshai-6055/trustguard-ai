import React from "react";

const PolicyCard = ({ policy, isAdmin, onView, onEdit, onDelete }) => {
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
          <i className="bi bi-shield-lock-fill me-1"></i> MFA
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
        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small">
          <i className="bi bi-shield-check me-1"></i> Trusted
        </span>
      );
    }
    if (st === "pending") {
      return (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-1 small">
          <i className="bi bi-clock-history me-1"></i> Pending
        </span>
      );
    }
    if (st === "blocked") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1 small">
          <i className="bi bi-shield-x me-1"></i> Blocked
        </span>
      );
    }
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2 py-1 small">
        <i className="bi bi-hdd-network me-1"></i> Any
      </span>
    );
  };

  const getTrustRiskLabel = (min, max) => {
    const avg = ((Number(min) || 0) + (Number(max) || 100)) / 2;
    if (avg >= 80) return { label: "Low Risk", badgeClass: "text-success bg-success-subtle border-success-subtle" };
    if (avg >= 50) return { label: "Med Risk", badgeClass: "text-warning bg-warning-subtle border-warning-subtle" };
    return { label: "High Risk", badgeClass: "text-danger bg-danger-subtle border-danger-subtle" };
  };

  const risk = getTrustRiskLabel(policy.min_trust_score, policy.max_trust_score);

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
      <div className="card-body p-1 d-flex flex-column justify-content-between">
        <div>
          {/* Header row: Policy name & Action badge */}
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <span className="badge bg-light text-secondary border px-2 py-1 small mb-1">
                Policy #{policy.policy_id}
              </span>
              <h6 className="fw-bold text-dark mb-1">{policy.policy_name}</h6>
            </div>
            <div>{getActionBadge(policy.action)}</div>
          </div>

          <p className="text-secondary small mb-3 text-truncate" style={{ maxWidth: "100%" }}>
            {policy.description || "No description provided."}
          </p>

          {/* Key Attributes */}
          <div className="bg-light rounded-3 p-2 mb-3 border">
            <div className="row g-2 small">
              <div className="col-6">
                <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>ROLE</span>
                <span className="fw-semibold text-dark">
                  {policy.role_name || (policy.role_id === 1 ? "Administrator" : "Employee")}
                </span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>RESOURCE</span>
                <span className="fw-semibold text-dark text-truncate d-block">
                  {policy.resource_name}
                </span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>DEVICE REQ</span>
                <div className="mt-1">{getDeviceBadge(policy.required_device_status)}</div>
              </div>
              <div className="col-6">
                <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>TRUST SCORE</span>
                <span className="fw-bold text-dark">
                  {policy.min_trust_score}% – {policy.max_trust_score}%
                </span>
                <span className={`badge border ms-1 rounded-pill ${risk.badgeClass}`} style={{ fontSize: "0.65rem" }}>
                  {risk.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
          <button
            onClick={() => onView(policy)}
            className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
          >
            <i className="bi bi-eye"></i> View
          </button>

          {isAdmin && (
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => onEdit(policy)}
                className="btn btn-light btn-sm text-secondary rounded-pill px-2"
                title="Edit Policy"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                onClick={() => onDelete(policy)}
                className="btn btn-light btn-sm text-danger rounded-pill px-2"
                title="Delete Policy"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
