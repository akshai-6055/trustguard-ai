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

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
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

      {/* Protected Admin Dashboard Route */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[1, "Administrator", "Admin"]}>
            <AdminDashboard />
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

