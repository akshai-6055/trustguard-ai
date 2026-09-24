import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";
import { Link } from "react-router-dom";
import { Modal } from "bootstrap";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [modalMode, setModalMode] = useState("create");
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", role_id: 2, account_status: "Active" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const modalRef = React.useRef(null);

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

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ full_name: "", email: "", password: "", role_id: 2, account_status: "Active" });
    setEditingId(null);
    setFormError("");
    const modal = new Modal(modalRef.current);
    modal.show();
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setEditingId(user.id);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role_id: user.role_id,
      account_status: user.account_status || "Active"
    });
    setFormError("");
    const modal = new Modal(modalRef.current);
    modal.show();
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.full_name || !formData.email || (modalMode === "create" && !formData.password)) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      let result;
      if (modalMode === "create") {
        result = await adminService.createUser(formData);
      } else {
        result = await adminService.updateUser(editingId, formData);
      }

      if (result.success) {
        Modal.getInstance(modalRef.current)?.hide();
        loadUsers();
      } else {
        setFormError(result.message || "Failed to save user.");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) loadUsers();
      else alert(result.message || "Failed to delete user.");
    } catch (err) {
      alert("Error deleting user.");
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
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-plus-circle-fill"></i> New User
        </button>
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
                            <li>
                              <button className="dropdown-item small py-2 d-flex align-items-center gap-2" onClick={() => openEditModal(user)}>
                                <i className="bi bi-pencil"></i> Edit User
                              </button>
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
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item small py-2 text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(user.id, user.full_name)}>
                                <i className="bi bi-trash"></i> Delete User
                              </button>
                            </li>
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

      {/* Create / Edit User Modal */}
      <div className="modal fade" id="userModal" tabIndex="-1" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header border-0 bg-dark text-white rounded-top-4 px-4 py-3">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className={`bi ${modalMode === "create" ? "bi-person-plus-fill" : "bi-pencil-fill"} text-primary`}></i>
                {modalMode === "create" ? "Create New User" : "Edit User"}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body px-4 py-4">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  {formError}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold small text-secondary">FULL NAME <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-secondary">EMAIL ADDRESS <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-secondary">PASSWORD {modalMode === "create" ? <span className="text-danger">*</span> : "(Leave blank to keep current)"}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">ROLE</label>
                  <select className="form-select" value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}>
                    <option value={1}>Administrator</option>
                    <option value={2}>Employee</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-secondary">STATUS</label>
                  <select className="form-select" value={formData.account_status} onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 px-4 py-3">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                ) : (
                  <><i className="bi bi-check-circle-fill"></i> Save User</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
