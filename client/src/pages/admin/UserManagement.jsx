import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";
import { Link } from "react-router-dom";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) {
      try {
        const result = await adminService.updateUserStatus(userId, newStatus);
        if (result.success) {
          loadUsers();
        } else {
          alert(result.message || "Failed to update status.");
        }
      } catch (error) {
        alert("An error occurred while updating status.");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "All" || user.role_name === filterRole;
    const matchesStatus = filterStatus === "All" || user.account_status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">User Management</h4>
          <p className="text-secondary small mb-0">Manage enterprise accounts, roles, and access status</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select bg-light" 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select bg-light"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            <div className="col-md-1">
               <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchTerm(""); setFilterRole("All"); setFilterStatus("All"); }}>
                 <i className="bi bi-arrow-clockwise"></i>
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-inbox fs-1 mb-2 d-block"></i>
              <p>No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small">
                  <tr>
                    <th className="ps-4 py-3 border-0">NAME</th>
                    <th className="py-3 border-0">EMAIL</th>
                    <th className="py-3 border-0">ROLE</th>
                    <th className="py-3 border-0">STATUS</th>
                    <th className="py-3 border-0">CREATED DATE</th>
                    <th className="pe-4 py-3 border-0 text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="ps-4 py-3 fw-semibold text-dark">{user.full_name}</td>
                      <td className="py-3 text-secondary">{user.email}</td>
                      <td className="py-3">
                        <span className={`badge ${user.role_id === 1 ? "bg-primary-subtle text-primary border border-primary-subtle" : "bg-light text-dark border"}`}>
                          {user.role_name}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${user.account_status === "Active" ? "bg-success-subtle text-success border border-success-subtle" : "bg-danger-subtle text-danger border border-danger-subtle"}`}>
                          {user.account_status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-secondary">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Actions
                          </button>
                          <ul className="dropdown-menu shadow-sm">
                            <li>
                              <Link className="dropdown-item small py-2 d-flex align-items-center gap-2" to={`/admin/users/${user.id}`}>
                                <i className="bi bi-eye"></i> View Profile
                              </Link>
                            </li>
                            {user.account_status === "Active" ? (
                              <li>
                                <button className="dropdown-item small py-2 text-danger d-flex align-items-center gap-2" onClick={() => handleStatusChange(user.id, "Blocked")}>
                                  <i className="bi bi-person-x"></i> Block User
                                </button>
                              </li>
                            ) : (
                              <li>
                                <button className="dropdown-item small py-2 text-success d-flex align-items-center gap-2" onClick={() => handleStatusChange(user.id, "Active")}>
                                  <i className="bi bi-person-check"></i> Unblock User
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
