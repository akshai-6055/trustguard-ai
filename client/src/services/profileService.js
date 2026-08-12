import axiosInstance from "./axiosInstance";

export const profileService = {
  // View Profile
  getProfile: async () => {
    const response = await axiosInstance.get("/users/profile");
    return response.data;
  },

  // Update Profile (Full Name, Email)
  updateProfile: async (full_name, email) => {
    const response = await axiosInstance.put("/users/profile", { full_name, email });
    return response.data;
  },

  // Change Password
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await axiosInstance.put("/users/change-password", {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  }
};

export default profileService;
