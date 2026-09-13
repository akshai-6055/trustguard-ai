import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import continuousAuthService from "../services/continuousAuthService";
import deviceService from "../services/deviceService";
import policyService from "../services/policyService";
import {
  generateDeviceFingerprint,
  getBrowserName,
  getOSName,
  getDeviceName
} from "../utils/deviceFingerprint";

const ContinuousAuthentication = () => {
  const { user } = useAuth();

  // Telemetry & Device State
  const [detectedBrowser, setDetectedBrowser] = useState("");
  const [detectedOS, setDetectedOS] = useState("");
  const [detectedFingerprint, setDetectedFingerprint] = useState("");
  const [detectedPlatformName, setDetectedPlatformName] = useState("");
  const [userDevices, setUserDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [currentTrustScore, setCurrentTrustScore] = useState(null);
  const [currentDeviceStatus, setCurrentDeviceStatus] = useState("Unknown");
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [selectedResource, setSelectedResource] = useState("Employee Resources");
  const [selectedPermissionId, setSelectedPermissionId] = useState(1);
  const [availablePolicies, setAvailablePolicies] = useState([]);

  // Evaluation & Decision States
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastVerifiedTime, setLastVerifiedTime] = useState(null);

  // Current Session Verification History (Temporary React State)
  const [sessionHistory, setSessionHistory] = useState([]);

  // Available resource options
  const resourceOptions = [
    { value: "Employee Resources", label: "Employee Resources" },
    { value: "Financial Reports", label: "Financial Reports" },
    { value: "Production DB", label: "Production DB" },
    { value: "Internal Wiki", label: "Internal Wiki" }
  ];

  // Available permission options
  const permissionOptions = [
    { id: 1, name: "View Resources", label: "View Resources (Read / View)" },
    { id: 4, name: "Access Resources", label: "Access Resources (General Access)" },
    { id: 2, name: "Write / Edit Access", label: "Write / Edit Resources" },
    { id: 3, name: "Full Access / Execute", label: "Full Access / Execute" }
  ];

  // Initialize telemetry and load user's registered devices
  const initTelemetryAndDevices = useCallback(async () => {
    try {
      setInitialLoading(true);
      setErrorMessage("");

      // 1. Auto-generate hardware/browser fingerprint telemetry
      const browser = getBrowserName();
      const os = getOSName();
      const deviceName = getDeviceName();
      const fingerprint = await generateDeviceFingerprint();

      setDetectedBrowser(browser);
      setDetectedOS(os);
      setDetectedPlatformName(deviceName);
      setDetectedFingerprint(fingerprint);

      // 2. Fetch user's registered devices
      const devRes = await deviceService.getDevices();
      let matchedDev = null;

      if (devRes && devRes.success && devRes.devices) {
        setUserDevices(devRes.devices);

        // Find device that matches fingerprint or browser/os
        matchedDev =
          devRes.devices.find((d) => d.fingerprint === fingerprint) ||
          devRes.devices.find(
            (d) =>
              (d.browser || "").toLowerCase() === (browser || "").toLowerCase() &&
              (d.os || "").toLowerCase() === (os || "").toLowerCase()
          ) ||
          devRes.devices[0];

        if (matchedDev) {
          setSelectedDeviceId(matchedDev.id);
          setCurrentTrustScore(matchedDev.trust_score);
          setCurrentDeviceStatus(matchedDev.status);
        }
      }

      // 3. Attempt to fetch PBAC policies to see active rules
      try {
        const polRes = await policyService.getAllPolicies();
        if (polRes && polRes.success) {
          setAvailablePolicies(polRes.policies || []);
        }
      } catch (e) {
        // Silently ignore policy load if endpoint has restrictive permissions
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setErrorMessage("Could not initialize device telemetry. Using default profile.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    initTelemetryAndDevices();
  }, [initTelemetryAndDevices]);

  // When selected device changes manually
  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    const dev = userDevices.find((d) => String(d.id) === String(devId));
    if (dev) {
      setCurrentTrustScore(dev.trust_score);
      setCurrentDeviceStatus(dev.status);
    }
  };

  // Trigger Continuous Authentication Evaluation
  const handleVerifyAccess = async (e) => {
    if (e) e.preventDefault();
    if (evaluating) return;

    try {
      setEvaluating(true);
      setErrorMessage("");

      // Prepare payload with actual device telemetry
      const payload = {
        device_id: selectedDeviceId ? Number(selectedDeviceId) : undefined,
        fingerprint: detectedFingerprint || (await generateDeviceFingerprint()),
        browser: detectedBrowser || getBrowserName(),
        os: detectedOS || getOSName(),
        permission_id: Number(selectedPermissionId),
        resource_name: selectedResource
      };

      const response = await continuousAuthService.evaluateAccess(payload);

      const verifyTimestamp = new Date();
      setLastVerifiedTime(verifyTimestamp);

      if (response && response.success) {
        setEvaluationResult({
          decision: response.decision || "ALLOW",
          reason: response.reason || "Access granted by security policy.",
          user: response.user,
          device: response.device,
          policy: response.policy
        });

        // Update local trust score & status from backend response
        if (response.device) {
          if (response.device.trust_score !== undefined) {
            setCurrentTrustScore(response.device.trust_score);
          }
          if (response.device.status) {
            setCurrentDeviceStatus(response.device.status);
          }
        }

        // Add to session verification history (newest first)
        const matchedPermission = permissionOptions.find((p) => p.id === Number(selectedPermissionId));
        const historyEntry = {
          id: Date.now(),
          time: verifyTimestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          resource: selectedResource,
          permission: matchedPermission ? matchedPermission.name : `Permission #${selectedPermissionId}`,
          trustScore: response.device?.trust_score !== undefined ? response.device.trust_score : currentTrustScore || 80,
          device: userDevices.find((d) => String(d.id) === String(selectedDeviceId))?.device_name || detectedPlatformName || "Current Endpoint",
          decision: response.decision || "ALLOW"
        };

        setSessionHistory((prev) => [historyEntry, ...prev]);
      } else {
        // Handled as unexpected response format
        setErrorMessage(response?.message || "Unable to complete security verification.");
      }
    } catch (err) {
      const verifyTimestamp = new Date();
      setLastVerifiedTime(verifyTimestamp);

      // Check if backend returned structured DENY / MFA evaluation in 403 or error response
      if (err.response?.data?.decision) {
        const errorData = err.response.data;
        const decision = errorData.decision; // e.g. "DENY"

        setEvaluationResult({
          decision: decision,
          reason: errorData.reason || "Access denied by security policy.",
          user: errorData.user,
          device: errorData.device,
          policy: errorData.policy
        });

        if (errorData.device) {
          if (errorData.device.trust_score !== undefined) {
            setCurrentTrustScore(errorData.device.trust_score);
          }
          if (errorData.device.status) {
            setCurrentDeviceStatus(errorData.device.status);
          }
        }

        // Record DENY event in session verification history
        const matchedPermission = permissionOptions.find((p) => p.id === Number(selectedPermissionId));
        const historyEntry = {
          id: Date.now(),
          time: verifyTimestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          resource: selectedResource,
          permission: matchedPermission ? matchedPermission.name : `Permission #${selectedPermissionId}`,
          trustScore: errorData.device?.trust_score !== undefined ? errorData.device.trust_score : currentTrustScore || 0,
          device: userDevices.find((d) => String(d.id) === String(selectedDeviceId))?.device_name || detectedPlatformName || "Current Endpoint",
          decision: decision
        };

        setSessionHistory((prev) => [historyEntry, ...prev]);
      } else {
        // Standard HTTP Error handling according to specification
        const status = err.response?.status;
        if (status === 401) {
          setErrorMessage("Your session has expired. Please log in again.");
        } else if (status === 403) {
          setErrorMessage("Access denied by the security system.");
        } else if (status === 404) {
          setErrorMessage("Continuous authentication service is unavailable.");
        } else if (status === 500) {
          setErrorMessage("Security evaluation failed. Please try again.");
        } else {
          setErrorMessage(err.response?.data?.message || "Unable to complete security verification.");
        }
      }
    } finally {
      setEvaluating(false);
    }
  };

  // Helper for Trust Score Progress Bar Color
  const getScoreColor = (score) => {
    const num = Number(score) || 0;
    if (num >= 80) return "bg-success";
    if (num >= 50) return "bg-warning";
    return "bg-danger";
  };

  // Helper for Decision Badge
  const getDecisionBadge = (decision) => {
    const dec = (decision || "").toUpperCase();
    if (dec === "ALLOW") {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold fs-6">
          <i className="bi bi-check-circle-fill me-1"></i> ALLOW
        </span>
      );
    }
    if (dec === "DENY") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-bold fs-6">
          <i className="bi bi-x-circle-fill me-1"></i> DENY
        </span>
      );
    }
    if (dec === "MFA") {
      return (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-bold fs-6">
          <i className="bi bi-shield-lock-fill me-1"></i> MFA
        </span>
      );
    }
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-1 fw-semibold">
        PENDING
      </span>
    );
  };

  // Helper for Status Badge
  const getDeviceStatusBadge = (status) => {
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
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3 py-1">
        {status || "Unknown"}
      </span>
    );
  };

  const displayName = user?.full_name || "Employee User";
  const displayRole = user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee");
  const displayScore = currentTrustScore !== null ? currentTrustScore : 80;
  const currentDeviceObj = userDevices.find((d) => String(d.id) === String(selectedDeviceId));
  const displayDeviceName = currentDeviceObj?.device_name || detectedPlatformName || "Office Laptop";

  return (
    <DashboardLayout
      title="Continuous Authentication"
      subtitle="Continuously verify user, device, and policy trust before granting access to protected resources."
    >
      {/* Alert Banner for errors */}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
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
                Continuous Authentication
              </li>
            </ol>
          </nav>
          <span className="text-secondary small">
            Zero Trust Engine performs real-time policy evaluation on each request.
          </span>
        </div>

        <div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill small fw-semibold">
            <i className="bi bi-shield-check me-1"></i> Module 4: Live Access Verification
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SECURITY STATUS CARDS (4-METRIC ROW)                                    */}
      {/* ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Metric 1: Authentication Status */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-primary"
                  style={{ background: "#eef4ff" }}
                >
                  <i className="bi bi-person-check-fill fs-3" style={{ color: "#0047ab" }}></i>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold">
                  <i className="bi bi-patch-check-fill me-1"></i> Authenticated
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Authentication Status</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  Active JWT Zero Trust session
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Device Status */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center"
                  style={{
                    background:
                      currentDeviceStatus === "Trusted"
                        ? "#ecfdf5"
                        : currentDeviceStatus === "Pending"
                        ? "#fffbeb"
                        : "#fee2e2",
                    color:
                      currentDeviceStatus === "Trusted"
                        ? "#059669"
                        : currentDeviceStatus === "Pending"
                        ? "#d97706"
                        : "#dc2626"
                  }}
                >
                  <i className="bi bi-laptop fs-3"></i>
                </div>
                <div>{getDeviceStatusBadge(currentDeviceStatus)}</div>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Device Status</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  Hardware & browser verification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Trust Score */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center text-primary"
                  style={{ background: "#eef4ff" }}
                >
                  <i className="bi bi-shield-fill-check fs-3" style={{ color: "#0047ab" }}></i>
                </div>
                <span className="fw-bold fs-2 text-dark">
                  {initialLoading ? "..." : `${displayScore} / 100`}
                </span>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Trust Score</div>
                <div className="progress mb-1" style={{ height: "6px", backgroundColor: "#e2e8f0" }}>
                  <div
                    className={`progress-bar rounded-pill ${getScoreColor(displayScore)}`}
                    role="progressbar"
                    style={{ width: `${displayScore}%` }}
                    aria-valuenow={displayScore}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Dynamically evaluated by server
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Current Decision */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="rounded-3 p-3 d-flex align-items-center justify-content-center"
                  style={{ background: "#f8fafc" }}
                >
                  <i className="bi bi-shield-lock fs-3 text-secondary"></i>
                </div>
                <div>{getDecisionBadge(evaluationResult?.decision)}</div>
              </div>
              <div>
                <div className="fw-bold text-dark mb-1">Current Decision</div>
                <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                  {evaluationResult
                    ? `Last verdict: ${evaluationResult.decision}`
                    : "Awaiting access request"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN SECTION (ACCESS REQUEST FORM + SECURITY CONTEXT)          */}
      {/* ========================================================================= */}
      <div className="row g-4 mb-4">
        {/* Left Column: Request Protected Resource Access Form */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ background: "#eef4ff", color: "#0047ab" }}
                  >
                    <i className="bi bi-key-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Request Protected Resource Access</h5>
                    <span className="text-secondary small">
                      Trigger continuous authentication to evaluate real-time trust before access is granted
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyAccess}>
                <div className="row g-3 mb-4">
                  {/* Resource Select */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold text-dark small">
                      Target Protected Resource <span className="text-danger">*</span>
                    </label>
                    <select
                      id="resource-select"
                      className="form-select rounded-3 py-2 bg-light border text-dark fw-semibold"
                      value={selectedResource}
                      onChange={(e) => setSelectedResource(e.target.value)}
                      disabled={evaluating}
                    >
                      {resourceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Protected asset requested by employee.
                    </span>
                  </div>

                  {/* Permission Select */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold text-dark small">
                      Requested Permission <span className="text-danger">*</span>
                    </label>
                    <select
                      id="permission-select"
                      className="form-select rounded-3 py-2 bg-light border text-dark fw-semibold"
                      value={selectedPermissionId}
                      onChange={(e) => setSelectedPermissionId(Number(e.target.value))}
                      disabled={evaluating}
                    >
                      {permissionOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Specific operation to be verified against PBAC policies.
                    </span>
                  </div>

                  {/* Registered Device Selector */}
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark small">
                      Originating Device / Endpoint <span className="text-danger">*</span>
                    </label>
                    <select
                      id="device-select"
                      className="form-select rounded-3 py-2 bg-light border text-dark"
                      value={selectedDeviceId}
                      onChange={handleDeviceChange}
                      disabled={evaluating}
                    >
                      {userDevices.length === 0 ? (
                        <option value="">Current Hardware Telemetry (Auto-detected)</option>
                      ) : (
                        userDevices.map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.device_name} — {dev.browser} on {dev.os} ({dev.status}, Trust: {dev.trust_score}%)
                          </option>
                        ))
                      )}
                    </select>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Registered endpoint submitting authentication payload.
                    </span>
                  </div>

                  {/* Telemetry Preview Box */}
                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold text-dark small d-flex align-items-center gap-1">
                          <i className="bi bi-cpu text-primary"></i> Live Client Telemetry
                        </span>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0" style={{ fontSize: "0.7rem" }}>
                          Auto-Detected
                        </span>
                      </div>
                      <div className="row g-2 small text-secondary">
                        <div className="col-6 col-sm-3">
                          <span className="d-block text-muted" style={{ fontSize: "0.7rem" }}>Browser</span>
                          <span className="fw-semibold text-dark">{detectedBrowser || "Detecting..."}</span>
                        </div>
                        <div className="col-6 col-sm-3">
                          <span className="d-block text-muted" style={{ fontSize: "0.7rem" }}>OS</span>
                          <span className="fw-semibold text-dark">{detectedOS || "Detecting..."}</span>
                        </div>
                        <div className="col-6 col-sm-3">
                          <span className="d-block text-muted" style={{ fontSize: "0.7rem" }}>Device Status</span>
                          <span className="fw-semibold text-dark">{currentDeviceStatus}</span>
                        </div>
                        <div className="col-6 col-sm-3">
                          <span className="d-block text-muted" style={{ fontSize: "0.7rem" }}>Baseline Score</span>
                          <span className="fw-bold text-primary">{displayScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Verification Button */}
                <div className="d-flex align-items-center gap-3">
                  <button
                    id="btn-verify-access"
                    type="submit"
                    disabled={evaluating || initialLoading}
                    className="btn text-white fw-semibold rounded-3 px-4 py-3 d-flex align-items-center gap-2 shadow-sm flex-grow-1 justify-content-center"
                    style={{ background: "#0047ab" }}
                  >
                    {evaluating ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Evaluating security context...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-lock-fill fs-5"></i>
                        <span>Verify Access</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Current Security Context Card */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ background: "#eef4ff", color: "#0047ab" }}
                  >
                    <i className="bi bi-person-badge fs-5"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Current Security Context</h5>
                    <span className="text-secondary small">Live Zero Trust parameters</span>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column gap-3">
                {/* User Info Row */}
                <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: "42px",
                        height: "42px",
                        background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)"
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{displayName}</h6>
                      <span className="text-secondary small">{user?.email || "employee@trustguard.ai"}</span>
                    </div>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 small fw-semibold">
                    {displayRole}
                  </span>
                </div>

                {/* Attributes Grid */}
                <div className="row g-2 small">
                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 border">
                      <span className="text-muted d-block" style={{ fontSize: "0.7rem" }}>Device Name</span>
                      <span className="fw-semibold text-dark text-truncate d-block">{displayDeviceName}</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 border">
                      <span className="text-muted d-block" style={{ fontSize: "0.7rem" }}>Operating System</span>
                      <span className="fw-semibold text-dark">{detectedOS || "Windows"}</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 border">
                      <span className="text-muted d-block" style={{ fontSize: "0.7rem" }}>Browser</span>
                      <span className="fw-semibold text-dark">{detectedBrowser || "Google Chrome"}</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 border">
                      <span className="text-muted d-block" style={{ fontSize: "0.7rem" }}>Device Status</span>
                      <span className="fw-semibold text-dark">{currentDeviceStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Trust Score Progress Bar Widget */}
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-secondary small fw-semibold">Device Trust Score</span>
                    <span className="fw-bold text-dark">{displayScore} / 100</span>
                  </div>
                  <div className="progress mb-2" style={{ height: "8px", backgroundColor: "#e2e8f0" }}>
                    <div
                      className={`progress-bar rounded-pill ${getScoreColor(displayScore)}`}
                      role="progressbar"
                      style={{ width: `${displayScore}%` }}
                      aria-valuenow={displayScore}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.7rem" }}>
                    <span>0 (Blocked)</span>
                    <span>50 (Pending)</span>
                    <span>80–100 (Trusted)</span>
                  </div>
                </div>

                {/* Last Verification Timestamp */}
                <div className="d-flex justify-content-between align-items-center small text-secondary pt-1 px-1">
                  <span>Last Verification:</span>
                  <span className="fw-semibold text-dark">
                    {lastVerifiedTime ? lastVerifiedTime.toLocaleTimeString() : "Never evaluated in this session"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECURITY DECISION RESULT CARD                                          */}
      {/* ========================================================================= */}
      {evaluationResult && (
        <div className="mb-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            {/* Header with dynamic color depending on Decision */}
            <div
              className={`p-4 border-bottom ${
                evaluationResult.decision === "ALLOW"
                  ? "bg-success bg-opacity-10 border-success-subtle text-success"
                  : evaluationResult.decision === "DENY"
                  ? "bg-danger bg-opacity-10 border-danger-subtle text-danger"
                  : "bg-warning bg-opacity-10 border-warning-subtle text-warning"
              }`}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className={`rounded-circle p-3 d-flex align-items-center justify-content-center ${
                      evaluationResult.decision === "ALLOW"
                        ? "bg-success text-white"
                        : evaluationResult.decision === "DENY"
                        ? "bg-danger text-white"
                        : "bg-warning text-dark"
                    }`}
                    style={{ width: "56px", height: "56px" }}
                  >
                    <i
                      className={`bi ${
                        evaluationResult.decision === "ALLOW"
                          ? "bi-check-circle-fill fs-2"
                          : evaluationResult.decision === "DENY"
                          ? "bi-x-circle-fill fs-2"
                          : "bi-shield-lock-fill fs-2"
                      }`}
                    ></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1">
                      {evaluationResult.decision === "ALLOW"
                        ? "Access Granted"
                        : evaluationResult.decision === "DENY"
                        ? "Access Denied"
                        : "Additional Verification Required"}
                    </h4>
                    <p className="mb-0 small fw-medium">
                      {evaluationResult.reason ||
                        (evaluationResult.decision === "ALLOW"
                          ? "Access granted by security policy."
                          : evaluationResult.decision === "DENY"
                          ? "Access blocked by Zero Trust PBAC policy."
                          : "Additional authentication is required before access can continue.")}
                    </p>
                  </div>
                </div>

                <div>{getDecisionBadge(evaluationResult.decision)}</div>
              </div>
            </div>

            {/* Decision Body Attributes */}
            <div className="card-body p-4 bg-white">
              <h6 className="fw-bold text-dark small mb-3 text-uppercase" style={{ letterSpacing: "0.5px" }}>
                Evaluation Breakdown & Matched Policy
              </h6>

              <div className="row g-3">
                {/* Resource */}
                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted d-block small mb-1">Resource</span>
                    <span className="fw-bold text-dark">
                      {evaluationResult.policy?.resource_name || selectedResource}
                    </span>
                  </div>
                </div>

                {/* Permission */}
                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted d-block small mb-1">Permission</span>
                    <span className="fw-bold text-dark">
                      {evaluationResult.policy?.permission_name ||
                        permissionOptions.find((p) => p.id === Number(selectedPermissionId))?.name ||
                        `Permission #${selectedPermissionId}`}
                    </span>
                  </div>
                </div>

                {/* Matched Policy */}
                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted d-block small mb-1">Policy Name</span>
                    <span className="fw-bold text-primary">
                      {evaluationResult.policy?.policy_name || "PBAC Security Policy"}
                    </span>
                  </div>
                </div>

                {/* Device Trust & Status */}
                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted d-block small mb-1">Device Trust Score</span>
                    <span className="fw-bold text-dark">
                      {evaluationResult.device?.trust_score !== undefined
                        ? `${evaluationResult.device.trust_score}% (${evaluationResult.device.status || currentDeviceStatus})`
                        : `${displayScore}% (${currentDeviceStatus})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specific Decision Guidance Alerts */}
              {evaluationResult.decision === "ALLOW" && (
                <div className="alert alert-success rounded-3 mt-3 mb-0 d-flex align-items-center gap-2 small">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <div>
                    <strong>Continuous verification succeeded:</strong> Your user credentials, device trust posture, and PBAC policies satisfy all Zero Trust requirements.
                  </div>
                </div>
              )}

              {evaluationResult.decision === "DENY" && (
                <div className="alert alert-danger rounded-3 mt-3 mb-0 d-flex align-items-center gap-2 small">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                  <div>
                    <strong>Access Denied:</strong> Your current device posture or trust score does not meet the requirements of the configured security policy. Please contact your system administrator.
                  </div>
                </div>
              )}

              {evaluationResult.decision === "MFA" && (
                <div className="alert alert-warning rounded-3 mt-3 mb-0 d-flex align-items-center gap-2 small">
                  <i className="bi bi-shield-lock-fill fs-5"></i>
                  <div>
                    <strong>MFA Required:</strong> Additional authentication is required before access can continue. Step-up multi-factor verification is enforced by security policy.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CURRENT-SESSION VERIFICATION HISTORY TABLE                             */}
      {/* ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-clock-history text-primary me-2"></i> Current-Session Verification History
            </h5>
            <span className="text-secondary small">
              Live continuous evaluations recorded during this active browser session
            </span>
          </div>
          <span className="badge bg-light text-secondary border">
            {sessionHistory.length} {sessionHistory.length === 1 ? "evaluation" : "evaluations"}
          </span>
        </div>

        <div className="card-body p-0">
          {sessionHistory.length === 0 ? (
            <div className="p-5 text-center">
              <div
                className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                style={{ width: "54px", height: "54px", background: "#eef4ff", color: "#0047ab" }}
              >
                <i className="bi bi-shield-check fs-3"></i>
              </div>
              <h6 className="fw-bold text-dark mb-1">No evaluations in current session</h6>
              <p className="text-secondary small mb-0">
                Click <strong>"Request Access"</strong> above to perform real-time continuous authentication evaluation.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-uppercase text-secondary" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                    <th className="py-3 ps-4 fw-semibold">Time</th>
                    <th className="py-3 fw-semibold">Resource</th>
                    <th className="py-3 fw-semibold">Permission</th>
                    <th className="py-3 fw-semibold">Trust Score</th>
                    <th className="py-3 fw-semibold">Device</th>
                    <th className="py-3 pe-4 text-end fw-semibold">Decision</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {sessionHistory.map((item) => (
                    <tr key={item.id} className="border-bottom">
                      <td className="ps-4 py-3 fw-semibold text-dark">{item.time}</td>
                      <td className="py-3">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                          {item.resource}
                        </span>
                      </td>
                      <td className="py-3 text-dark fw-medium">{item.permission}</td>
                      <td className="py-3">
                        <span className="fw-bold text-dark">{item.trustScore}%</span>
                      </td>
                      <td className="py-3 text-secondary">{item.device}</td>
                      <td className="pe-4 py-3 text-end">{getDecisionBadge(item.decision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContinuousAuthentication;
