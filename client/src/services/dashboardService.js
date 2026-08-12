import axiosInstance from "./axiosInstance";

export const dashboardService = {
  // Get Employee Dashboard statistics
  getEmployeeDashboard: async () => {
    const response = await axiosInstance.get("/user/dashboard");
    return response.data;
  },

  // Get Admin Dashboard statistics
  getAdminDashboard: async () => {
    const response = await axiosInstance.get("/admin/dashboard");
    return response.data;
  }
};

export default dashboardService;
