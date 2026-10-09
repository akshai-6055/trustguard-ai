import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axiosInstance from "../services/axiosInstance";

const SecurityNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/user/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
        } else {
          setErrorMessage(res.data.message || "Failed to load security notifications.");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Error retrieving security notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getIconAndColor = (action, module) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("fail") || actionLower.includes("anomaly") || actionLower.includes("block")) {
      return { icon: "bi-exclamation-triangle-fill", color: "danger", level: "HIGH" };
    }
    if (actionLower.includes("decay") || actionLower.includes("warn")) {
      return { icon: "bi-exclamation-circle-fill", color: "warning", level: "MEDIUM" };
    }
    return { icon: "bi-check-circle-fill", color: "success", level: "LOW" };
  };

  return (
    <DashboardLayout
      title="Security Notifications"
      subtitle="Monitor all security events and audit logs related to your account."
    >
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h5 className="fw-bold text-dark mb-0">All Notifications</h5>
          <span className="badge bg-primary rounded-pill px-3 py-2">
            {notifications.length} Total
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-secondary">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {notifications.map((notif) => {
              const { icon, color, level } = getIconAndColor(notif.action, notif.module);
              return (
                <div key={notif.id} className={`p-3 bg-${color}-subtle bg-opacity-10 rounded-3 border border-${color}-subtle d-flex align-items-center justify-content-between`}>
                  <div className="d-flex align-items-center gap-3">
                    <div className={`text-${color} fs-4`}><i className={`bi ${icon}`}></i></div>
                    <div>
                      <div className="fw-bold text-dark">{notif.action}</div>
                      <div className="text-secondary small mb-1">{notif.description}</div>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {new Date(notif.created_at).toLocaleString("en-GB", { 
                          day: "2-digit", month: "short", year: "numeric", 
                          hour: "2-digit", minute: "2-digit" 
                        })} • {notif.module}
                      </span>
                    </div>
                  </div>
                  <span className={`badge bg-${color} text-white px-2 py-1 align-self-start`} style={{ fontSize: "0.65rem" }}>
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-bell-slash fs-1 text-muted mb-2 d-block"></i>
            No security notifications found.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SecurityNotifications;
