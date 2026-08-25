import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import policyService from "../services/policyService";
import PolicyDetailsModal from "../components/PolicyDetailsModal";
import PolicyFormModal from "../components/PolicyFormModal";
import PolicyCard from "../components/PolicyCard";

const PolicyManagement = () => {
  const { user } = useAuth();

  // Determine if user is Admin
  const isAdmin =
    user?.role_id === 1 ||
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "administrator";

  // Data states
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [deviceFilter, setDeviceFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"

  // Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  // Fetch policies from backend
  const fetchPolicies = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage("");

      const response = await policyService.getAllPolicies();
      if (response && response.success) {
        setPolicies(response.policies || []);
      } else {
        setErrorMessage(response?.message || "Unable to load security policies. Please try again.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage("Session expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setErrorMessage("You do not have permission to view security policies.");
      } else {
        setErrorMessage("Unable to load security policies. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Handle View Details
  const handleOpenViewModal = async (policy) => {
    setErrorMessage("");
    setSelectedPolicy(policy);
    setShowDetailsModal(true);
    setDetailsLoading(true);

    try {
      const response = await policyService.getPolicyById(policy.policy_id);
      if (response && response.success && response.policy) {
        setSelectedPolicy(response.policy);
      }
    } catch (err) {
      // Fall back to current policy item if single fetch fails
      console.warn("Could not fetch detailed policy by ID, using listing item:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle Open Create Policy Modal (Admin only)
  const handleOpenCreateModal = () => {
    if (!isAdmin) return;
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedPolicy(null);
    setFormMode("create");
    setShowFormModal(true);
  };

  // Handle Open Edit Policy Modal (Admin only)
  const handleOpenEditModal = async (policy) => {
    if (!isAdmin) return;
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedPolicy(policy);
    setFormMode("edit");
    setShowFormModal(true);

    try {
      const response = await policyService.getPolicyById(policy.policy_id);
      if (response && response.success && response.policy) {
        setSelectedPolicy(response.policy);
      }
    } catch (err) {
      console.warn("Using table policy for edit:", err);
    }
  };

  // Handle Submit Create / Edit Policy (Admin only)
  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (formMode === "create") {
        const response = await policyService.createPolicy(formData);
        if (response && response.success) {
          setSuccessMessage(response.message || "Security policy created successfully.");
          setShowFormModal(false);
          await fetchPolicies(true);
        } else {
          setErrorMessage(response?.message || "Failed to create security policy.");
        }
      } else if (formMode === "edit" && selectedPolicy) {
        const response = await policyService.updatePolicy(selectedPolicy.policy_id, formData);
        if (response && response.success) {
          setSuccessMessage(response.message || "Security policy updated successfully.");
          setShowFormModal(false);
          await fetchPolicies(true);
        } else {
          setErrorMessage(response?.message || "Failed to update security policy.");
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          `Failed to ${formMode === "create" ? "create" : "update"} security policy.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Delete Modal (Admin only)
  const handleOpenDeleteModal = (policy) => {
    if (!isAdmin) return;
    setPolicyToDelete(policy);
    setShowDeleteModal(true);
  };

  // Handle Confirm Delete Policy (Admin only)
  const handleConfirmDelete = async () => {
    if (!policyToDelete || !isAdmin) return;

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await policyService.deletePolicy(policyToDelete.policy_id);
      if (response && response.success) {
        setSuccessMessage(response.message || "Security policy deleted successfully.");
        setShowDeleteModal(false);
        setPolicyToDelete(null);
        await fetchPolicies(true);
      } else {
        setErrorMessage(response?.message || "Failed to delete security policy.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to delete security policy.");
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Summary Calculations (Calculated from API response)
  const totalPoliciesCount = policies.length;
  const allowPoliciesCount = policies.filter(
    (p) => (p.action || "").toLowerCase() === "allow"
  ).length;
  const denyPoliciesCount = policies.filter(
    (p) => (p.action || "").toLowerCase() === "deny"
  ).length;
  const mfaPoliciesCount = policies.filter(
    (p) => (p.action || "").toLowerCase() === "mfa"
  ).length;

  // Filtered Policies based on search and dropdowns
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      (policy.policy_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.resource_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.role_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      actionFilter === "ALL" ||
      (policy.action || "").toUpperCase() === actionFilter.toUpperCase();

    const matchesDevice =
      deviceFilter === "ALL" ||
      (policy.required_device_status || "").toUpperCase() === deviceFilter.toUpperCase();

    return matchesSearch && matchesAction && matchesDevice;
  });

  // Badge helpers
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

  const getTrustRiskBadge = (min, max) => {
    const avg = ((Number(min) || 0) + (Number(max) || 100)) / 2;
    if (avg >= 80) {
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-dark small">{min}% – {max}%</span>
          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0" style={{ fontSize: "0.65rem", width: "fit-content" }}>
            Low Risk / Trusted
          </span>
        </div>
      );
    }
    if (avg >= 50) {
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-dark small">{min}% – {max}%</span>
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-0" style={{ fontSize: "0.65rem", width: "fit-content" }}>
            Medium Risk
          </span>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column">
        <span className="fw-semibold text-dark small">{min}% – {max}%</span>
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-0" style={{ fontSize: "0.65rem", width: "fit-content" }}>
          High Risk
        </span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout
      title="Policy-Based Access Control"
      subtitle="Manage and monitor access policies based on user roles, permissions, device trust, and risk score."
    >
      {/* Alert Messages */}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
        </div>
      )}

      {/* Top Header & Breadcrumb & Action Controls */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small">
              <li className="breadcrumb-item">
                <Link to="/dashboard" className="text-decoration-none" style={{ color: "#0047ab" }}>
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Policy-Based Access Control
              </li>
            </ol>
          </nav>
          <span className="text-secondary small">
            Dynamic access decisions calculated using adaptive Zero Trust context attributes.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => fetchPolicies(true)}
            className="btn btn-white border bg-white rounded-3 px-3 py-2 text-secondary fw-semibold d-flex align-items-center gap-2 shadow-sm"
            title="Refresh policies"
            disabled={refreshing || loading}
          >
            <i className={`bi bi-arrow-clockwise ${refreshing ? "spin-animation" : ""}`}></i>
            <span className="d-none d-md-inline">Refresh</span>
          </button>

          {/* Add Policy Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="btn text-white fw-semibold rounded-3 px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
              style={{ background: "#0047ab" }}
            >
              <i className="bi bi-plus-lg"></i> + Add Policy
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 SUMMARY CARDS (DYNAMIC CALCULATION)                                      */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Policies */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-primary"
                  style={{ background: "#eef4ff" }}
                >
                  <i className="bi bi-shield-lock fs-4" style={{ color: "#0047ab" }}></i>
                </div>
                <span className="fw-bold fs-2 text-dark">
                  {loading ? "..." : totalPoliciesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark small mb-1">Total Policies</div>
                <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Active PBAC security rules
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Allow Policies */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-success"
                  style={{ background: "#e8f5e9" }}
                >
                  <i className="bi bi-check-circle fs-4" style={{ color: "#2e7d32" }}></i>
                </div>
                <span className="fw-bold fs-2 text-success" style={{ color: "#2e7d32" }}>
                  {loading ? "..." : allowPoliciesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark small mb-1">Allow Policies</div>
                <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Direct access permitted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Deny Policies */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-danger"
                  style={{ background: "#fee2e2" }}
                >
                  <i className="bi bi-x-circle fs-4" style={{ color: "#dc2626" }}></i>
                </div>
                <span className="fw-bold fs-2 text-danger" style={{ color: "#dc2626" }}>
                  {loading ? "..." : denyPoliciesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark small mb-1">Deny Policies</div>
                <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Explicit block rules
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: MFA Policies */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-warning"
                  style={{ background: "#fef3c7" }}
                >
                  <i className="bi bi-shield-shaded fs-4" style={{ color: "#d97706" }}></i>
                </div>
                <span className="fw-bold fs-2 text-warning" style={{ color: "#d97706" }}>
                  {loading ? "..." : mfaPoliciesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark small mb-1">MFA Policies</div>
                <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Step-up verification required
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR                                                       */}
      {/* ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search by policy name, resource, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-light border-start-0 text-secondary"
                  type="button"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="bi bi-x-lg small"></i>
                </button>
              )}
            </div>
          </div>

          {/* Action Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light text-secondary"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="ALLOW">Allow Only</option>
              <option value="DENY">Deny Only</option>
              <option value="MFA">MFA Required</option>
            </select>
          </div>

          {/* Device Requirement Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select bg-light text-secondary"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="ALL">All Devices</option>
              <option value="TRUSTED">Trusted</option>
              <option value="PENDING">Pending</option>
              <option value="BLOCKED">Blocked</option>
              <option value="ANY">Any Device</option>
            </select>
          </div>

          {/* View Mode Toggle (Table / Grid) */}
          <div className="col-12 col-md-2 d-flex justify-content-md-end">
            <div className="btn-group w-100 w-md-auto" role="group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-light border text-secondary"}`}
                onClick={() => setViewMode("table")}
                title="Table view"
              >
                <i className="bi bi-table"></i> Table
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-light border text-secondary"}`}
                onClick={() => setViewMode("grid")}
                title="Grid cards view"
              >
                <i className="bi bi-grid-3x3-gap"></i> Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN POLICY CONTENT AREA                                                  */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ color: "#0047ab" }}>
            <span className="visually-hidden">Loading policies...</span>
          </div>
          <h6 className="fw-bold text-dark">Loading security policies...</h6>
          <p className="text-secondary small mb-0">Retrieving Zero Trust access control rules.</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        /* Empty State */
        <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
          <div
            className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
            style={{ width: "64px", height: "64px", background: "#eef4ff", color: "#0047ab" }}
          >
            <i className="bi bi-shield-x fs-2"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">No security policies found.</h5>
          <p className="text-secondary small mb-3">
            {searchQuery || actionFilter !== "ALL" || deviceFilter !== "ALL"
              ? "No policies match your search or filter criteria. Try adjusting your filters."
              : "Create a policy to begin controlling resource access."}
          </p>
          {isAdmin && !searchQuery && actionFilter === "ALL" && deviceFilter === "ALL" && (
            <div>
              <button
                onClick={handleOpenCreateModal}
                className="btn text-white fw-semibold rounded-3 px-4 py-2"
                style={{ background: "#0047ab" }}
              >
                <i className="bi bi-plus-lg me-1"></i> Create Policy
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="row g-3 mb-4">
          {filteredPolicies.map((policy) => (
            <div key={policy.policy_id} className="col-12 col-md-6 col-xl-4">
              <PolicyCard
                policy={policy}
                isAdmin={isAdmin}
                onView={handleOpenViewModal}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-uppercase text-secondary" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                  <th className="py-3 ps-4 fw-semibold">Policy Name</th>
                  <th className="py-3 fw-semibold">Role</th>
                  <th className="py-3 fw-semibold">Permission</th>
                  <th className="py-3 fw-semibold">Resource</th>
                  <th className="py-3 fw-semibold">Device Requirement</th>
                  <th className="py-3 fw-semibold">Trust Score Range</th>
                  <th className="py-3 fw-semibold">Action</th>
                  <th className="py-3 fw-semibold">Created Date</th>
                  <th className="py-3 pe-4 text-end fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {filteredPolicies.map((policy) => (
                  <tr key={policy.policy_id} className="border-bottom">
                    {/* Policy Name & Description */}
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{policy.policy_name}</div>
                      <div
                        className="text-secondary text-truncate"
                        style={{ maxWidth: "220px", fontSize: "0.75rem" }}
                      >
                        {policy.description || "No description"}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3">
                      <span className="badge bg-light text-dark border px-2 py-1 fw-semibold">
                        {policy.role_name || (policy.role_id === 1 ? "Administrator" : "Employee")}
                      </span>
                    </td>

                    {/* Permission */}
                    <td className="py-3">
                      <span className="text-dark fw-medium">
                        {policy.permission_name || `Permission #${policy.permission_id}`}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                        {policy.resource_name}
                      </span>
                    </td>

                    {/* Device Requirement */}
                    <td className="py-3">{getDeviceBadge(policy.required_device_status)}</td>

                    {/* Trust Score Range */}
                    <td className="py-3">{getTrustRiskBadge(policy.min_trust_score, policy.max_trust_score)}</td>

                    {/* Action */}
                    <td className="py-3">{getActionBadge(policy.action)}</td>

                    {/* Created Date */}
                    <td className="py-3 text-secondary">{formatDate(policy.created_at)}</td>

                    {/* Actions */}
                    <td className="pe-4 py-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => handleOpenViewModal(policy)}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1"
                          title="View Policy Details"
                        >
                          <i className="bi bi-eye"></i> View
                        </button>

                        {/* Admin Action Buttons */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(policy)}
                              className="btn btn-light btn-sm text-secondary rounded-pill px-2"
                              title="Edit Policy"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(policy)}
                              className="btn btn-light btn-sm text-danger rounded-pill px-2"
                              title="Delete Policy"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* View Policy Details Modal */}
      <PolicyDetailsModal
        show={showDetailsModal}
        policy={selectedPolicy}
        loading={detailsLoading}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPolicy(null);
        }}
      />

      {/* Create / Edit Policy Modal (Admin Only) */}
      {isAdmin && (
        <PolicyFormModal
          show={showFormModal}
          mode={formMode}
          policy={selectedPolicy}
          loading={actionLoading}
          onClose={() => {
            setShowFormModal(false);
            setSelectedPolicy(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
      {isAdmin && showDeleteModal && policyToDelete && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3 align-items-center">
                <div className="d-flex align-items-center gap-2 text-danger">
                  <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                  <h5 className="modal-title fw-bold text-dark mb-0">Confirm Policy Deletion</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <p className="text-dark mb-2 fw-semibold">
                  Are you sure you want to delete this security policy?
                </p>
                <div className="p-3 bg-white rounded-3 border">
                  <div className="fw-bold text-dark">{policyToDelete.policy_name}</div>
                  <div className="text-secondary small mt-1">
                    Resource: <span className="text-dark">{policyToDelete.resource_name}</span> | Action:{" "}
                    <span className="text-dark">{policyToDelete.action}</span>
                  </div>
                </div>
                <p className="text-muted small mt-3 mb-0">
                  This action will immediately remove the access control rule. Users matching these criteria may lose or gain access depending on fallback policies.
                </p>
              </div>

              <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3 px-4 fw-semibold"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                >
                  {actionLoading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  Delete Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PolicyManagement;
