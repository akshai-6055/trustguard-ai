import axiosInstance from "./axiosInstance";

/**
 * Continuous Authentication Service for Module 4
 * Evaluates whether an authenticated employee should continue accessing protected resources
 * based on live context, telemetry, trust scores, and security policies.
 */
export const continuousAuthService = {
  // Evaluate continuous authentication access
  evaluateAccess: async (data) => {
    const response = await axiosInstance.post(
      "/continuous-auth/evaluate",
      data
    );
    return response.data;
  }
};

// Named function export for direct import flexibility
export const evaluateAccess = continuousAuthService.evaluateAccess;

export default continuousAuthService;
