import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedDeviceRisk, setSelectedDeviceRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDevices();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleStatusChange = async (deviceId, newStatus) => {
    if (window.confirm(`Are you sure you want to mark this device as ${newStatus}?`)) {
      try {
        const result = await adminService.updateDeviceStatus(deviceId, newStatus);
        if (result.success) {
          loadDevices();
        } else {
          alert(result.message || "Failed to update device status.");
        }
      } catch (error) {
        alert("An error occurred while updating device status.");
      }
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm("Are you sure you want to REMOVE this device completely? This action cannot be undone.")) {
      try {
        const result = await adminService.deleteDevice(deviceId);
        if (result.success) {
          loadDevices();
        } else {
          alert(result.message || "Failed to delete device.");
        }
      } catch (error) {
        alert("An error occurred while deleting the device.");
      }
    }
  };

  const handleViewRisk = async (deviceId) => {
    try {
      setShowRiskModal(true);
      setRiskLoading(true);
      setSelectedDeviceRisk(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/devices/${deviceId}/risk`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDeviceRisk({ deviceId, ...data });
      } else {
        alert(data.message || "Failed to load risk factors");
        setShowRiskModal(false);
      }
    } catch (err) {
      alert("Failed to load risk factors");
      setShowRiskModal(false);
    } finally {
      setRiskLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Trusted":
        return "bg-success-subtle text-success border border-success-subtle";
      case "Pending":
        return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "Blocked":
        return "bg-danger-subtle text-danger border border-danger-subtle";
      default:
        return "bg-light text-dark border";
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = (device.device_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (device.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (device.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || device.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Device Management</h4>
          <p className="text-secondary small mb-0">Monitor and enforce trust levels for all connected hardware</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by user, email, or device name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select 
                className="form-select bg-light"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Trust Statuses</option>
                <option value="Trusted">Trusted</option>
                <option value="Pending">Pending</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            <div className="col-md-2">
               <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchTerm(""); setFilterStatus("All"); }}>
                 <i className="bi bi-arrow-clockwise"></i> Reset
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
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-laptop fs-1 mb-2 d-block"></i>
              <p>No devices found matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small">
                  <tr>
                    <th className="ps-4 py-3 border-0">USER</th>
                    <th className="py-3 border-0">DEVICE / ENV</th>
                    <th className="py-3 border-0">IP / IDENTIFIER</th>
                    <th className="py-3 border-0">TRUST SCORE</th>
                    <th className="py-3 border-0">STATUS</th>
                    <th className="py-3 border-0">LAST SEEN</th>
                    <th className="pe-4 py-3 border-0 text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredDevices.map((device) => (
                    <tr key={device.id}>
                      <td className="ps-4 py-3">
                        <div className="fw-semibold text-dark">{device.full_name || "Unknown"}</div>
                        <div className="text-secondary" style={{ fontSize: "0.75rem" }}>{device.email || "No email"}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-medium">{device.device_name}</div>
                        <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          {device.os} &bull; {device.browser}
                        </div>
                      </td>
                      <td className="py-3">
                         <code className="text-secondary bg-light px-2 py-1 rounded border">
                           {device.fingerprint ? `${device.fingerprint.substring(0, 12)}...` : "Unknown"}
                         </code>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                           <div className="progress flex-grow-1" style={{ height: "6px", maxWidth: "80px" }}>
                             <div 
                               className={`progress-bar ${device.trust_score >= 80 ? 'bg-success' : device.trust_score >= 50 ? 'bg-warning' : 'bg-danger'}`} 
                               style={{ width: `${device.trust_score}%` }}>
                             </div>
                           </div>
                           <span className="small fw-semibold">{device.trust_score}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${getStatusBadgeClass(device.status)}`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3 text-secondary">
                        {device.last_used ? new Date(device.last_used).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Control
                          </button>
                          <ul className="dropdown-menu shadow-sm">
                            <li>
                              <button className="dropdown-item small py-2 text-info d-flex align-items-center gap-2" onClick={() => handleViewRisk(device.id)}>
                                <i className="bi bi-search"></i> View Risk Factors
                              </button>
                            </li>
                            {device.status !== "Trusted" && (
                              <li>
                                <button className="dropdown-item small py-2 text-success d-flex align-items-center gap-2" onClick={() => handleStatusChange(device.id, "Trusted")}>
                                  <i className="bi bi-check-circle"></i> Approve (Trust)
                                </button>
                              </li>
                            )}
                            {device.status !== "Blocked" && (
                              <li>
                                <button className="dropdown-item small py-2 text-warning d-flex align-items-center gap-2" onClick={() => handleStatusChange(device.id, "Blocked")}>
                                  <i className="bi bi-x-circle"></i> Decline (Block)
                                </button>
                              </li>
                            )}
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item small py-2 text-danger d-flex align-items-center gap-2" onClick={() => handleDeleteDevice(device.id)}>
                                <i className="bi bi-trash"></i> Remove Device
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

      {/* Risk Factors Modal */}
      {showRiskModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title"><i className="bi bi-shield-exclamation me-2 text-warning"></i>Live Risk Factors</h5>
                <button type="button" className="btn-close" onClick={() => setShowRiskModal(false)}></button>
              </div>
              <div className="modal-body">
                {riskLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                ) : selectedDeviceRisk ? (
                  <div>
                    <h6 className="mb-3">Current Risk Score: <span className="text-danger fw-bold">{selectedDeviceRisk.riskScore}/100</span></h6>
                    <ul className="list-group list-group-flush">
                      {selectedDeviceRisk.factors.length > 0 ? (
                        selectedDeviceRisk.factors.map((factor, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span>{factor.reason}</span>
                            <span className="badge bg-danger rounded-pill">+{factor.score}</span>
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item text-success px-0"><i className="bi bi-check-circle-fill me-2"></i>No active risk factors detected.</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="text-danger">Failed to load data.</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRiskModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DeviceManagement;
