import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axiosInstance from "../services/axiosInstance";

const LoginHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/user/login-history");
        if (res.data.success) {
          setHistory(res.data.loginHistory);
        } else {
          setErrorMessage(res.data.message || "Failed to load login history.");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Error retrieving login history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <DashboardLayout
      title="Login History"
      subtitle="Review your recent account access activity and device usage."
    >
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom text-uppercase text-secondary" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                <th className="fw-semibold ps-0 py-2">DATE & TIME</th>
                <th className="fw-semibold py-2">DEVICE / BROWSER</th>
                <th className="fw-semibold py-2">LOCATION</th>
                <th className="fw-semibold text-end pe-0 py-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="small">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </td>
                </tr>
              ) : history && history.length > 0 ? (
                history.map((activity, idx) => (
                  <tr key={idx} className="border-bottom">
                    <td className="ps-0 py-3 fw-medium text-dark">
                      {new Date(activity.login_time).toLocaleString("en-GB", { 
                        day: "2-digit", month: "short", year: "numeric", 
                        hour: "2-digit", minute: "2-digit" 
                      })}
                    </td>
                    <td className="py-3 text-secondary">
                      <div className="fw-medium text-dark">{activity.device_name}</div>
                      <div style={{ fontSize: "0.75rem" }}>{activity.browser}</div>
                    </td>
                    <td className="py-3 text-secondary">{activity.location}</td>
                    <td className="text-end pe-0 py-3">
                      <span className={`badge rounded-pill px-3 py-1 ${
                        activity.status === "Success" ? "bg-success-subtle text-success border border-success-subtle" :
                        activity.status === "Pending" ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle" :
                        "bg-danger-subtle text-danger border border-danger-subtle"
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-secondary">No login history available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LoginHistory;
