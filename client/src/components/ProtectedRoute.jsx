import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Verifying Trust Level...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role based authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role_id;
    const userRoleName = user?.role_name ? user.role_name.toLowerCase() : "";

    const hasPermission = allowedRoles.some((role) => {
      if (typeof role === "number") return userRole === role;
      if (typeof role === "string") {
        const lower = role.toLowerCase();
        if (lower === "admin" || lower === "administrator") {
          return userRole === 1 || userRoleName === "admin" || userRoleName === "administrator";
        }
        if (lower === "employee") {
          return userRole === 2 || userRoleName === "employee";
        }
        return userRoleName === lower;
      }
      return false;
    });

    if (!hasPermission) {
      // Redirect unauthorized user to their default employee dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

