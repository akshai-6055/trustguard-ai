import React, { useState, useEffect } from "react";

const PolicyFormModal = ({
  show,
  mode = "create", // "create" or "edit"
  policy = null,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    policy_name: "",
    description: "",
    role_id: 2, // Default to Employee
    permission_id: 1, // Default to Read / View
    resource_name: "",
    required_device_status: "Trusted",
    min_trust_score: 70,
    max_trust_score: 100,
    action: "Allow"
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (show) {
      if (mode === "edit" && policy) {
        setFormData({
          policy_name: policy.policy_name || "",
          description: policy.description || "",
          role_id: Number(policy.role_id) || 2,
          permission_id: Number(policy.permission_id) || 1,
          resource_name: policy.resource_name || "",
          required_device_status: policy.required_device_status || "Trusted",
          min_trust_score: policy.min_trust_score !== undefined ? Number(policy.min_trust_score) : 70,
          max_trust_score: policy.max_trust_score !== undefined ? Number(policy.max_trust_score) : 100,
          action: policy.action || "Allow"
        });
      } else {
        setFormData({
          policy_name: "",
          description: "",
          role_id: 2,
          permission_id: 1,
          resource_name: "",
          required_device_status: "Trusted",
          min_trust_score: 70,
          max_trust_score: 100,
          action: "Allow"
        });
      }
      setFormErrors({});
    }
  }, [show, mode, policy]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if (name === "role_id" || name === "permission_id" || name === "min_trust_score" || name === "max_trust_score") {
      parsedValue = value === "" ? "" : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.policy_name.trim()) {
      errors.policy_name = "Policy name is required.";
    }

    if (!formData.role_id) {
      errors.role_id = "User role is required.";
    }

    if (!formData.permission_id) {
      errors.permission_id = "Permission is required.";
    }

    if (!formData.resource_name.trim()) {
      errors.resource_name = "Resource name is required.";
    }

    if (!formData.required_device_status) {
      errors.required_device_status = "Required device status is required.";
    }

    if (formData.min_trust_score === "" || isNaN(formData.min_trust_score)) {
      errors.min_trust_score = "Minimum trust score is required.";
    } else if (formData.min_trust_score < 0 || formData.min_trust_score > 100) {
      errors.min_trust_score = "Trust score must be between 0 and 100.";
    }

    if (formData.max_trust_score === "" || isNaN(formData.max_trust_score)) {
      errors.max_trust_score = "Maximum trust score is required.";
    } else if (formData.max_trust_score < 0 || formData.max_trust_score > 100) {
      errors.max_trust_score = "Trust score must be between 0 and 100.";
    }

    if (
      !errors.min_trust_score &&
      !errors.max_trust_score &&
      formData.min_trust_score > formData.max_trust_score
    ) {
      errors.min_trust_score = "Minimum score cannot exceed maximum score.";
    }

    if (!formData.action) {
      errors.action = "Action decision is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      policy_name: formData.policy_name.trim(),
      description: formData.description.trim(),
      role_id: Number(formData.role_id),
      permission_id: Number(formData.permission_id),
      resource_name: formData.resource_name.trim(),
      required_device_status: formData.required_device_status,
      min_trust_score: Number(formData.min_trust_score),
      max_trust_score: Number(formData.max_trust_score),
      action: formData.action
    };

    onSubmit(payload);
  };

  const isEdit = mode === "edit";

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
                <i className={`bi ${isEdit ? "bi-pencil-square" : "bi-plus-circle"} fs-4`}></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {isEdit ? "Edit Security Policy" : "Create Security Policy"}
                </h5>
                <span className="text-secondary small">
                  Configure zero-trust attributes, context conditions, and enforcement action
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4 bg-light">
              <div className="row g-3">
                {/* Policy Name */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark small">
                    Policy Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="policy_name"
                    value={formData.policy_name}
                    onChange={handleChange}
                    placeholder="e.g. Employee Resource Access, Admin Production Gate"
                    className={`form-control rounded-3 ${formErrors.policy_name ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {formErrors.policy_name && (
                    <div className="invalid-feedback">{formErrors.policy_name}</div>
                  )}
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark small">Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the policy's purpose and context"
                    className="form-control rounded-3"
                    disabled={loading}
                  ></textarea>
                </div>

                {/* Role */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${formErrors.role_id ? "is-invalid" : ""}`}
                    disabled={loading}
                  >
                    <option value={1}>Administrator</option>
                    <option value={2}>Employee</option>
                  </select>
                  {formErrors.role_id && (
                    <div className="invalid-feedback">{formErrors.role_id}</div>
                  )}
                </div>

                {/* Permission */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Permission <span className="text-danger">*</span>
                  </label>
                  <select
                    name="permission_id"
                    value={formData.permission_id}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${formErrors.permission_id ? "is-invalid" : ""}`}
                    disabled={loading}
                  >
                    <option value={1}>Read / View Access</option>
                    <option value={2}>Write / Edit Access</option>
                    <option value={3}>Full Access / Execute</option>
                    <option value={4}>Resource Access</option>
                  </select>
                  {formErrors.permission_id && (
                    <div className="invalid-feedback">{formErrors.permission_id}</div>
                  )}
                </div>

                {/* Resource Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Resource Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="resource_name"
                    value={formData.resource_name}
                    onChange={handleChange}
                    placeholder="e.g. Employee Resources, Financial Reports, Production DB"
                    className={`form-control rounded-3 ${formErrors.resource_name ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {formErrors.resource_name && (
                    <div className="invalid-feedback">{formErrors.resource_name}</div>
                  )}
                </div>

                {/* Required Device Status */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Required Device Status <span className="text-danger">*</span>
                  </label>
                  <select
                    name="required_device_status"
                    value={formData.required_device_status}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${formErrors.required_device_status ? "is-invalid" : ""}`}
                    disabled={loading}
                  >
                    <option value="Any">Any Device</option>
                    <option value="Trusted">Trusted</option>
                    <option value="Pending">Pending</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                  {formErrors.required_device_status && (
                    <div className="invalid-feedback">{formErrors.required_device_status}</div>
                  )}
                </div>

                {/* Trust Score Range (Min & Max) */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Minimum Trust Score (0–100) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_trust_score"
                    min="0"
                    max="100"
                    value={formData.min_trust_score}
                    onChange={handleChange}
                    className={`form-control rounded-3 ${formErrors.min_trust_score ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {formErrors.min_trust_score && (
                    <div className="invalid-feedback">{formErrors.min_trust_score}</div>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">
                    Maximum Trust Score (0–100) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="max_trust_score"
                    min="0"
                    max="100"
                    value={formData.max_trust_score}
                    onChange={handleChange}
                    className={`form-control rounded-3 ${formErrors.max_trust_score ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {formErrors.max_trust_score && (
                    <div className="invalid-feedback">{formErrors.max_trust_score}</div>
                  )}
                </div>

                {/* Action */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark small">
                    Action Decision <span className="text-danger">*</span>
                  </label>
                  <select
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${formErrors.action ? "is-invalid" : ""}`}
                    disabled={loading}
                  >
                    <option value="Allow">Allow (Grant Access)</option>
                    <option value="Deny">Deny (Block Access)</option>
                    <option value="MFA">MFA (Require Multi-Factor Authentication)</option>
                  </select>
                  {formErrors.action && (
                    <div className="invalid-feedback">{formErrors.action}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-4 fw-semibold"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
                style={{ background: "#0047ab" }}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                {isEdit ? "Update Policy" : "Create Policy"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PolicyFormModal;
