import axiosInstance from "./axiosInstance";

/**
 * Policy Service for Module 3 - Policy-Based Access Control (PBAC)
 * Communicates with backend /api/policies endpoints using axiosInstance (JWT attached automatically).
 */
export const policyService = {
  // Get all security policies
  getAllPolicies: async () => {
    const response = await axiosInstance.get("/policies");
    return response.data;
  },

  // Get a single policy by ID
  getPolicyById: async (id) => {
    const response = await axiosInstance.get(`/policies/${id}`);
    return response.data;
  },

  // Create a new security policy (Admin only)
  createPolicy: async (policyData) => {
    const response = await axiosInstance.post("/policies", policyData);
    return response.data;
  },

  // Update an existing security policy (Admin only)
  updatePolicy: async (id, policyData) => {
    const response = await axiosInstance.put(`/policies/${id}`, policyData);
    return response.data;
  },

  // Delete a security policy (Admin only)
  deletePolicy: async (id) => {
    const response = await axiosInstance.delete(`/policies/${id}`);
    return response.data;
  }
};

// Named function exports for direct import flexibility
export const getAllPolicies = policyService.getAllPolicies;
export const getPolicyById = policyService.getPolicyById;
export const createPolicy = policyService.createPolicy;
export const updatePolicy = policyService.updatePolicy;
export const deletePolicy = policyService.deletePolicy;

export default policyService;
