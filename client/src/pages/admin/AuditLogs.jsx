import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import adminService from "../../services/adminService";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAuditLogs();
        if (res.success) setLogs(res.logs);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.device_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const headers = ["ID", "User", "Email", "Device", "Browser", "Location", "Timestamp", "Status"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.full_name || "Unknown",
      l.email || "",
      l.device_name || "",
      l.browser || "",
      l.location || "",
      l.login_time ? new Date(l.login_time).toLocaleString() : "",
      l.status || ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Audit Logs</h4>
          <p className="text-secondary small mb-0">
            Complete chronological trail of all system access and authentication events
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={handleExport}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="text-secondary small fw-semibold mb-1">TOTAL EVENTS</div>
            <h3 className="fw-bold text-dark mb-0">{loading ? "..." : logs.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="text-secondary small fw-semibold mb-1">SUCCESSFUL LOGINS</div>
            <h3 className="fw-bold text-success mb-0">
              {loading ? "..." : logs.filter(l => l.status === "Success").length}
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="text-secondary small fw-semibold mb-1">FAILED / BLOCKED</div>
            <h3 className="fw-bold text-danger mb-0">
              {loading ? "..." : logs.filter(l => l.status !== "Success").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by user, email, or device..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select bg-light"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100"
                onClick={() => { setSearchTerm(""); setFilterStatus("All"); setCurrentPage(1); }}>
                <i className="bi bi-arrow-clockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-journal-x fs-1 d-block mb-2 opacity-50"></i>
              <p>No log entries match your criteria.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light text-secondary">
                    <tr>
                      <th className="ps-4 py-3 border-0">#</th>
                      <th className="py-3 border-0">USER</th>
                      <th className="py-3 border-0">DEVICE / BROWSER</th>
                      <th className="py-3 border-0">LOCATION</th>
                      <th className="py-3 border-0">TIMESTAMP</th>
                      <th className="py-3 border-0">ROLE</th>
                      <th className="pe-4 py-3 border-0">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log, i) => (
                      <tr key={log.id}>
                        <td className="ps-4 py-2 text-secondary font-monospace">{log.id}</td>
                        <td className="py-2">
                          <div className="fw-semibold text-dark">{log.full_name || "Unknown"}</div>
                          <div className="text-secondary" style={{ fontSize: "0.73rem" }}>{log.email}</div>
                        </td>
                        <td className="py-2">
                          <div className="text-dark">{log.device_name || "—"}</div>
                          <div className="text-secondary" style={{ fontSize: "0.73rem" }}>{log.browser || "—"}</div>
                        </td>
                        <td className="py-2 text-secondary">{log.location || "—"}</td>
                        <td className="py-2 text-secondary">
                          {log.login_time
                            ? new Date(log.login_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                            : "—"}
                        </td>
                        <td className="py-2">
                          <span className={`badge ${log.role_id === 1 ? "bg-primary-subtle text-primary border border-primary-subtle" : "bg-light text-dark border"}`}>
                            {log.role_id === 1 ? "Admin" : "Employee"}
                          </span>
                        </td>
                        <td className="pe-4 py-2">
                          <span className={`badge ${log.status === "Success"
                            ? "bg-success-subtle text-success border border-success-subtle"
                            : "bg-danger-subtle text-danger border border-danger-subtle"}`}>
                            {log.status === "Success"
                              ? <><i className="bi bi-check-circle me-1"></i>Success</>
                              : <><i className="bi bi-x-circle me-1"></i>{log.status || "Failed"}</>
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
                  <span className="small text-secondary">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} entries
                  </span>
                  <nav>
                    <ul className="pagination pagination-sm mb-0 gap-1">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link rounded" onClick={() => setCurrentPage(p => p - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <li className="page-item disabled"><span className="page-link">…</span></li>
                            )}
                            <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                              <button className="page-link rounded" onClick={() => setCurrentPage(p)}>{p}</button>
                            </li>
                          </React.Fragment>
                        ))}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link rounded" onClick={() => setCurrentPage(p => p + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
