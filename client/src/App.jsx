import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import TrustedDevices from "./pages/TrustedDevices.jsx";
import PolicyManagement from "./pages/PolicyManagement.jsx";
import ContinuousAuthentication from "./pages/ContinuousAuthentication.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import UserDetails from "./pages/admin/UserDetails.jsx";
import DeviceManagement from "./pages/admin/DeviceManagement.jsx";
import AdminPolicyManagement from "./pages/admin/AdminPolicyManagement.jsx";
import AdminContinuousAuth from "./pages/admin/AdminContinuousAuthentication.jsx";
import SecurityAlerts from "./pages/admin/SecurityAlerts.jsx";
import AuditLogs from "./pages/admin/AuditLogs.jsx";

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Employee Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <UserDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/devices"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <DeviceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/policies"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <AdminPolicyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/continuous-authentication"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <AdminContinuousAuth />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security-alerts"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <SecurityAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Protected Profile Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trusted-devices"
        element={
          <ProtectedRoute>
            <TrustedDevices />
          </ProtectedRoute>
        }
      />

      {/* Protected Policy Management (PBAC) Routes */}
      <Route
        path="/policies"
        element={
          <ProtectedRoute>
            <PolicyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trustedguard-ai/policies"
        element={
          <ProtectedRoute>
            <PolicyManagement />
          </ProtectedRoute>
        }
      />

      {/* Protected Continuous Authentication (Module 4) Routes */}
      <Route
        path="/continuous-authentication"
        element={
          <ProtectedRoute>
            <ContinuousAuthentication />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trustedguard-ai/continuous-authentication"
        element={
          <ProtectedRoute>
            <ContinuousAuthentication />
          </ProtectedRoute>
        }
      />

      {/* Fallback to Landing */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;

