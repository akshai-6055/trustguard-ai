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

  // ============================================================
  // FULL NAME VALIDATION
  // ============================================================

  const validateFullName = (name) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Full Name is required.";
    }

    if (trimmedName.length < 2) {
      return "Full Name must contain at least 2 characters.";
    }

    if (trimmedName.length > 100) {
      return "Full Name cannot exceed 100 characters.";
    }

    // Letters, spaces, hyphens and apostrophes only
    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!nameRegex.test(trimmedName)) {
      return "Full Name can contain only letters, spaces, hyphens, and apostrophes.";
    }

    return "";
  };

  // ============================================================
  // STRICT EMAIL VALIDATION
  // ============================================================

  const validateEmail = (emailStr) => {
    const trimmedEmail = emailStr.trim();

    // Required
    if (!trimmedEmail) {
      return "Email address is required.";
    }

    // Maximum email length
    if (trimmedEmail.length > 254) {
      return "Email address cannot exceed 254 characters.";
    }

    // No spaces
    if (/\s/.test(trimmedEmail)) {
      return "Email address cannot contain spaces.";
    }

    // Must contain exactly one @
    const atMatches = trimmedEmail.match(/@/g);

    if (!atMatches || atMatches.length !== 1) {
      return "Please enter a valid email address.";
    }

    const [localPart, domainPart] = trimmedEmail.split("@");

    // Local part validation
    if (!localPart) {
      return "Email address must contain a username before @.";
    }

    if (localPart.length > 64) {
      return "The email username cannot exceed 64 characters.";
    }

    // Cannot start or end with dot
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return "Email username cannot start or end with a dot.";
    }

    // Cannot contain consecutive dots
    if (localPart.includes("..")) {
      return "Email username cannot contain consecutive dots.";
    }

    // Allowed characters in email username
    const localPartRegex =
      /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;

    if (!localPartRegex.test(localPart)) {
      return "Email username contains invalid characters.";
    }

    // ============================================================
    // DOMAIN VALIDATION
    // ============================================================

    if (!domainPart) {
      return "Email domain is required.";
    }

    if (domainPart.length > 253) {
      return "Email domain is too long.";
    }

    // Domain cannot contain consecutive dots
    if (domainPart.includes("..")) {
      return "Email domain cannot contain consecutive dots.";
    }

    // Domain must contain at least one dot
    if (!domainPart.includes(".")) {
      return "Please enter a complete email address such as name@gmail.com.";
    }

    // Domain cannot start or end with dot
    if (domainPart.startsWith(".") || domainPart.endsWith(".")) {
      return "Email domain is invalid.";
    }

    // Split domain into labels
    const domainLabels = domainPart.split(".");

    // Validate each domain section
    const domainLabelRegex = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

    for (const label of domainLabels) {
      if (!label) {
        return "Email domain is invalid.";
      }

      if (label.length > 63) {
        return "Email domain section is too long.";
      }

      if (!domainLabelRegex.test(label)) {
        return "Email domain contains invalid characters.";
      }
    }

    // Validate top-level domain
    const topLevelDomain = domainLabels[domainLabels.length - 1];

    if (topLevelDomain.length < 2) {
      return "Email domain extension must contain at least 2 characters.";
    }

    if (!/^[A-Za-z]+$/.test(topLevelDomain)) {
      return "Email domain extension must contain only letters.";
    }

    return "";
  };

  // ============================================================
  // EMAIL CHANGE
  // ============================================================

  const handleEmailChange = (e) => {
    // Always convert email to lowercase
    const lowercaseEmail = e.target.value.toLowerCase();

    setEmail(lowercaseEmail);

    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // ============================================================
  // FULL NAME CHANGE
  // ============================================================

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // Clean values
    const cleanedFullName = fullName.trim();
    const cleanedEmail = email.trim().toLowerCase();

    // ============================================================
    // 1. FULL NAME VALIDATION
    // ============================================================

    const nameError = validateFullName(cleanedFullName);

    if (nameError) {
      setErrorMessage(nameError);
      return;
    }

    // ============================================================
    // 2. EMAIL VALIDATION
    // ============================================================

    const emailError = validateEmail(cleanedEmail);

    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    // ============================================================
    // 3. CHECK WHETHER ANYTHING CHANGED
    // ============================================================

    const currentName = (user?.full_name || "").trim();
    const currentEmail = (user?.email || "").trim().toLowerCase();

    if (
      cleanedFullName === currentName &&
      cleanedEmail === currentEmail
    ) {
      setErrorMessage("No changes were made to your profile.");
      return;
    }

    // ============================================================
    // 4. UPDATE PROFILE
    // ============================================================

    setLoading(true);

    try {
      const response = await profileService.updateProfile(
        cleanedFullName,
        cleanedEmail
      );

      setLoading(false);

      if (response?.success) {
        setSuccessMessage("Profile updated successfully!");

        // Update AuthContext
        if (response.user) {
          updateUser(response.user);
        } else {
          updateUser({
            full_name: cleanedFullName,
            email: cleanedEmail,
          });
        }

        // Return to profile page
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      } else {
        setErrorMessage(
          response?.message || "Failed to update profile."
        );
      }
    } catch (err) {
      setLoading(false);

      // Duplicate email
      if (err.response?.status === 409) {
        setErrorMessage(
          "This email address is already registered with another account."
        );
        return;
      }

      // Unauthorized
      if (err.response?.status === 401) {
        setErrorMessage(
          "Your session has expired. Please log in again."
        );
        return;
      }

      // Other errors
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
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

            {/* TITLE */}
            <h4 className="fw-bold text-dark mb-4">
              <i className="bi bi-pencil-square text-primary me-2"></i>
              Update Personal Details
            </h4>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div
                className="alert alert-danger rounded-3 small py-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMessage}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {successMessage && (
              <div
                className="alert alert-success rounded-3 small py-2 mb-3"
                role="alert"
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                {successMessage}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} noValidate>

              {/* FULL NAME */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Full Name <span className="text-danger">*</span>
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-person-fill"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control form-control-lg bg-light border-start-0 fs-6"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={handleFullNameChange}
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>

                <div className="form-text">
                  2–100 characters. Letters, spaces, hyphens and
                  apostrophes only.
                </div>
              </div>

              {/* EMAIL */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">
                  Work Email Address{" "}
                  <span className="text-danger">*</span>
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-envelope-fill"></i>
                  </span>

                  <input
                    type="email"
                    className="form-control form-control-lg bg-light border-start-0 fs-6"
                    placeholder="john@company.com"
                    value={email}
                    onChange={handleEmailChange}
                    maxLength={254}
                    autoComplete="email"
                  />
                </div>

                <div className="form-text">
                  Email addresses are automatically converted to lowercase.
                </div>
              </div>

              {/* READ ONLY INFORMATION */}
              <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">

                <div className="col-md-6">
                  <span className="text-muted small d-block mb-1">
                    Role (Read Only)
                  </span>

                  <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                    {user?.role_name ||
                      (user?.role_id === 1
                        ? "Administrator"
                        : "Employee")}
                  </span>
                </div>

                <div className="col-md-6">
                  <span className="text-muted small d-block mb-1">
                    Account Status (Read Only)
                  </span>

                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 text-capitalize">
                    {user?.account_status || "Active"}
                  </span>
                </div>

              </div>
              {/* BUTTONS */}
              <div className="d-flex align-items-center gap-3">

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      Save Changes
                    </>
                  )}
                </button>

                <Link
                  to="/profile"
                  className="btn btn-light border rounded-3 px-4 py-2 fw-semibold text-secondary"
                >
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