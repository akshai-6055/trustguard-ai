import React from "react";
import Navbar from "../components/Navbar";
import EmployeeSidebar from "../components/EmployeeSidebar";

const DashboardLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-vh-100 bg-light d-flex flex-column">

      {/* TOP NAVBAR */}
      <Navbar transparent={false} />

      {/* SIDEBAR + MAIN CONTENT */}
      <div className="d-flex flex-grow-1">

        {/* EMPLOYEE SIDEBAR */}
        <EmployeeSidebar />

        {/* MAIN PAGE AREA */}
        <div className="flex-grow-1 d-flex flex-column">

          {/* Header Banner */}
          <div className="bg-white border-bottom py-4 shadow-sm">
            <div className="container-fluid px-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">

                <div>
                  <h1 className="h3 fw-bold text-dark mb-1">
                    {title}
                  </h1>

                  {subtitle && (
                    <p className="text-muted small mb-0">
                      {subtitle}
                    </p>
                  )}
                </div>

                <div className="mt-3 mt-md-0">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill small">
                    <i className="bi bi-shield-lock me-1"></i>
                    Zero Trust Session Verified
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <main className="flex-grow-1 py-4">
            <div className="container-fluid px-4">
              {children}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="bg-white border-top py-3 text-center text-secondary small mt-auto">
            <div className="container-fluid">
              <span>
                &copy; {new Date().getFullYear()} TrustGuard AI –
                Adaptive Zero Trust Security Platform.
              </span>
            </div>
          </footer>

        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;