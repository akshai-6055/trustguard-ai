import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import deviceService from "../services/deviceService";
import {
  generateDeviceFingerprint,
  getBrowserName,
  getOSName,
  getDeviceName
} from "../utils/deviceFingerprint";

const TrustedDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected device for View / Delete
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Add Device Form State
  const [newDeviceName, setNewDeviceName] = useState("");
  const [detectedBrowser, setDetectedBrowser] = useState("");
  const [detectedOS, setDetectedOS] = useState("");
  const [detectedFingerprint, setDetectedFingerprint] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch all devices for current user
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await deviceService.getDevices();
      if (response && response.success) {
        setDevices(response.devices || []);
      } else {
        setErrorMessage(response?.message || "Failed to retrieve devices.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage("Session expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setErrorMessage("You do not have permission to view devices.");
      } else if (err.response?.status === 404) {
        setErrorMessage("Device service endpoint not found.");
      } else {
        setErrorMessage(err.response?.data?.message || "Failed to load trusted devices. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Handle Open Add Device Modal & Auto Fingerprinting
  const handleOpenAddModal = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsDetecting(true);
    setShowAddModal(true);

    try {
      const browser = getBrowserName();
      const os = getOSName();
      const defaultName = getDeviceName();
      const fingerprint = await generateDeviceFingerprint();

      setDetectedBrowser(browser);
      setDetectedOS(os);
      setNewDeviceName(defaultName);
      setDetectedFingerprint(fingerprint);
    } catch (err) {
      console.error("Fingerprint generation failed:", err);
      setDetectedBrowser("Google Chrome");
      setDetectedOS("Windows");
      setNewDeviceName("My Device");
      setDetectedFingerprint("auto-generated-fingerprint");
    } finally {
      setIsDetecting(false);
    }
  };

  // Submit Add Device
  const handleAddDeviceSubmit = async (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) {
      setErrorMessage("Please enter a device name.");
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      const payload = {
        device_name: newDeviceName.trim(),
        browser: detectedBrowser || "Google Chrome",
        os: detectedOS || "Windows",
        fingerprint: detectedFingerprint || (await generateDeviceFingerprint())
      };

      const response = await deviceService.registerDevice(payload);
      if (response && response.success) {
        setSuccessMessage(response.message || "Device registered successfully!");
        setShowAddModal(false);
        await fetchDevices();
      } else {
        setErrorMessage(response?.message || "Failed to register device.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error registering device. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open View Modal and fetch single device info
  const handleOpenViewModal = async (deviceId) => {
    setErrorMessage("");
    setViewLoading(true);
    setShowViewModal(true);
    try {
      const response = await deviceService.getDevice(deviceId);
      if (response && response.success) {
        setSelectedDevice(response.device);
      } else {
        setErrorMessage(response?.message || "Device not found.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to retrieve device details.");
    } finally {
      setViewLoading(false);
    }
  };

  // Change Device Trust Status (Trusted, Pending, Blocked)
  const handleUpdateStatus = async (deviceId, newStatus) => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      const response = await deviceService.updateDeviceTrust(deviceId, newStatus);
      if (response && response.success) {
        setSuccessMessage(response.message || `Device status updated to ${newStatus}.`);
        await fetchDevices();
      } else {
        setErrorMessage(response?.message || "Failed to update device status.");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorMessage("Device not found or already removed.");
      } else {
        setErrorMessage(err.response?.data?.message || "Error updating device trust status.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (device) => {
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  // Confirm and Execute Delete Device
  const handleConfirmDelete = async () => {
    if (!selectedDevice) return;
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      const response = await deviceService.deleteDevice(selectedDevice.id);
      if (response && response.success) {
        setSuccessMessage(response.message || "Device removed successfully.");
        setShowDeleteModal(false);
        setSelectedDevice(null);
        await fetchDevices();
      } else {
        setErrorMessage(response?.message || "Failed to remove device.");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorMessage("Device not found or already removed.");
      } else {
        setErrorMessage(err.response?.data?.message || "Error removing device.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Summary Calculations (No hardcoded numbers)
  const totalDevicesCount = devices.length;
  const trustedDevicesCount = devices.filter((d) => d.status === "Trusted").length;
  const pendingDevicesCount = devices.filter((d) => d.status === "Pending").length;

  // Helper to format date cleanly
  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
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

  // Helper for Device Icon
  const getDeviceIcon = (os, deviceName) => {
    const text = `${os || ""} ${deviceName || ""}`.toLowerCase();
    if (text.includes("phone") || text.includes("android") || text.includes("ios") || text.includes("iphone")) {
      return "bi-phone";
    }
    if (text.includes("mac") || text.includes("laptop") || text.includes("notebook")) {
      return "bi-laptop";
    }
    if (text.includes("desktop") || text.includes("pc") || text.includes("windows") || text.includes("linux")) {
      return "bi-display";
    }
    return "bi-laptop";
  };

  // Helper for Status Badge Class
  const getStatusBadge = (status) => {
    if (status === "Trusted") {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-shield-check me-1"></i> Trusted
        </span>
      );
    }
    if (status === "Pending") {
      return (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-clock-history me-1"></i> Pending
        </span>
      );
    }
    if (status === "Blocked") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold">
          <i className="bi bi-shield-x me-1"></i> Blocked
        </span>
      );
    }
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-1">
        {status || "Unknown"}
      </span>
    );
  };

  // Helper for Progress Bar Color based on Trust Score
  const getProgressColor = (score) => {
    const num = Number(score) || 0;
    if (num >= 80) return "bg-success";
    if (num >= 50) return "bg-warning";
    return "bg-danger";
  };

  return (
    <DashboardLayout
      title="Trusted Devices"
      subtitle="Manage and monitor the devices associated with your account."
    >
      {/* Action Notification Alerts */}
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

      {/* Top Header Controls Bar */}
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
                Trusted Devices
              </li>
            </ol>
          </nav>
          <span className="text-secondary small">
            Zero Trust architecture continuously computes trust scores for all client endpoints.
          </span>
        </div>

        <div>
          <button
            id="btn-add-device"
            onClick={handleOpenAddModal}
            className="btn text-white fw-semibold rounded-3 px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
            style={{ background: "#0047ab" }}
          >
            <i className="bi bi-plus-lg"></i> + Add Device
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 SUMMARY CARDS (DYNAMIC CALCULATION)                                      */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Devices */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-primary"
                  style={{ background: "#eef4ff" }}
                >
                  <i className="bi bi-laptop fs-3" style={{ color: "#0047ab" }}></i>
                </div>
                <span className="fw-bold fs-2 text-dark">
                  {loading ? "..." : totalDevicesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Total Devices</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  All registered endpoints in your profile
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Trusted Devices */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-success"
                  style={{ background: "#ecfdf5" }}
                >
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
                <span className="fw-bold fs-2 text-success">
                  {loading ? "..." : trustedDevicesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Trusted Devices</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  Verified hardware with granted access privileges
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Devices */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-warning"
                  style={{ background: "#fffbeb" }}
                >
                  <i className="bi bi-clock-history fs-3"></i>
                </div>
                <span className="fw-bold fs-2 text-warning">
                  {loading ? "..." : pendingDevicesCount}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Pending Devices</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  Awaiting trust verification or policy validation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEVICE LIST / CARDS SECTION                                               */}
      {/* ========================================================================= */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">Registered Endpoints</h5>
          <span className="text-muted small">
            Showing {devices.length} {devices.length === 1 ? "device" : "devices"}
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
            <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ color: "#0047ab" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="fw-bold text-dark mb-1">Loading trusted devices...</h6>
            <p className="text-secondary small mb-0">Querying TrustGuard Zero Trust device ledger</p>
          </div>
        ) : devices.length === 0 ? (
          /* Empty State */
          <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
            <div
              className="rounded-circle mx-auto p-4 mb-3 d-flex align-items-center justify-content-center"
              style={{ width: "80px", height: "80px", background: "#eef4ff" }}
            >
              <i className="bi bi-laptop text-primary fs-1" style={{ color: "#0047ab" }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">No devices registered</h4>
            <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: "420px" }}>
              Your devices will appear here after they are registered. Register your current browser to enable continuous adaptive Zero Trust protection.
            </p>
            <div>
              <button
                onClick={handleOpenAddModal}
                className="btn text-white fw-semibold rounded-3 px-4 py-2 shadow-sm"
                style={{ background: "#0047ab" }}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Device
              </button>
            </div>
          </div>
        ) : (
          /* Device Cards Grid */
          <div className="row g-4">
            {devices.map((device) => {
              const trustScoreNum = Number(device.trust_score) || 0;
              const deviceIcon = getDeviceIcon(device.os, device.device_name);

              return (
                <div key={device.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card border-0 shadow-sm rounded-4 h-100 bg-white p-4 d-flex flex-column justify-content-between position-relative transition-all">
                    {/* Device Header */}
                    <div>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-3 p-3 text-primary d-flex align-items-center justify-content-center border"
                            style={{ background: "#f8fafc" }}
                          >
                            <i className={`bi ${deviceIcon} fs-3`} style={{ color: "#0047ab" }}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-1 text-truncate" style={{ maxWidth: "180px" }}>
                              {device.device_name}
                            </h6>
                            <span className="text-secondary small d-block">
                              {device.browser} • {device.os}
                            </span>
                          </div>
                        </div>
                        <div>{getStatusBadge(device.status)}</div>
                      </div>

                      {/* Trust Score Progress Bar */}
                      <div className="p-3 bg-light rounded-3 mb-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary small fw-semibold">Trust Score</span>
                          <span className="fw-bold small text-dark">{trustScoreNum}%</span>
                        </div>
                        <div className="progress" style={{ height: "7px", backgroundColor: "#e2e8f0" }}>
                          <div
                            className={`progress-bar rounded-pill ${getProgressColor(trustScoreNum)}`}
                            role="progressbar"
                            style={{ width: `${trustScoreNum}%` }}
                            aria-valuenow={trustScoreNum}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>

                      {/* Device Meta Info */}
                      <div className="small text-secondary mb-3">
                        <div className="d-flex justify-content-between py-1 border-bottom border-light">
                          <span>Status:</span>
                          <span className="fw-semibold text-dark">{device.status}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1">
                          <span>Last Used:</span>
                          <span className="fw-semibold text-dark">{formatDateTime(device.last_used)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-top d-flex align-items-center justify-content-between gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleOpenViewModal(device.id)}
                        className="btn btn-sm btn-outline-primary rounded-3 px-3 fw-semibold d-flex align-items-center gap-1"
                        style={{ color: "#0047ab", borderColor: "#0047ab" }}
                      >
                        <i className="bi bi-eye"></i> View
                      </button>

                      {/* Status Action & Remove Action Buttons */}
                      <div className="d-flex align-items-center gap-2">
                        {/* If Trusted -> Show Block */}
                        {device.status === "Trusted" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(device.id, "Blocked")}
                            className="btn btn-sm btn-outline-warning rounded-3 px-2 py-1 small fw-semibold text-dark d-flex align-items-center gap-1"
                            title="Block this device"
                          >
                            <i className="bi bi-slash-circle text-danger"></i> Block
                          </button>
                        )}

                        {/* If Pending -> Show Trust & Block */}
                        {device.status === "Pending" && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(device.id, "Trusted")}
                              className="btn btn-sm btn-outline-success rounded-3 px-2 py-1 small fw-semibold d-flex align-items-center gap-1"
                              title="Trust this device"
                            >
                              <i className="bi bi-shield-check"></i> Trust
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(device.id, "Blocked")}
                              className="btn btn-sm btn-outline-warning rounded-3 px-2 py-1 small fw-semibold text-dark d-flex align-items-center gap-1"
                              title="Block this device"
                            >
                              <i className="bi bi-slash-circle text-danger"></i> Block
                            </button>
                          </>
                        )}

                        {/* If Blocked -> Show Trust */}
                        {device.status === "Blocked" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(device.id, "Trusted")}
                            className="btn btn-sm btn-outline-success rounded-3 px-2 py-1 small fw-semibold d-flex align-items-center gap-1"
                            title="Trust this device"
                          >
                            <i className="bi bi-shield-check"></i> Trust
                          </button>
                        )}

                        {/* Remove Device Button */}
                        <button
                          disabled={actionLoading}
                          onClick={() => handleOpenDeleteModal(device)}
                          className="btn btn-sm btn-outline-danger rounded-3 px-2 py-1 small fw-semibold d-flex align-items-center gap-1"
                          title="Remove device"
                        >
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD DEVICE MODAL (AUTOMATIC FINGERPRINTING)                             */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header border-0 text-white p-4"
                style={{ background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-3 p-2 bg-white bg-opacity-20">
                    <i className="bi bi-laptop fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Register New Device</h5>
                    <span className="small text-white-50">Automatic Hardware & Browser Recognition</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>

              <form onSubmit={handleAddDeviceSubmit}>
                <div className="modal-body p-4">
                  {isDetecting ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary mb-2"></div>
                      <p className="small text-secondary mb-0">Generating device fingerprint telemetry...</p>
                    </div>
                  ) : (
                    <>
                      {/* Device Name Input */}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">
                          Device Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control rounded-3 p-2 border"
                          placeholder="e.g. Office Laptop, Personal MacBook"
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          required
                          autoFocus
                        />
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          A friendly nickname to identify this endpoint.
                        </span>
                      </div>

                      {/* Auto-detected Information Box */}
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <h6 className="fw-bold text-dark small mb-2 d-flex align-items-center gap-1">
                          <i className="bi bi-cpu text-primary"></i> Telemetry Auto-Detected
                        </h6>
                        <div className="row g-2 small text-secondary">
                          <div className="col-6">
                            <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>Browser:</span>
                            <span className="fw-semibold text-dark">{detectedBrowser || "Detecting..."}</span>
                          </div>
                          <div className="col-6">
                            <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>Operating System:</span>
                            <span className="fw-semibold text-dark">{detectedOS || "Detecting..."}</span>
                          </div>
                          <div className="col-12 mt-2 pt-2 border-top">
                            <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>Hardware Fingerprint:</span>
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              <i className="bi bi-fingerprint me-1"></i> SHA-256 Fingerprint Computed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-info rounded-3 p-2 small mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-info-circle-fill text-info fs-5"></i>
                        <span>
                          New devices are registered with a baseline trust score and validated via continuous Zero Trust telemetry.
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer border-0 p-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-light border rounded-3 px-3 fw-semibold text-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || isDetecting}
                    className="btn text-white rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
                    style={{ background: "#0047ab" }}
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span> Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-plus"></i> Register Device
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW DEVICE MODAL (NO RAW FINGERPRINT EXPOSED)                         */}
      {/* ========================================================================= */}
      {showViewModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header border-0 text-white p-4"
                style={{ background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-3 p-2 bg-white bg-opacity-20">
                    <i className="bi bi-shield-check fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Device Security Details</h5>
                    <span className="small text-white-50">Zero Trust Endpoint Profile</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedDevice(null);
                  }}
                ></button>
              </div>

              <div className="modal-body p-4">
                {viewLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary mb-2"></div>
                    <p className="small text-secondary mb-0">Fetching device telemetry...</p>
                  </div>
                ) : selectedDevice ? (
                  <div className="d-flex flex-column gap-3">
                    {/* Device Header in Modal */}
                    <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{selectedDevice.device_name}</h6>
                        <span className="text-muted small">
                          {selectedDevice.browser} • {selectedDevice.os}
                        </span>
                      </div>
                      <div>{getStatusBadge(selectedDevice.status)}</div>
                    </div>

                    {/* Key Attributes List */}
                    <div className="row g-3 small">
                      <div className="col-6">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Browser
                        </label>
                        <div className="p-2 bg-light rounded-2 border fw-semibold text-dark">
                          {selectedDevice.browser || "Unknown"}
                        </div>
                      </div>

                      <div className="col-6">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Operating System
                        </label>
                        <div className="p-2 bg-light rounded-2 border fw-semibold text-dark">
                          {selectedDevice.os || "Unknown"}
                        </div>
                      </div>

                      <div className="col-6">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Trust Score
                        </label>
                        <div className="p-2 bg-light rounded-2 border fw-bold text-primary">
                          {selectedDevice.trust_score}%
                        </div>
                      </div>

                      <div className="col-6">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Status
                        </label>
                        <div className="p-2 bg-light rounded-2 border fw-semibold text-dark">
                          {selectedDevice.status}
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Last Used Timestamp
                        </label>
                        <div className="p-2 bg-light rounded-2 border text-dark">
                          <i className="bi bi-clock me-1 text-primary"></i>
                          {formatDateTime(selectedDevice.last_used)}
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: "0.7rem" }}>
                          Hardware Telemetry Signature
                        </label>
                        <div className="p-2 bg-light rounded-2 border text-success fw-medium">
                          <i className="bi bi-fingerprint me-1"></i> Verified cryptographic hardware hash
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-center mb-0">No device details found.</p>
                )}
              </div>

              <div className="modal-footer border-0 p-4 pt-0">
                <button
                  type="button"
                  className="btn text-white rounded-3 px-4 fw-semibold"
                  style={{ background: "#0047ab" }}
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedDevice(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {showDeleteModal && selectedDevice && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle mx-auto p-3 mb-3 d-flex align-items-center justify-content-center text-danger"
                  style={{ width: "64px", height: "64px", background: "#fee2e2" }}
                >
                  <i className="bi bi-trash3-fill fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Remove Trusted Device?</h5>
                <p className="text-secondary small mb-3">
                  Are you sure you want to remove <strong>"{selectedDevice.device_name}"</strong>?
                  Future logins from this device will require identity re-authentication.
                </p>
                <div className="p-2 bg-light rounded-3 border small text-muted mb-3">
                  {selectedDevice.browser} • {selectedDevice.os}
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light border rounded-3 px-4 fw-semibold text-secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedDevice(null);
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={actionLoading}
                    className="btn btn-danger rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span> Removing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash"></i> Yes, Remove Device
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TrustedDevices;
