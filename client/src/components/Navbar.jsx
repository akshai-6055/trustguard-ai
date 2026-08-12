import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ transparent }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const navClass = transparent
    ? "navbar navbar-expand-lg navbar-dark bg-transparent position-absolute top-0 start-0 end-0 px-4 py-3"
    : "navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3";
  const actionLinkClass = transparent ? "text-decoration-none text-white fw-semibold me-2" : "text-decoration-none text-dark fw-semibold me-2";
  const actionButtonClass = transparent
    ? "btn btn-outline-light rounded-pill px-4 py-2 fw-semibold"
    : "btn btn-primary rounded-pill px-4 py-2 fw-semibold";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className={navClass}>
      <div className="container">
        {/* Brand Logo */}
        <Link className={"navbar-brand d-flex align-items-center fw-bold fs-4 " + (transparent ? "text-white" : "text-dark")} to="/">
          <span className={"me-1 fs-3 " + (transparent ? "text-info" : "text-primary")}>TrustGuard</span>
          <span className={transparent ? "fw-normal text-white-50" : "fw-normal text-secondary"}>AI</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#trustguardNavbar"
          aria-controls="trustguardNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav Items */}

          {/* Action Buttons */}
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                {/* Dashboard link */}
                <Link
                  to={user?.role_id === 1 || user?.role_name?.toLowerCase() === "admin" || user?.role_name?.toLowerCase() === "administrator" ? "/admin/dashboard" : "/dashboard"}
                  className={transparent ? "nav-link text-white fw-semibold" : "nav-link text-dark fw-semibold"}
                >
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Link>

                {/* Profile link */}
                <Link
                  to="/profile"
                  className={transparent ? "nav-link text-white fw-semibold" : "nav-link text-dark fw-semibold"}
                >
                  <i className="bi bi-person-circle me-1"></i> Profile
                </Link>

                {/* User Avatar, Name & Role Badge */}
                <div className="d-flex align-items-center gap-2 bg-light bg-opacity-75 px-3 py-1 rounded-pill border">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}
                  >
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="d-flex flex-column text-start" style={{ lineHeight: "1.1" }}>
                    <span className="fw-semibold text-dark small">{user?.full_name || "User"}</span>
                    <span className="badge bg-secondary-subtle text-secondary border px-1" style={{ fontSize: "0.65rem" }}>
                      {user?.role_name || (user?.role_id === 1 ? "Administrator" : "Employee")}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
                >
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className={actionLinkClass}>
                  Login
                </Link>
                <Link to="/register" className={actionButtonClass}>
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
    </nav>
  );
};

export default Navbar;
