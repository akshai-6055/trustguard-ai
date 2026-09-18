import axiosInstance from "./axiosInstance";

const adminService = {
  // --- User Management ---
  getUsers: async () => {
    const response = await axiosInstance.get("/admin/users");
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axiosInstance.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await axiosInstance.put(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // --- Device Management ---
  getDevices: async () => {
    const response = await axiosInstance.get("/admin/devices");
    return response.data;
  },

  updateDeviceStatus: async (id, status) => {
    const response = await axiosInstance.put(`/admin/devices/${id}/status`, { status });
    return response.data;
  },

  deleteDevice: async (id) => {
    const response = await axiosInstance.delete(`/admin/devices/${id}`);
    return response.data;
  },

  // --- Policy Management ---
  getPolicies: async () => {
    const response = await axiosInstance.get("/admin/policies");
    return response.data;
  },

  getPolicyById: async (id) => {
    const response = await axiosInstance.get(`/admin/policies/${id}`);
    return response.data;
  },

  createPolicy: async (policyData) => {
    const response = await axiosInstance.post("/admin/policies", policyData);
    return response.data;
  },

  updatePolicy: async (id, policyData) => {
    const response = await axiosInstance.put(`/admin/policies/${id}`, policyData);
    return response.data;
  },

  deletePolicy: async (id) => {
    const response = await axiosInstance.delete(`/admin/policies/${id}`);
    return response.data;
  },

  // --- AI Risk Assessment ---
  getRiskAssessmentData: async () => {
    const response = await axiosInstance.get("/admin/risk-assessment");
    return response.data;
  },

  // --- Security Alerts ---
  getSecurityAlerts: async () => {
    const response = await axiosInstance.get("/admin/security-alerts");
    return response.data;
  },

  // --- Audit Logs ---
  getAuditLogs: async () => {
    const response = await axiosInstance.get("/admin/audit-logs");
    return response.data;
  }
};

export default adminService;
