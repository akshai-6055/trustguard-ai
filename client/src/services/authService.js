import axiosInstance from "./axiosInstance";

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (e) {
      // Ignore API failure on logout
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
};

export default authService;
