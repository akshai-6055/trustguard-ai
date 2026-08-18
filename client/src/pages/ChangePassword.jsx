import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import profileService from "../services/profileService";
import DashboardLayout from "../layouts/DashboardLayout";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 1. Required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }

    // 2. Minimum 8 characters check
    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    // 3. Passwords match check
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await profileService.changePassword(currentPassword, newPassword, confirmPassword);
      setLoading(false);

      if (response.success) {
        setSuccessMessage("Password changed successfully! Redirecting to profile...");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        setErrorMessage(response.message || "Failed to update password.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.response?.data?.message || "Error updating password. Check current password.");
    }
  };

  return (
    <DashboardLayout
      title="Change Security Password"
      subtitle="Update your account password using zero-trust hash standards"
    >
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
            <h4 className="fw-bold text-dark mb-4">
              <i className="bi bi-key-fill text-primary me-2"></i> Update Password
            </h4>

            {/* Bootstrap Alerts */}
            {errorMessage && (
              <div className="alert alert-danger rounded-3 small py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success rounded-3 small py-2 mb-3" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> {successMessage}
              </div>
            )}

             {/* PASSWORD INFORMATION */}
              <div className="alert alert-info rounded-3 small mb-4">
                <i className="bi bi-shield-lock-fill me-2"></i>

                To change your password, use the{" "}
                <strong>Change Password</strong> option. Password
                changes require verification of your current password.
              </div>
              
            <form onSubmit={handleSubmit}>
              {/* Current Password */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Current Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="form-control form-control-lg bg-light border-start-0 border-end-0 fs-6"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    <i className={showCurrent ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                  </button>
                </div>
              </div>
              {/* New Password */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">New Password (Min 8 characters)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-lock-fill"></i>
                  </span>
                  <input
                    type={showNew ? "text" : "password"}
                    className="form-control form-control-lg bg-light border-start-0 border-end-0 fs-6"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowNew(!showNew)}
                  >
                    <i className={showNew ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Confirm New Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control form-control-lg bg-light border-start-0 fs-6"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span> Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock"></i> Update Password
                    </>
                  )}
                </button>

                <Link to="/profile" className="btn btn-light border rounded-3 px-4 py-2 fw-semibold text-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
