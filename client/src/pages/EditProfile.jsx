import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import profileService from "../services/profileService";
import DashboardLayout from "../layouts/DashboardLayout";

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 1. Required fields validation
    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Full Name and Email are required.");
      return;
    }

    // 2. Email format validation
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email format (e.g. name@company.com).");
      return;
    }

    setLoading(true);

    try {
      const response = await profileService.updateProfile(fullName.trim(), email.trim());
      setLoading(false);

      if (response.success) {
        setSuccessMessage("Profile updated successfully!");
        if (response.user) {
          updateUser(response.user);
        } else {
          updateUser({ full_name: fullName.trim(), email: email.trim() });
        }
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        setErrorMessage(response.message || "Failed to update profile.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.response?.data?.message || "Failed to update profile. Email may already exist.");
    }
  };

  return (
    <DashboardLayout
      title="Edit Profile"
      subtitle="Update your personal details and identity information"
    >
       <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
            <h4 className="fw-bold text-dark mb-4">
              <i className="bi bi-pencil-square text-primary me-2"></i> Update Personal Details
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

            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-person-fill"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg bg-light border-start-0 fs-6"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Work Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-envelope-fill"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control form-control-lg bg-light border-start-0 fs-6"
                    placeholder="john@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Display Read-Only Info */}
              <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                <div className="col-md-6">
                  <span className="text-muted small d-block mb-1">Role (Read Only)</span>
                  <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                    {user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee")}
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted small d-block mb-1">Account Status (Read Only)</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 text-capitalize">
                    {user?.account_status || "Active"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="d-flex align-items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span> Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i> Save Changes
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

export default EditProfile;
