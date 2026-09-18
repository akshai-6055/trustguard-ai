import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";
import { useParams, Link, useNavigate } from "react-router-dom";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const data = await adminService.getUserById(id);
        if (data.success) {
          setUser(data.user);
        } else {
          alert("User not found.");
          navigate("/admin/users");
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) return null;

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link to="/admin/users" className="text-decoration-none text-secondary small d-flex align-items-center gap-1 hover-text-primary mb-2">
          <i className="bi bi-arrow-left"></i> Back to Users
        </Link>
        <h4 className="fw-bold text-dark mb-1">User Profile Details</h4>
        <p className="text-secondary small mb-0">Detailed view of account information and security status</p>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 text-center">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 text-secondary fw-bold border" style={{ width: "96px", height: "96px", fontSize: "2rem" }}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <h4 className="fw-bold text-dark mb-1">{user.full_name}</h4>
              <p className="text-secondary small mb-3">{user.email}</p>
              
              <div className="d-flex justify-content-center gap-2 mb-4">
                <span className={`badge px-3 py-2 ${user.role_id === 1 ? "bg-primary-subtle text-primary border border-primary-subtle" : "bg-light text-dark border"}`}>
                  {user.role_name}
                </span>
                <span className={`badge px-3 py-2 ${user.account_status === "Active" ? "bg-success-subtle text-success border border-success-subtle" : "bg-danger-subtle text-danger border border-danger-subtle"}`}>
                  {user.account_status || "Active"}
                </span>
              </div>
            </div>
            <div className="card-footer bg-white border-top p-4">
               <div className="d-flex justify-content-between mb-2 small">
                 <span className="text-secondary fw-medium">User ID</span>
                 <span className="text-dark font-monospace">{user.id}</span>
               </div>
               <div className="d-flex justify-content-between small">
                 <span className="text-secondary fw-medium">Joined Date</span>
                 <span className="text-dark">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
           <div className="card border-0 shadow-sm rounded-4 h-100">
             <div className="card-header bg-white border-bottom p-4">
                <h6 className="fw-bold text-dark mb-0">Security Information</h6>
             </div>
             <div className="card-body p-4">
                <div className="alert bg-light border-0 d-flex align-items-center gap-3 py-3 mb-4">
                   <div className="bg-primary text-white rounded p-2">
                     <i className="bi bi-shield-lock-fill fs-5"></i>
                   </div>
                   <div>
                     <h6 className="fw-bold text-dark mb-1">Zero Trust Security Verified</h6>
                     <p className="small text-secondary mb-0">This user is subject to continuous authentication and PBAC policies.</p>
                   </div>
                </div>
                
                <h6 className="fw-bold text-dark mb-3">Linked Devices</h6>
                <p className="small text-secondary">To view devices linked to this user, navigate to the <Link to="/admin/devices">Device Management</Link> portal and filter by this user's email.</p>
             </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserDetails;
