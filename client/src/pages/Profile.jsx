import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import profileService from "../services/profileService";
import DashboardLayout from "../layouts/DashboardLayout";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        if (data.success) {
          setProfileData(data.user);
          updateUser(data.user);
        } else {
          setErrorMessage(data.message || "Failed to fetch user profile.");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Error retrieving profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayUser = profileData || user;
  const creationDate = displayUser?.created_at
    ? new Date(displayUser.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "N/A";

  return (
    <DashboardLayout
      title="My User Profile"
      subtitle="View your zero trust credentials and active account details"
    >
      {errorMessage && (
        <div className="alert alert-danger rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            {/* Header pattern */}
            <div
              className="p-4 text-white position-relative"
              style={{ background: "linear-gradient(135deg, #0047ab 0%, #0d6efd 100%)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center shadow"
                  style={{ width: "64px", height: "64px", fontSize: "1.75rem" }}
                >
                  {displayUser?.full_name ? displayUser.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="fw-bold mb-1">{displayUser?.full_name || "User Profile"}</h3>
                  <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-20 px-3 py-1 rounded-pill">
                    {displayUser?.role_name || (displayUser?.role_id === 1 ? "Administrator" : "Employee")}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information List */}
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">
                <i className="bi bi-person-lines-fill text-primary me-2"></i> User Information
              </h5>

              <div className="row g-4 mb-4">
                {/* Full Name */}
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold text-uppercase d-block mb-1">Full Name</label>
                  <div className="p-3 bg-light rounded-3 border fw-semibold text-dark">
                    {loading ? "..." : displayUser?.full_name}
                  </div>
                </div>

                {/* Email Address */}
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold text-uppercase d-block mb-1">Work Email</label>
                  <div className="p-3 bg-light rounded-3 border fw-semibold text-dark text-truncate">
                    {loading ? "..." : displayUser?.email}
                  </div>
                </div>

                {/* Role */}
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold text-uppercase d-block mb-1">System Role</label>
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-6">
                      {displayUser?.role_name || (displayUser?.role_id === 1 ? "Administrator" : "Employee")}
                    </span>
                  </div>
                </div>

                {/* Account Status */}
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold text-uppercase d-block mb-1">Account Status</label>
                  <div className="p-3 bg-light rounded-3 border">
                    <span className={`badge ${displayUser?.account_status === "active" ? "bg-success-subtle text-success border border-success-subtle" : "bg-warning-subtle text-warning border border-warning-subtle"} px-3 py-2 fs-6 text-capitalize`}>
                      <i className="bi bi-shield-check me-1"></i> {displayUser?.account_status || "Active"}
                    </span>
                  </div>
                </div>

                {/* Account Creation Date */}
                <div className="col-12">
                  <label className="text-muted small fw-semibold text-uppercase d-block mb-1">Account Creation Date</label>
                  <div className="p-3 bg-light rounded-3 border text-dark">
                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                    {loading ? "..." : creationDate}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-3 pt-3 border-top">
                <Link to="/profile/edit" className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-pencil-square"></i> Edit Profile
                </Link>
                <Link to="/change-password" className="btn btn-outline-secondary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-key-fill"></i> Change Password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
