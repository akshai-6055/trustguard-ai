import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";
import { Modal } from "bootstrap";

const EMPTY_FORM = {
  policy_name: "",
  description: "",
  role_id: 2,
  permission_id: 1,
  resource_name: "",
  required_device_status: "Trusted",
  min_trust_score: 0,
  max_trust_score: 100,
  action: "Allow"
};

const AdminPolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("All");

  // Modal state
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const modalRef = useRef(null);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPolicies();
      if (data.success) setPolicies(data.policies);
    } catch (err) {
      console.error("Failed to load policies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPolicies(); }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    const modal = new Modal(modalRef.current);
    modal.show();
  };

  const openEditModal = (policy) => {
    setModalMode("edit");
    setEditingId(policy.policy_id);
    setFormData({
      policy_name: policy.policy_name,
      description: policy.description || "",
      role_id: policy.role_id,
      permission_id: policy.permission_id,
      resource_name: policy.resource_name,
      required_device_status: policy.required_device_status,
      min_trust_score: policy.min_trust_score,
      max_trust_score: policy.max_trust_score,
      action: policy.action
    });
    setFormError("");
    const modal = new Modal(modalRef.current);
    modal.show();
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.policy_name || !formData.resource_name) {
      setFormError("Policy Name and Resource Name are required.");
      return;
    }
    if (Number(formData.min_trust_score) > Number(formData.max_trust_score)) {
      setFormError("Min Trust Score cannot be greater than Max Trust Score.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        role_id: Number(formData.role_id),
        permission_id: Number(formData.permission_id),
        min_trust_score: Number(formData.min_trust_score),
        max_trust_score: Number(formData.max_trust_score)
      };

      let result;
      if (modalMode === "create") {
        result = await adminService.createPolicy(payload);
      } else {
        result = await adminService.updatePolicy(editingId, payload);
      }

      if (result.success) {
        Modal.getInstance(modalRef.current)?.hide();
        loadPolicies();
      } else {
        setFormError(result.message || "Failed to save policy.");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (policyId, policyName) => {
    if (!window.confirm(`Delete policy "${policyName}"? This action cannot be undone.`)) return;
    try {
      const result = await adminService.deletePolicy(policyId);
      if (result.success) loadPolicies();
      else alert(result.message || "Failed to delete policy.");
    } catch (err) {
      alert("Error deleting policy.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "Allow":  return "bg-success-subtle text-success border border-success-subtle";
      case "Deny":   return "bg-danger-subtle text-danger border border-danger-subtle";
      case "MFA":    return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      default:       return "bg-light text-dark border";
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.resource_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "All" || p.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Policy Management</h4>
          <p className="text-secondary small mb-0">
            Define and enforce PBAC (Policy-Based Access Control) rules across the Zero Trust fabric
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-plus-circle-fill"></i> New Policy
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by policy name or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select bg-light" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="All">All Actions</option>
                <option value="Allow">Allow</option>
                <option value="Deny">Deny</option>
                <option value="MFA">MFA (Review)</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchTerm(""); setFilterAction("All"); }}>
                <i className="bi bi-arrow-clockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-shield-slash fs-1 mb-2 d-block text-secondary opacity-50"></i>
              <p className="mb-1">No policies found.</p>
              <button className="btn btn-sm btn-primary mt-2" onClick={openCreateModal}>
                <i className="bi bi-plus-circle me-1"></i> Create First Policy
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small">
                  <tr>
                    <th className="ps-4 py-3 border-0">POLICY NAME</th>
                    <th className="py-3 border-0">RESOURCE</th>
                    <th className="py-3 border-0">ROLE</th>
                    <th className="py-3 border-0">DEVICE REQUIRED</th>
                    <th className="py-3 border-0">TRUST RANGE</th>
                    <th className="py-3 border-0">ACTION</th>
                    <th className="py-3 border-0">CREATED</th>
                    <th className="pe-4 py-3 border-0 text-end">CONTROLS</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.policy_id}>
                      <td className="ps-4 py-3">
                        <div className="fw-semibold text-dark">{policy.policy_name}</div>
                        {policy.description && (
                          <div className="text-secondary text-truncate" style={{ maxWidth: "200px", fontSize: "0.73rem" }}>
                            {policy.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <code className="text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                          {policy.resource_name}
                        </code>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-light text-dark border">{policy.role_name}</span>
                      </td>
                      <td className="py-3 text-secondary">{policy.required_device_status}</td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-1">
                          <span className="fw-semibold text-dark">{policy.min_trust_score}</span>
                          <span className="text-secondary">–</span>
                          <span className="fw-semibold text-dark">{policy.max_trust_score}</span>
                          <small className="text-secondary">%</small>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${getActionBadge(policy.action)}`}>
                          {policy.action === "Allow" && <i className="bi bi-check-circle me-1"></i>}
                          {policy.action === "Deny"  && <i className="bi bi-x-circle me-1"></i>}
                          {policy.action === "MFA" && <i className="bi bi-hourglass-split me-1"></i>}
                          {policy.action}
                        </span>
                      </td>
                      <td className="py-3 text-secondary">
                        {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Policy"
                            onClick={() => openEditModal(policy)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Policy"
                            onClick={() => handleDelete(policy.policy_id, policy.policy_name)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Policy Modal */}
      <div className="modal fade" id="policyModal" tabIndex="-1" ref={modalRef}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header border-0 bg-dark text-white rounded-top-4 px-4 py-3">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className={`bi ${modalMode === "create" ? "bi-plus-circle-fill" : "bi-pencil-fill"} text-primary`}></i>
                {modalMode === "create" ? "Create New Security Policy" : "Edit Security Policy"}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body px-4 py-4">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  {formError}
                </div>
              )}

              <div className="row g-3">
                {/* Policy Name */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-secondary">POLICY NAME <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="policy_name"
                    placeholder="e.g. High-Trust Employee Access"
                    value={formData.policy_name}
                    onChange={handleChange}
                  />
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-secondary">DESCRIPTION</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="2"
                    placeholder="Brief description of what this policy enforces..."
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {/* Resource Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">RESOURCE NAME <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="resource_name"
                    placeholder="e.g. /api/reports, /dashboard"
                    value={formData.resource_name}
                    onChange={handleChange}
                  />
                </div>

                {/* Action */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">ENFORCEMENT ACTION <span className="text-danger">*</span></label>
                  <select className="form-select" name="action" value={formData.action} onChange={handleChange}>
                    <option value="Allow">Allow</option>
                    <option value="Deny">Deny</option>
                    <option value="MFA">MFA (Require Auth)</option>
                  </select>
                </div>

                {/* Role */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">APPLIES TO ROLE</label>
                  <select className="form-select" name="role_id" value={formData.role_id} onChange={handleChange}>
                    <option value={1}>Administrator</option>
                    <option value={2}>Employee</option>
                  </select>
                </div>

                {/* Permission */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">PERMISSION TYPE</label>
                  <select className="form-select" name="permission_id" value={formData.permission_id} onChange={handleChange}>
                    <option value={1}>Read</option>
                    <option value={2}>Write</option>
                    <option value={3}>Admin</option>
                  </select>
                </div>

                {/* Required Device Status */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-secondary">REQUIRED DEVICE STATUS</label>
                  <select className="form-select" name="required_device_status" value={formData.required_device_status} onChange={handleChange}>
                    <option value="Trusted">Trusted</option>
                    <option value="Pending">Pending</option>
                    <option value="Any">Any</option>
                  </select>
                </div>

                {/* Min Trust Score */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-secondary">MIN TRUST SCORE (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="min_trust_score"
                    min="0"
                    max="100"
                    value={formData.min_trust_score}
                    onChange={handleChange}
                  />
                </div>

                {/* Max Trust Score */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-secondary">MAX TRUST SCORE (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="max_trust_score"
                    min="0"
                    max="100"
                    value={formData.max_trust_score}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 px-4 py-3">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span> Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill"></i>
                    {modalMode === "create" ? "Create Policy" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPolicyManagement;
